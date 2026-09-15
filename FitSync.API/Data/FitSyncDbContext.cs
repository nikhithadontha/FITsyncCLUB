using FitSync_API.Models;
using Microsoft.EntityFrameworkCore;

namespace FitSync_API.Data
{
    public class FitSyncDbContext : DbContext
    {
        public FitSyncDbContext(
            DbContextOptions<FitSyncDbContext> options)
            : base(options)
        {
        }

        // =========================
        // DbSets
        // =========================

        public DbSet<User> Users { get; set; }

        public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }

        public DbSet<Trainer> Trainers { get; set; }

        public DbSet<TrainerAvailability> TrainerAvailabilities { get; set; }

        public DbSet<TrainingSlot> TrainingSlots { get; set; }

        public DbSet<Booking> Bookings { get; set; }

        public DbSet<OnlineSession> OnlineSessions { get; set; }

        public DbSet<SubscriptionPlan> SubscriptionPlans { get; set; }

        public DbSet<UserSubscription> UserSubscriptions { get; set; }

        public DbSet<Workout> Workouts { get; set; }

        public DbSet<WorkoutExercise> WorkoutExercises { get; set; }

        public DbSet<WorkoutLog> WorkoutLogs { get; set; }

        public DbSet<WorkoutSession> WorkoutSessions { get; set; }

        public DbSet<DietPlan> DietPlans { get; set; }

        public DbSet<DietMeal> DietMeals { get; set; }

        public DbSet<UserDietPlan> UserDietPlans { get; set; }

        public DbSet<DietProfile> DietProfiles { get; set; }

        public DbSet<ClassSchedule> ClassSchedules { get; set; }

        public DbSet<Facility> Facilities { get; set; }

        public DbSet<Announcement> Announcements { get; set; }


        // =========================
        // Model Configuration
        // =========================

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Explicit SQL precision prevents EF Core decimal truncation warnings.
            modelBuilder.Entity<DietProfile>().Property(x => x.Bmr).HasPrecision(18, 2);
            modelBuilder.Entity<DietProfile>().Property(x => x.HeightCm).HasPrecision(18, 2);
            modelBuilder.Entity<DietProfile>().Property(x => x.Tdee).HasPrecision(18, 2);
            modelBuilder.Entity<DietProfile>().Property(x => x.WeightKg).HasPrecision(18, 2);
            modelBuilder.Entity<SubscriptionPlan>().Property(x => x.Price).HasPrecision(18, 2);
            modelBuilder.Entity<User>().Property(x => x.HeightCm).HasPrecision(18, 2);
            modelBuilder.Entity<User>().Property(x => x.WeightKg).HasPrecision(18, 2);

            // =========================
            // USER
            // =========================

            modelBuilder.Entity<User>()
                .HasKey(u => u.Id);

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();


            // =========================
            // PASSWORD RESET TOKEN
            // =========================

            modelBuilder.Entity<PasswordResetToken>()
                .HasKey(t => t.Id);

            modelBuilder.Entity<PasswordResetToken>()
                .HasOne(t => t.User)
                .WithMany()
                .HasForeignKey(t => t.UserId)
                .OnDelete(DeleteBehavior.Cascade);


            // =========================
            // TRAINER
            // =========================

            modelBuilder.Entity<Trainer>()
                .HasKey(t => t.TrainerId);

            modelBuilder.Entity<Trainer>()
                .HasIndex(t => t.Email)
                .IsUnique();


            // =========================
            // TRAINER AVAILABILITY
            // =========================

            modelBuilder.Entity<TrainerAvailability>()
                .HasKey(a => a.AvailabilityId);

            modelBuilder.Entity<TrainerAvailability>()
                .HasOne(a => a.Trainer)
                .WithMany()
                .HasForeignKey(a => a.TrainerId)
                .OnDelete(DeleteBehavior.Cascade);


            // =========================
            // TRAINING SLOT
            // =========================

            modelBuilder.Entity<TrainingSlot>()
                .HasKey(s => s.SlotId);

            modelBuilder.Entity<TrainingSlot>()
                .HasOne(s => s.Trainer)
                .WithMany()
                .HasForeignKey(s => s.TrainerId)
                .OnDelete(DeleteBehavior.Cascade);


            // =========================
            // BOOKING
            // =========================

            modelBuilder.Entity<Booking>()
                .HasKey(b => b.BookingId);

