using backend.Data;
using backend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Npgsql;
using Npgsql.NameTranslation;
using Scalar.AspNetCore;
using System.Text;
using System.Text.Encodings.Web;
using System.Threading.Tasks;

var builder = WebApplication.CreateBuilder(args);

// ─── Database ─────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ─── Controllers ──────────────────────────────────────────────────────────────
builder.Services.AddControllers().AddJsonOptions(o =>
{
    // Türkçe ve diğer Unicode metinlerin JSON çıktısında düzgün görünmesi (aşırı \u kaçışlarını azaltır)
    o.JsonSerializerOptions.Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping;
});

// ─── OpenAPI / Swagger ────────────────────────────────────────────────────────
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, context, cancellationToken) =>
    {
        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes.Add("Bearer", new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            Description = "JWT Authorization header using the Bearer scheme."
        });

        document.SecurityRequirements.Add(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
        });

        return Task.CompletedTask;
    });
});

// ─── JWT Authentication ───────────────────────────────────────────────────────
var jwtSettings = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSettings["Key"]
    ?? throw new InvalidOperationException("JWT Key is not configured. Use 'dotnet user-secrets set \"Jwt:Key\" <value>' for development or set the Jwt__Key environment variable.");

// Guard against unreplaced placeholder values (appsettings.json template defaults)
if (jwtKey.StartsWith("__SET_VIA_") || jwtKey.Length < 32)
{
    throw new InvalidOperationException(
        "JWT Key looks like a placeholder or is too short (< 32 chars). " +
        "Run 'dotnet user-secrets set \"Jwt:Key\" <long-random-string>' in the backend folder, " +
        "or set the Jwt__Key environment variable in production.");
}

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = jwtSettings["Issuer"],
            ValidAudience            = jwtSettings["Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// ─── Custom Services ──────────────────────────────────────────────────────────
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IAdvisorProfileService, AdvisorProfileService>();
builder.Services.AddScoped<IAdvisorAvailabilityService, AdvisorAvailabilityService>();

// ─── CORS ─────────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000"    // Next.js dev server
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// ─── Build ────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ─── Ensure PostgreSQL implicit casts exist for enum types ─────────────────────
// This allows EF Core to send enum values as text strings and let PostgreSQL
// automatically convert them to the native enum types.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.ExecuteSqlRaw(@"
        DO $$
        BEGIN
            BEGIN CREATE CAST (text AS project_status_enum) WITH INOUT AS IMPLICIT;
            EXCEPTION WHEN duplicate_object THEN NULL; END;
            BEGIN CREATE CAST (text AS request_status_enum) WITH INOUT AS IMPLICIT;
            EXCEPTION WHEN duplicate_object THEN NULL; END;

            -- Ensure capacity tracking column exists
            BEGIN 
                ALTER TABLE project_categories ADD COLUMN IF NOT EXISTS max_projects_per_advisor integer;
            EXCEPTION WHEN others THEN NULL; END;

            -- Ensure per-category color column exists (hex #RRGGBB). Unique per category.
            BEGIN
                ALTER TABLE project_categories ADD COLUMN IF NOT EXISTS color varchar(7);
            EXCEPTION WHEN others THEN NULL; END;

            -- Backfill legacy rows that predate the color column with a placeholder
            -- so the NOT NULL + UNIQUE constraints below can be applied safely.
            BEGIN
                UPDATE project_categories
                SET color = lower('#' || substr(md5(id::text || name), 1, 6))
                WHERE color IS NULL OR color = '';
            EXCEPTION WHEN others THEN NULL; END;

            BEGIN
                ALTER TABLE project_categories ALTER COLUMN color SET NOT NULL;
            EXCEPTION WHEN others THEN NULL; END;

            BEGIN
                CREATE UNIQUE INDEX IF NOT EXISTS ux_project_categories_color
                    ON project_categories (lower(color));
            EXCEPTION WHEN others THEN NULL; END;

            -- Ensure notifications table exists
            BEGIN
                CREATE TABLE IF NOT EXISTS notifications (
                    id integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    user_id integer NOT NULL,
                    title character varying(255) NOT NULL,
                    body text NOT NULL,
                    is_read boolean NOT NULL DEFAULT false,
                    kind character varying(50) NOT NULL DEFAULT 'system',
                    project_category character varying(100),
                    created_at timestamp with time zone NOT NULL DEFAULT now(),
                    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
                );
            EXCEPTION WHEN others THEN NULL; END;

            -- Ensure advisor category preference table exists
            BEGIN
                CREATE TABLE IF NOT EXISTS advisor_category_preferences (
                    id integer GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    advisor_id integer NOT NULL REFERENCES advisor_profiles (id) ON DELETE CASCADE,
                    category_id integer NOT NULL REFERENCES project_categories (id) ON DELETE CASCADE,
                    CONSTRAINT uq_advisor_category_preferences UNIQUE (advisor_id, category_id)
                );
            EXCEPTION WHEN others THEN NULL; END;
        END $$;
    ");
}

if (app.Environment.IsDevelopment())
{
    // Exposes the raw OpenAPI JSON spec at: /openapi/v1.json
    app.MapOpenApi();

    // Scalar interactive UI available at: /scalar/v1
    app.MapScalarApiReference();
}

app.UseHttpsRedirection();

// CORS must come before Authentication & Authorization
app.UseCors("AllowFrontend");

// Authentication & Authorization middleware must come before MapControllers
app.UseAuthentication();
app.UseAuthorization();

// ─── Minimal API Endpoints ────────────────────────────────────────────────────
app.MapGet("/test-db", (AppDbContext context) =>
{
    try
    {
        bool isConnected = context.Database.CanConnect();
        return isConnected
            ? "PostgreSQL connection successful! 🚀"
            : "Could not connect to the database. ❌";
    }
    catch (Exception ex)
    {
        return $"Error: {ex.Message}";
    }
});

// ─── Controller Routes ────────────────────────────────────────────────────────
app.MapGet("/", () => Results.Redirect("/scalar/v1"));

app.MapControllers();

/* // ─── Auto-launch Scalar UI in the default browser on startup (Development only) ──
if (app.Environment.IsDevelopment())
{
    app.Lifetime.ApplicationStarted.Register(() =>
    {
        var url = "http://localhost:5048/scalar/v1";
        try
        {
            System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
            {
                FileName = url,
                UseShellExecute = true
            });
        }
        catch
        {
            // Silently ignore if the browser cannot be opened
        }
    });
} */

app.Run();
