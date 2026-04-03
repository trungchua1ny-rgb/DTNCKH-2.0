using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using TimDongDoi.API.Models;

namespace TimDongDoi.API.Data;

public partial class AppDbContext : DbContext
{
    public AppDbContext()
    {
    }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    // --- DbSet ---
    public DbSet<Skill> Skills { get; set; } = null!;
    public DbSet<UserSkill> UserSkills { get; set; } = null!;
    public virtual DbSet<AdminLog> AdminLogs { get; set; }
    public virtual DbSet<Application> Applications { get; set; }
    public virtual DbSet<ApplicationTest> ApplicationTests { get; set; }
    public virtual DbSet<User> Users { get; set; }
    public virtual DbSet<Company> Companies { get; set; }
    public virtual DbSet<CompanyLocation> CompanyLocations { get; set; }
    public virtual DbSet<CompanyVerification> CompanyVerifications { get; set; }
    public virtual DbSet<UserExperience> UserExperiences { get; set; }
    public virtual DbSet<UserEducation> UserEducations { get; set; }
    public virtual DbSet<Job> Jobs { get; set; }
    public virtual DbSet<JobSkill> JobSkills { get; set; }
    public virtual DbSet<SavedJob> SavedJobs { get; set; }
    public virtual DbSet<Test> Tests { get; set; }
    public virtual DbSet<TestQuestion> TestQuestions { get; set; }
    public virtual DbSet<JobTest> JobTests { get; set; }
    public virtual DbSet<Interview> Interviews { get; set; }
    public virtual DbSet<Project> Projects { get; set; }
    public virtual DbSet<ProjectPosition> ProjectPositions { get; set; }
    public virtual DbSet<ProjectPositionSkill> ProjectPositionSkills { get; set; }
    public virtual DbSet<ProjectApplication> ProjectApplications { get; set; }
    public virtual DbSet<ProjectMember> ProjectMembers { get; set; }
    public virtual DbSet<Review> Reviews { get; set; }
    public virtual DbSet<Notification> Notifications { get; set; }
    public virtual DbSet<Message> Messages { get; set; }
    public virtual DbSet<Report> Reports { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ==================== MESSAGE ====================
        modelBuilder.Entity<Message>(entity =>
        {
            entity.ToTable("messages");
            entity.HasOne(m => m.FromUser)
                  .WithMany(u => u.MessageFromUsers)
                  .HasForeignKey(m => m.FromUserId)
                  .OnDelete(DeleteBehavior.ClientSetNull);

            entity.HasOne(m => m.ToUser)
                  .WithMany(u => u.MessageToUsers)
                  .HasForeignKey(m => m.ToUserId)
                  .OnDelete(DeleteBehavior.ClientSetNull);
        });

        // ==================== USER ====================
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => e.Email).IsUnique();
            entity.HasIndex(e => e.Email, "idx_users_email");
            entity.HasIndex(e => e.Role, "idx_users_role");
            entity.HasIndex(e => e.Status, "idx_users_status");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AboutMe).HasColumnName("about_me");
            entity.Property(e => e.Address).HasMaxLength(255).HasColumnName("address");
            entity.Property(e => e.Avatar).HasMaxLength(255).HasColumnName("avatar");
            entity.Property(e => e.Birthday).HasColumnName("birthday");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("created_at");
            entity.Property(e => e.CvFile).HasMaxLength(255).HasColumnName("cv_file");
            entity.Property(e => e.Email).HasMaxLength(100).HasColumnName("email");
            entity.Property(e => e.FullName).HasMaxLength(100).HasColumnName("full_name");
            entity.Property(e => e.Gender).HasMaxLength(10).HasColumnName("gender");
            entity.Property(e => e.JobTitle).HasMaxLength(100).HasColumnName("job_title");
            entity.Property(e => e.Phone).HasMaxLength(20).HasColumnName("phone");
            entity.Property(e => e.Role).HasMaxLength(20).HasDefaultValue("user").HasColumnName("role");
            entity.Property(e => e.SalaryExpectation).HasColumnName("salary_expectation");
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("active").HasColumnName("status");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()").HasColumnName("updated_at");
        });

        // ==================== SKILL ====================
        modelBuilder.Entity<Skill>(entity =>
        {
            entity.ToTable("skills");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name).HasColumnName("name");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("created_at");
        });

        // ==================== USER SKILL ====================
        modelBuilder.Entity<UserSkill>(entity =>
        {
            entity.ToTable("user_skills");
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.YearsExperience).HasColumnName("years_experience").HasColumnType("numeric(18, 2)"); 

            entity.HasOne(us => us.Skill).WithMany().HasForeignKey(us => us.SkillId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(us => us.User).WithMany(u => u.UserSkills).HasForeignKey(us => us.UserId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(d => d.Skill)
      .WithMany() // Hoặc .WithMany(p => p.UserSkills) nếu bên class Skill có khai báo List<UserSkill>
      .HasForeignKey(d => d.SkillId); // Đây là dòng quan quan trọng nhất để triệt tiêu SkillId1
        });

        // ==================== COMPANY ====================
        modelBuilder.Entity<Company>(entity =>
        {
            entity.ToTable("companies");
            entity.Property(e => e.VerificationStatus).HasMaxLength(20).HasDefaultValue("pending").HasColumnName("verification_status");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("created_at");

            entity.HasOne(d => d.User).WithOne(p => p.Company)
                .HasForeignKey<Company>(d => d.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ==================== JOB ====================
        modelBuilder.Entity<Job>(entity =>
        {
            entity.ToTable("jobs");
            entity.Property(e => e.SalaryCurrency).HasMaxLength(10).HasDefaultValue("VND").HasColumnName("salary_currency");
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("open").HasColumnName("status");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("now()").HasColumnName("updated_at");

            entity.HasOne(d => d.Company).WithMany(p => p.Jobs).HasForeignKey(d => d.CompanyId).OnDelete(DeleteBehavior.Cascade);
        });

        // ==================== APPLICATION ====================
        modelBuilder.Entity<Application>(entity =>
        {
            entity.ToTable("applications");
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("pending").HasColumnName("status");
            entity.Property(e => e.AppliedAt).HasDefaultValueSql("now()").HasColumnName("applied_at");

            entity.HasOne(d => d.User).WithMany(p => p.Applications).HasForeignKey(d => d.UserId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(d => d.Job).WithMany(p => p.Applications).HasForeignKey(d => d.JobId).OnDelete(DeleteBehavior.NoAction);
        });

        // ==================== PROJECT ====================
        modelBuilder.Entity<Project>(entity =>
        {
            entity.ToTable("projects");
            entity.Property(e => e.Status).HasMaxLength(20).HasDefaultValue("open").HasColumnName("status");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("now()").HasColumnName("created_at");

            entity.HasOne(p => p.User).WithMany(u => u.Projects).HasForeignKey(p => p.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        // ==================== PROJECT POSITION SKILL ====================
        modelBuilder.Entity<ProjectPositionSkill>(entity =>
        {
            entity.ToTable("project_position_skills");
            entity.HasOne(pps => pps.Position).WithMany(p => p.ProjectPositionSkills).HasForeignKey(pps => pps.PositionId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(pps => pps.Skill).WithMany().HasForeignKey(pps => pps.SkillId).OnDelete(DeleteBehavior.Cascade);
        });

        // ==================== REVIEW ====================
        modelBuilder.Entity<Review>(entity =>
        {
            entity.ToTable("reviews");
            entity.HasOne(d => d.FromUser).WithMany().HasForeignKey(d => d.FromUserId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(d => d.ToUser).WithMany().HasForeignKey(d => d.ToUserId).OnDelete(DeleteBehavior.NoAction);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}