using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // Temel Tablolar
        public DbSet<Role> Roles { get; set; }
        public DbSet<User> Users { get; set; }

        // Profil Tablolari
        public DbSet<StudentProfile> StudentProfiles { get; set; }
        public DbSet<AdvisorProfile> AdvisorProfiles { get; set; }

        // Proje Tablolari
        public DbSet<ProjectCategory> ProjectCategories { get; set; }
        public DbSet<Project> Projects { get; set; }

        // Yetenek Tablolari
        public DbSet<Skill> Skills { get; set; }
        public DbSet<UserSkill> UserSkills { get; set; }
        public DbSet<ProjectSkill> ProjectSkills { get; set; }

        // Uyelik ve Istek Tablolari
        public DbSet<ProjectMember> ProjectMembers { get; set; }
        public DbSet<StudentRequest> StudentRequests { get; set; }
        public DbSet<AdvisorRequest> AdvisorRequests { get; set; }

        // Duyuru Tablosu
        public DbSet<Announcement> Announcements { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // PostgreSQL Enum Donusumleri (string olarak saklanir)
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
        }
    }
}
