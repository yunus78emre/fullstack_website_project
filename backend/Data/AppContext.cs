using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // Core Tables
        public DbSet<Role> Roles { get; set; } = null!;
        public DbSet<User> Users { get; set; } = null!;

        // Profile Tables
        public DbSet<StudentProfile> StudentProfiles { get; set; } = null!;
        public DbSet<AdvisorProfile> AdvisorProfiles { get; set; } = null!;
        public DbSet<AdvisorCategoryPreference> AdvisorCategoryPreferences { get; set; } = null!;

        // Project Tables
        public DbSet<ProjectCategory> ProjectCategories { get; set; } = null!;
        public DbSet<Project> Projects { get; set; } = null!;

        // Skill Tables
        public DbSet<Skill> Skills { get; set; } = null!;
        public DbSet<UserSkill> UserSkills { get; set; } = null!;
        public DbSet<ProjectSkill> ProjectSkills { get; set; } = null!;

        // Membership & Request Tables
        public DbSet<ProjectMember> ProjectMembers { get; set; } = null!;
        public DbSet<StudentRequest> StudentRequests { get; set; } = null!;
        public DbSet<AdvisorRequest> AdvisorRequests { get; set; } = null!;

        // Announcement Table
        public DbSet<Announcement> Announcements { get; set; } = null!;

        // Notifications
        public DbSet<Notification> Notifications { get; set; } = null!;

        // Authentication
        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // PostgreSQL enum columns: EF Core sends values as text strings via HasConversion,
            // and PostgreSQL implicit casts (created at startup) auto-convert text → native enum.
            modelBuilder.Entity<Project>()
                .Property(p => p.Status)
                .HasConversion<string>();

            modelBuilder.Entity<StudentRequest>()
                .Property(sr => sr.Status)
                .HasConversion<string>();

            modelBuilder.Entity<AdvisorRequest>()
                .Property(ar => ar.Status)
                .HasConversion<string>();

            // User - Role Iliskisi
            modelBuilder.Entity<User>()
                .HasOne(u => u.Role)
                .WithMany()
                .HasForeignKey(u => u.RoleId);

            // StudentProfile - User Iliskisi (1-to-1)
            modelBuilder.Entity<StudentProfile>()
                .HasOne(sp => sp.User)
                .WithOne()
                .HasForeignKey<StudentProfile>(sp => sp.UserId);

            // AdvisorProfile - User Iliskisi (1-to-1)
            modelBuilder.Entity<AdvisorProfile>()
                .HasOne(ap => ap.User)
                .WithOne()
                .HasForeignKey<AdvisorProfile>(ap => ap.UserId);

            modelBuilder.Entity<AdvisorCategoryPreference>()
                .HasOne(acp => acp.Advisor)
                .WithMany()
                .HasForeignKey(acp => acp.AdvisorId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<AdvisorCategoryPreference>()
                .HasOne(acp => acp.Category)
                .WithMany()
                .HasForeignKey(acp => acp.CategoryId)
                .OnDelete(DeleteBehavior.Cascade);

            // Notification - User Iliskisi
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId);

            // Project Iliskileri
            modelBuilder.Entity<Project>()
                .HasOne(p => p.OwnerStudent)
                .WithMany()
                .HasForeignKey(p => p.OwnerStudentId);

            modelBuilder.Entity<Project>()
                .HasOne(p => p.AdvisorAssigned)
                .WithMany()
                .HasForeignKey(p => p.AdvisorAssignedId);

            modelBuilder.Entity<Project>()
                .HasOne(p => p.Category)
                .WithMany()
                .HasForeignKey(p => p.CategoryId);

            // Unique Constraint'ler
            modelBuilder.Entity<UserSkill>()
                .HasIndex(us => new { us.UserId, us.SkillId })
                .IsUnique();

            modelBuilder.Entity<ProjectSkill>()
                .HasIndex(ps => new { ps.ProjectId, ps.SkillId })
                .IsUnique();

            modelBuilder.Entity<ProjectMember>()
                .HasIndex(pm => new { pm.ProjectId, pm.StudentId })
                .IsUnique();

            modelBuilder.Entity<StudentRequest>()
                .HasIndex(sr => new { sr.ProjectId, sr.ApplicantStudentId })
                .IsUnique();

            modelBuilder.Entity<AdvisorRequest>()
                .HasIndex(ar => new { ar.ProjectId, ar.AdvisorId })
                .IsUnique();

            modelBuilder.Entity<AdvisorCategoryPreference>()
                .HasIndex(acp => new { acp.AdvisorId, acp.CategoryId })
                .IsUnique();
        }
    }
}