            modelBuilder.Entity<Booking>()
                .HasOne(b => b.User)
                .WithMany()
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Booking>()
                .HasOne(b => b.Trainer)
                .WithMany()
                .HasForeignKey(b => b.TrainerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Booking>()
                .HasOne(b => b.TrainingSlot)
                .WithMany()
                .HasForeignKey(b => b.SlotId)
                .OnDelete(DeleteBehavior.Restrict);


            // =========================
            // ONLINE SESSION
            // =========================

            modelBuilder.Entity<OnlineSession>()
                .HasKey(o => o.SessionId);

            modelBuilder.Entity<OnlineSession>()
                .HasOne(o => o.Booking)
                .WithMany()
                .HasForeignKey(o => o.BookingId)
                .OnDelete(DeleteBehavior.Cascade);


            // =========================
            // SUBSCRIPTION PLAN
            // =========================

            modelBuilder.Entity<SubscriptionPlan>()
                .HasKey(p => p.PlanId);

            modelBuilder.Entity<SubscriptionPlan>()
                .HasIndex(p => p.PlanName)
                .IsUnique();


            // =========================
            // USER SUBSCRIPTION
            // =========================

            modelBuilder.Entity<UserSubscription>()
                .HasKey(s => s.UserSubscriptionId);

            modelBuilder.Entity<UserSubscription>()
                .HasOne(s => s.User)
                .WithMany()
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<UserSubscription>()
                .HasOne(s => s.Plan)
                .WithMany()
                .HasForeignKey(s => s.PlanId)
                .OnDelete(DeleteBehavior.Restrict);


            // =========================
            // WORKOUT
            // =========================

            modelBuilder.Entity<Workout>()
                .HasKey(w => w.WorkoutId);


            // =========================
            // WORKOUT EXERCISE
            // =========================

            modelBuilder.Entity<WorkoutExercise>()
                .HasKey(e => e.ExerciseId);

            modelBuilder.Entity<WorkoutExercise>()
                .HasOne(e => e.Workout)
                .WithMany(w => w.Exercises)
                .HasForeignKey(e => e.WorkoutId)
                .OnDelete(DeleteBehavior.Cascade);


            // =========================
            // WORKOUT LOG
            // =========================

            modelBuilder.Entity<WorkoutLog>()
                .HasKey(l => l.LogId);

            modelBuilder.Entity<WorkoutLog>()
                .HasOne(l => l.User)
                .WithMany()
                .HasForeignKey(l => l.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<WorkoutLog>()
                .HasOne(l => l.Workout)
                .WithMany()
                .HasForeignKey(l => l.WorkoutId)
                .OnDelete(DeleteBehavior.Restrict);


            // =========================
            // WORKOUT SESSION
            // =========================

            modelBuilder.Entity<WorkoutSession>()
                .HasKey(s => s.SessionId);

            modelBuilder.Entity<WorkoutSession>()
                .HasOne(s => s.User)
                .WithMany()
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<WorkoutSession>()
                .HasOne(s => s.Workout)
                .WithMany()
                .HasForeignKey(s => s.WorkoutId)
                .OnDelete(DeleteBehavior.Restrict);


            // =========================
            // DIET PLAN
            // =========================

            modelBuilder.Entity<DietPlan>()
                .HasKey(d => d.DietPlanId);


            // =========================
            // DIET MEAL
            // =========================

            modelBuilder.Entity<DietMeal>()
                .HasKey(m => m.MealId);

            modelBuilder.Entity<DietMeal>()
                .HasOne(m => m.DietPlan)
                .WithMany(d => d.Meals)
                .HasForeignKey(m => m.DietPlanId)
                .OnDelete(DeleteBehavior.Cascade);


            // =========================
            // USER DIET PLAN
            // =========================

            modelBuilder.Entity<UserDietPlan>()
                .HasKey(u => u.UserDietPlanId);

            modelBuilder.Entity<UserDietPlan>()
                .HasOne(u => u.User)
                .WithMany()
                .HasForeignKey(u => u.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserDietPlan>()
                .HasOne(u => u.DietPlan)
                .WithMany()
                .HasForeignKey(u => u.DietPlanId)
                .OnDelete(DeleteBehavior.Restrict);


            // =========================
            // DIET PROFILE
            // =========================

            modelBuilder.Entity<DietProfile>()
                .HasKey(p => p.ProfileId);

            modelBuilder.Entity<DietProfile>()
                .HasIndex(p => p.UserId)
                .IsUnique();

            modelBuilder.Entity<DietProfile>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);


            // =========================
            // CLASS SCHEDULE (Admin)
            // =========================

            modelBuilder.Entity<ClassSchedule>()
                .HasKey(c => c.ClassId);


            // =========================
            // FACILITY (Admin)
            // =========================

            modelBuilder.Entity<Facility>()
                .HasKey(f => f.FacilityId);


            // =========================
            // ANNOUNCEMENT (Admin)
            // =========================

            modelBuilder.Entity<Announcement>()
                .HasKey(a => a.AnnouncementId);
        }
    }
}