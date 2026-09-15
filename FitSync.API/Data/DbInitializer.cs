using FitSync_API.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;

namespace FitSync_API.Data
{
    public static class DbInitializer
    {
        public static void Initialize(FitSyncDbContext context)
        {
            // Creates the database file and all tables if they do not exist.
            // NOTE: EnsureCreated() only builds the schema the FIRST time the
            // database itself is created - if you already had a FitSync.db
            // (or SQL Server FitSyncDB) from before the Admin Portal tables
            // were added, EnsureCreated() will NOT add them for you. The
            // call below patches that in, safely, on every startup.
            context.Database.EnsureCreated();
            EnsureAdminTablesExist(context);

            // Seed the default Admin account (Users table)
            // Login with: admin@fitsync.com / Admin@123
            if (!context.Users.Any(u => u.Role == "Admin"))
            {
                var admin = new User
                {
                    FullName = "System Admin",
                    Email = "admin@fitsync.com",
                    PhoneNumber = "9876543210",
                    Role = "Admin",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                var hasher = new PasswordHasher<User>();
                admin.PasswordHash = hasher.HashPassword(admin, "Admin@123");

                context.Users.Add(admin);
                context.SaveChanges();
            }

            // Seed Subscription Plans
            if (!context.SubscriptionPlans.Any())
            {
                context.SubscriptionPlans.AddRange(
                    new SubscriptionPlan { PlanName = "Basic", Description = "Access to the workout library and progress tracking.", DurationDays = 30, Price = 499.00m, IsActive = true, CreatedAt = DateTime.UtcNow },
                    new SubscriptionPlan { PlanName = "Pro", Description = "Everything in Basic plus unlimited trainer bookings.", DurationDays = 30, Price = 1499.00m, IsActive = true, CreatedAt = DateTime.UtcNow },
                    new SubscriptionPlan { PlanName = "Elite", Description = "Everything in Pro plus 1:1 online coaching sessions.", DurationDays = 90, Price = 3999.00m, IsActive = true, CreatedAt = DateTime.UtcNow }
                );
                context.SaveChanges();
            }

            // Seed Trainers
            if (!context.Trainers.Any())
            {
                context.Trainers.AddRange(
                    new Trainer { FullName = "Arjun Mehta", Email = "arjun.mehta@fitsync.com", PhoneNumber = "9000000001", Specialization = "Strength Training", ExperienceYears = 6, Bio = "Strength coach focused on clean form and progressive overload.", IsActive = true, CreatedAt = DateTime.UtcNow },
                    new Trainer { FullName = "Sara Kapoor", Email = "sara.kapoor@fitsync.com", PhoneNumber = "9000000002", Specialization = "Yoga", ExperienceYears = 8, Bio = "Yoga instructor specializing in flexibility and mindful movement.", IsActive = true, CreatedAt = DateTime.UtcNow },
                    new Trainer { FullName = "Rohit Nair", Email = "rohit.nair@fitsync.com", PhoneNumber = "9000000003", Specialization = "HIIT", ExperienceYears = 5, Bio = "High-intensity coach for fast, effective fat-burning sessions.", IsActive = true, CreatedAt = DateTime.UtcNow },
                    new Trainer { FullName = "Divya Rao", Email = "divya.rao@fitsync.com", PhoneNumber = "9000000004", Specialization = "Cardio", ExperienceYears = 4, Bio = "Cardio and endurance specialist for all fitness levels.", IsActive = true, CreatedAt = DateTime.UtcNow }
                );
                context.SaveChanges();
            }

            // Keep every active trainer stocked with bookable slots.
            // Runs on every startup (not just once) so slots never go stale -
            // see TrainingSlotSeeder for details.
            TrainingSlotSeeder.TopUpAllTrainers(context);
            context.SaveChanges();

            // Seed Workouts and Exercises
            if (!context.Workouts.Any())
            {
                var w1 = new Workout { Name = "Strength Training", Category = "Strength", Description = "Build strength and improve overall fitness with a structured workout.", Duration = "30 min", Difficulty = "Beginner", CaloriesBurned = 250, IsActive = true, CreatedAt = DateTime.UtcNow };
                var w2 = new Workout { Name = "Cardio Blast", Category = "Cardio", Description = "Improve endurance and keep your body active with continuous movement.", Duration = "25 min", Difficulty = "Beginner", CaloriesBurned = 300, IsActive = true, CreatedAt = DateTime.UtcNow };
                var w3 = new Workout { Name = "Flexibility Yoga", Category = "Yoga", Description = "Improve flexibility, balance and relaxation through guided flow.", Duration = "35 min", Difficulty = "Beginner", CaloriesBurned = 150, IsActive = true, CreatedAt = DateTime.UtcNow };
                var w4 = new Workout { Name = "HIIT Burn", Category = "HIIT", Description = "High intensity intervals for an active lifestyle and maximum burn.", Duration = "20 min", Difficulty = "Intermediate", CaloriesBurned = 350, IsActive = true, CreatedAt = DateTime.UtcNow };

                context.Workouts.AddRange(w1, w2, w3, w4);
                context.SaveChanges();

                context.WorkoutExercises.AddRange(
                    new WorkoutExercise { WorkoutId = w1.WorkoutId, Name = "Warm-up", Description = "Prepare your body with gentle movements.", Duration = "3 min", OrderIndex = 1 },
                    new WorkoutExercise { WorkoutId = w1.WorkoutId, Name = "Bodyweight Squats", Description = "Perform controlled squats with a comfortable range of motion.", Duration = "45 sec", OrderIndex = 2 },
                    new WorkoutExercise { WorkoutId = w1.WorkoutId, Name = "Push-ups", Description = "Keep your body controlled while performing push-ups.", Duration = "45 sec", OrderIndex = 3 },
                    new WorkoutExercise { WorkoutId = w1.WorkoutId, Name = "Cool-down", Description = "Stretch and lower your heart rate gradually.", Duration = "3 min", OrderIndex = 4 },

                    new WorkoutExercise { WorkoutId = w2.WorkoutId, Name = "Warm-up Jog", Description = "Light jog in place to raise your heart rate.", Duration = "3 min", OrderIndex = 1 },
                    new WorkoutExercise { WorkoutId = w2.WorkoutId, Name = "Jumping Jacks", Description = "Full-body cardio movement at a steady pace.", Duration = "60 sec", OrderIndex = 2 },
                    new WorkoutExercise { WorkoutId = w2.WorkoutId, Name = "High Knees", Description = "Drive your knees up quickly to build endurance.", Duration = "45 sec", OrderIndex = 3 },
                    new WorkoutExercise { WorkoutId = w2.WorkoutId, Name = "Cool-down Walk", Description = "Slow your pace and bring your breathing back down.", Duration = "3 min", OrderIndex = 4 },

                    new WorkoutExercise { WorkoutId = w3.WorkoutId, Name = "Centering Breath", Description = "Sit comfortably and focus on slow, deep breaths.", Duration = "3 min", OrderIndex = 1 },
                    new WorkoutExercise { WorkoutId = w3.WorkoutId, Name = "Sun Salutation", Description = "Flow through the classic sequence to warm the body.", Duration = "5 min", OrderIndex = 2 },
                    new WorkoutExercise { WorkoutId = w3.WorkoutId, Name = "Downward Dog Hold", Description = "Hold the pose to stretch the hamstrings and spine.", Duration = "60 sec", OrderIndex = 3 },
                    new WorkoutExercise { WorkoutId = w3.WorkoutId, Name = "Savasana", Description = "Rest and relax to close out the practice.", Duration = "5 min", OrderIndex = 4 },

                    new WorkoutExercise { WorkoutId = w4.WorkoutId, Name = "Dynamic Warm-up", Description = "Prime your muscles for high intensity work.", Duration = "2 min", OrderIndex = 1 },
                    new WorkoutExercise { WorkoutId = w4.WorkoutId, Name = "Burpees", Description = "Full-body explosive movement, work then rest.", Duration = "30 sec", OrderIndex = 2 },
                    new WorkoutExercise { WorkoutId = w4.WorkoutId, Name = "Mountain Climbers", Description = "Fast-paced core and cardio combination.", Duration = "30 sec", OrderIndex = 3 },
                    new WorkoutExercise { WorkoutId = w4.WorkoutId, Name = "Cool-down", Description = "Bring your heart rate down with light stretching.", Duration = "3 min", OrderIndex = 4 }
                );
                context.SaveChanges();
            }

            // Seed Diet Plans and Meals
            if (!context.DietPlans.Any())
            {
                var d1 = new DietPlan { Name = "Lean & Light", Goal = "Weight Loss", Description = "A calorie-controlled plan built around lean protein and high-fiber vegetables.", DailyCalories = 1600, ProteinGrams = 120, CarbsGrams = 140, FatGrams = 45, IsActive = true, CreatedAt = DateTime.UtcNow };
                var d2 = new DietPlan { Name = "Build & Bulk", Goal = "Muscle Gain", Description = "A calorie surplus plan with higher protein to support muscle recovery and growth.", DailyCalories = 2800, ProteinGrams = 190, CarbsGrams = 300, FatGrams = 80, IsActive = true, CreatedAt = DateTime.UtcNow };
                var d3 = new DietPlan { Name = "Balanced Living", Goal = "Maintenance", Description = "A well-rounded plan to maintain your current weight while fueling daily activity.", DailyCalories = 2100, ProteinGrams = 130, CarbsGrams = 220, FatGrams = 65, IsActive = true, CreatedAt = DateTime.UtcNow };

                context.DietPlans.AddRange(d1, d2, d3);
                context.SaveChanges();

                context.DietMeals.AddRange(
                    // Lean & Light
                    new DietMeal { DietPlanId = d1.DietPlanId, MealType = "Breakfast", Name = "Vegetable Poha", Description = "Flattened rice sauteed with peanuts, peas and turmeric.", Calories = 300, IsVegetarian = true, OrderIndex = 1 },
                    new DietMeal { DietPlanId = d1.DietPlanId, MealType = "Breakfast", Name = "Egg White Omelette", Description = "Egg whites with spinach and tomatoes, whole-grain toast.", Calories = 320, IsVegetarian = false, OrderIndex = 1 },
                    new DietMeal { DietPlanId = d1.DietPlanId, MealType = "Lunch", Name = "Paneer & Quinoa Bowl", Description = "Grilled paneer over quinoa with mixed greens and lemon dressing.", Calories = 420, IsVegetarian = true, OrderIndex = 2 },
                    new DietMeal { DietPlanId = d1.DietPlanId, MealType = "Lunch", Name = "Grilled Chicken Salad", Description = "Grilled chicken breast over mixed greens with a light vinaigrette.", Calories = 420, IsVegetarian = false, OrderIndex = 2 },
                    new DietMeal { DietPlanId = d1.DietPlanId, MealType = "Snack", Name = "Greek Yogurt & Berries", Description = "Plain Greek yogurt with a handful of mixed berries.", Calories = 180, IsVegetarian = true, OrderIndex = 3 },
                    new DietMeal { DietPlanId = d1.DietPlanId, MealType = "Snack", Name = "Boiled Eggs & Almonds", Description = "Two boiled eggs with a small handful of almonds.", Calories = 190, IsVegetarian = false, OrderIndex = 3 },
                    new DietMeal { DietPlanId = d1.DietPlanId, MealType = "Dinner", Name = "Lentil & Vegetable Soup", Description = "Warm lentil soup loaded with seasonal vegetables.", Calories = 400, IsVegetarian = true, OrderIndex = 4 },
                    new DietMeal { DietPlanId = d1.DietPlanId, MealType = "Dinner", Name = "Baked Fish & Vegetables", Description = "Baked white fish with steamed broccoli and carrots.", Calories = 400, IsVegetarian = false, OrderIndex = 4 },

                    // Build & Bulk
                    new DietMeal { DietPlanId = d2.DietPlanId, MealType = "Breakfast", Name = "Oats, Banana & Plant Protein", Description = "Rolled oats with banana, peanut butter and plant-based protein.", Calories = 620, IsVegetarian = true, OrderIndex = 1 },
                    new DietMeal { DietPlanId = d2.DietPlanId, MealType = "Breakfast", Name = "Oats & Whey Protein", Description = "Rolled oats with banana, peanut butter and whey protein.", Calories = 620, IsVegetarian = false, OrderIndex = 1 },
                    new DietMeal { DietPlanId = d2.DietPlanId, MealType = "Lunch", Name = "Paneer Rice Bowl", Description = "Pan-seared paneer, brown rice, and mixed vegetables.", Calories = 720, IsVegetarian = true, OrderIndex = 2 },
                    new DietMeal { DietPlanId = d2.DietPlanId, MealType = "Lunch", Name = "Chicken Rice Bowl", Description = "Grilled chicken, brown rice, and mixed vegetables.", Calories = 720, IsVegetarian = false, OrderIndex = 2 },
                    new DietMeal { DietPlanId = d2.DietPlanId, MealType = "Snack", Name = "Plant Protein Shake & Almonds", Description = "Plant-based protein shake with a small handful of almonds.", Calories = 350, IsVegetarian = true, OrderIndex = 3 },
                    new DietMeal { DietPlanId = d2.DietPlanId, MealType = "Snack", Name = "Whey Shake & Almonds", Description = "Whey protein shake with a small handful of almonds.", Calories = 350, IsVegetarian = false, OrderIndex = 3 },
                    new DietMeal { DietPlanId = d2.DietPlanId, MealType = "Dinner", Name = "Tofu & Sweet Potato", Description = "Pan-seared tofu with roasted sweet potato and green beans.", Calories = 680, IsVegetarian = true, OrderIndex = 4 },
                    new DietMeal { DietPlanId = d2.DietPlanId, MealType = "Dinner", Name = "Beef & Sweet Potato", Description = "Lean beef with roasted sweet potato and green beans.", Calories = 680, IsVegetarian = false, OrderIndex = 4 },

                    // Balanced Living
                    new DietMeal { DietPlanId = d3.DietPlanId, MealType = "Breakfast", Name = "Tofu Veggie Scramble", Description = "Scrambled tofu with mixed vegetables and toast.", Calories = 450, IsVegetarian = true, OrderIndex = 1 },
                    new DietMeal { DietPlanId = d3.DietPlanId, MealType = "Breakfast", Name = "Egg Veggie Scramble", Description = "Whole eggs scrambled with mixed vegetables and toast.", Calories = 450, IsVegetarian = false, OrderIndex = 1 },
                    new DietMeal { DietPlanId = d3.DietPlanId, MealType = "Lunch", Name = "Chickpea Wrap", Description = "Whole-wheat wrap with spiced chickpeas, avocado, and greens.", Calories = 520, IsVegetarian = true, OrderIndex = 2 },
                    new DietMeal { DietPlanId = d3.DietPlanId, MealType = "Lunch", Name = "Turkey Wrap", Description = "Whole-wheat wrap with turkey, avocado, and greens.", Calories = 520, IsVegetarian = false, OrderIndex = 2 },
                    new DietMeal { DietPlanId = d3.DietPlanId, MealType = "Snack", Name = "Fruit & Nut Mix", Description = "A mix of seasonal fruit and unsalted nuts.", Calories = 220, IsVegetarian = true, OrderIndex = 3 },
                    new DietMeal { DietPlanId = d3.DietPlanId, MealType = "Snack", Name = "Cottage Cheese & Fruit", Description = "Cottage cheese with a side of seasonal fruit.", Calories = 220, IsVegetarian = false, OrderIndex = 3 },
                    new DietMeal { DietPlanId = d3.DietPlanId, MealType = "Dinner", Name = "Paneer & Quinoa", Description = "Grilled paneer with quinoa and roasted asparagus.", Calories = 560, IsVegetarian = true, OrderIndex = 4 },
                    new DietMeal { DietPlanId = d3.DietPlanId, MealType = "Dinner", Name = "Salmon & Quinoa", Description = "Grilled salmon with quinoa and roasted asparagus.", Calories = 560, IsVegetarian = false, OrderIndex = 4 }
                );
                context.SaveChanges();
            }

            // Seed a few starter Facilities so the Admin Portal isn't empty on first run
            if (!context.Facilities.Any())
            {
                context.Facilities.AddRange(
                    new Facility { Name = "Main Strength Arena", Type = "Strength Arena", Location = "Floor 1 - Wing A", OpenHours = "05:00 AM - 11:00 PM", Status = "Open", CreatedAt = DateTime.UtcNow },
                    new Facility { Name = "Zen Yoga Studio", Type = "Studio", Location = "Floor 2 - Wing B", OpenHours = "06:00 AM - 09:00 PM", Status = "Open", CreatedAt = DateTime.UtcNow },
                    new Facility { Name = "Recovery Pool", Type = "Pool", Location = "Floor 1 - Wing C", OpenHours = "06:00 AM - 08:00 PM", Status = "Open", CreatedAt = DateTime.UtcNow }
                );
                context.SaveChanges();
            }

            // Seed a starter Announcement
            if (!context.Announcements.Any())
            {
                context.Announcements.Add(new Announcement
                {
                    Title = "Welcome to FitSync!",
                    Content = "Explore workouts, book trainers and track your diet plan - all in one place.",
                    Category = "General",
                    Priority = "Medium",
                    CreatedAt = DateTime.UtcNow
                });
                context.SaveChanges();
            }
        }

        // ============================================================
        // Safety net for databases that existed BEFORE the Admin Portal
        // tables (ClassSchedules / Facilities / Announcements) were added
        // to the model. EnsureCreated() skips schema creation entirely
        // once a database already exists, so without this, an older
        // FitSync.db / FitSyncDB would 500 on every admin.html call.
        // ============================================================
        private static void EnsureAdminTablesExist(FitSyncDbContext context)
        {
            if (context.Database.IsSqlite())
            {
                context.Database.ExecuteSqlRaw(@"
                    CREATE TABLE IF NOT EXISTS ""ClassSchedules"" (
                        ""ClassId"" INTEGER NOT NULL CONSTRAINT ""PK_ClassSchedules"" PRIMARY KEY AUTOINCREMENT,
                        ""Name"" TEXT NOT NULL,
                        ""Category"" TEXT NOT NULL,
                        ""TrainerName"" TEXT NOT NULL,
                        ""ScheduleTime"" TEXT NOT NULL,
                        ""IsOnline"" INTEGER NOT NULL,
                        ""RoomNumber"" TEXT NULL,
                        ""MeetLink"" TEXT NULL,
                        ""IsActive"" INTEGER NOT NULL,
                        ""CreatedAt"" TEXT NOT NULL
                    );");

                context.Database.ExecuteSqlRaw(@"
                    CREATE TABLE IF NOT EXISTS ""Facilities"" (
                        ""FacilityId"" INTEGER NOT NULL CONSTRAINT ""PK_Facilities"" PRIMARY KEY AUTOINCREMENT,
                        ""Name"" TEXT NOT NULL,
                        ""Type"" TEXT NOT NULL,
                        ""Location"" TEXT NOT NULL,
                        ""OpenHours"" TEXT NOT NULL,
                        ""Status"" TEXT NOT NULL,
                        ""CreatedAt"" TEXT NOT NULL
                    );");

                context.Database.ExecuteSqlRaw(@"
                    CREATE TABLE IF NOT EXISTS ""Announcements"" (
                        ""AnnouncementId"" INTEGER NOT NULL CONSTRAINT ""PK_Announcements"" PRIMARY KEY AUTOINCREMENT,
                        ""Title"" TEXT NOT NULL,
                        ""Content"" TEXT NOT NULL,
                        ""Category"" TEXT NOT NULL,
                        ""Priority"" TEXT NOT NULL,
                        ""CreatedAt"" TEXT NOT NULL
                    );");
            }
            else if (context.Database.IsSqlServer())
            {
                context.Database.ExecuteSqlRaw(@"
                    IF OBJECT_ID('dbo.ClassSchedules', 'U') IS NULL
                    BEGIN
                        CREATE TABLE dbo.ClassSchedules (
                            ClassId       INT IDENTITY(1,1) PRIMARY KEY,
                            Name          NVARCHAR(150) NOT NULL,
                            Category      NVARCHAR(50)  NOT NULL,
                            TrainerName   NVARCHAR(150) NOT NULL,
                            ScheduleTime  NVARCHAR(100) NOT NULL,
                            IsOnline      BIT NOT NULL DEFAULT(0),
                            RoomNumber    NVARCHAR(100) NULL,
                            MeetLink      NVARCHAR(300) NULL,
                            IsActive      BIT NOT NULL DEFAULT(1),
                            CreatedAt     DATETIME2 NOT NULL DEFAULT(SYSUTCDATETIME())
                        );
                    END");

                context.Database.ExecuteSqlRaw(@"
                    IF OBJECT_ID('dbo.Facilities', 'U') IS NULL
                    BEGIN
                        CREATE TABLE dbo.Facilities (
                            FacilityId  INT IDENTITY(1,1) PRIMARY KEY,
                            Name        NVARCHAR(150) NOT NULL,
                            Type        NVARCHAR(100) NOT NULL,
                            Location    NVARCHAR(150) NOT NULL,
                            OpenHours   NVARCHAR(100) NOT NULL,
                            Status      NVARCHAR(30)  NOT NULL DEFAULT('Open'),
                            CreatedAt   DATETIME2 NOT NULL DEFAULT(SYSUTCDATETIME())
                        );
                    END");

                context.Database.ExecuteSqlRaw(@"
                    IF OBJECT_ID('dbo.Announcements', 'U') IS NULL
                    BEGIN
                        CREATE TABLE dbo.Announcements (
                            AnnouncementId  INT IDENTITY(1,1) PRIMARY KEY,
                            Title           NVARCHAR(200) NOT NULL,
                            Content         NVARCHAR(1000) NOT NULL,
                            Category        NVARCHAR(50) NOT NULL DEFAULT('General'),
                            Priority        NVARCHAR(20) NOT NULL DEFAULT('Medium'),
                            CreatedAt       DATETIME2 NOT NULL DEFAULT(SYSUTCDATETIME())
                        );
                    END");
            }
        }
    }
}
