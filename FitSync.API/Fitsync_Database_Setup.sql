/* =========================================================
   FITSYNC - COMPLETE DATABASE SETUP SCRIPT (SQL Server)
   =========================================================
   - Creates the [FitSyncDB] database if it doesn't exist
   - Creates all 17 tables to match the current EF Core models
     (Users now includes Role, Age, Gender, HeightCm, WeightKg,
     FitnessGoal, FitnessLevel, DietPreference, PreferredWorkout,
     ProfileImage, HasUsedTrial - these were missing from the
     older Fitsync_Tables.sql / Fitsync_Setup.sql scripts)
   - Seeds Subscription Plans, Trainers, Training Slots,
     Workouts, Exercises, Diet Plans, Diet Meals
   - Seeds a working Admin account into Users
   - Safe to re-run: every step is guarded with IF NOT EXISTS

   THIS FILE REPLACES the older Fitsync_Tables.sql,
   Fitsync_Setup.sql and Fitsync_Diet_Upgrade.sql - you can
   delete those three once you've run this one.

   To use it:
   1. In appsettings.json set "DatabaseProvider": "SqlServer"
      and fill in "FitSyncConnection" for your SQL Server.
   2. Run this whole script once (SSMS / Azure Data Studio /
      sqlcmd) against your server.
   3. Start the API as usual - EF Core will use the existing
      tables (it only creates them if they don't already exist).

   ADMIN LOGIN (seeded below):
       Email:    admin@fitsync.com
       Password: Admin@123
   The password hash below was generated with the exact same
   PBKDF2-HMACSHA256 / 100,000 iterations / 128-bit salt format
   that ASP.NET Core Identity's PasswordHasher<TUser> produces,
   so it verifies correctly with no extra setup.
========================================================= */

-- 1. Create Database if it doesn't already exist
IF DB_ID('FitSyncDB') IS NULL
BEGIN
    CREATE DATABASE [FitSyncDB];
    PRINT 'Database [FitSyncDB] created successfully.';
END
ELSE
BEGIN
    PRINT 'Database [FitSyncDB] already exists.';
END
GO

USE [FitSyncDB];
GO

/* ================= 1. USERS ================= */
IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        Id                INT IDENTITY(1,1) PRIMARY KEY,
        FullName          NVARCHAR(150)  NOT NULL,
        Email             NVARCHAR(200)  NOT NULL,
        PhoneNumber       NVARCHAR(20)   NULL,
        PasswordHash      NVARCHAR(MAX)  NOT NULL,
        IsActive          BIT            NOT NULL DEFAULT(1),
        Role              NVARCHAR(20)   NOT NULL DEFAULT('User'),
        Age               INT            NULL,
        Gender            NVARCHAR(20)   NULL,
        HeightCm          DECIMAL(5,1)   NULL,
        WeightKg          DECIMAL(5,1)   NULL,
        FitnessGoal       NVARCHAR(50)   NULL,
        FitnessLevel      NVARCHAR(30)   NULL,
        DietPreference    NVARCHAR(30)   NULL,
        PreferredWorkout  NVARCHAR(50)   NULL,
        ProfileImage      NVARCHAR(300)  NULL,
        HasUsedTrial      BIT            NOT NULL DEFAULT(0),
        CreatedAt         DATETIME2      NOT NULL DEFAULT(SYSUTCDATETIME()),
        CONSTRAINT UQ_Users_Email UNIQUE (Email),
        CONSTRAINT UQ_Users_PhoneNumber UNIQUE (PhoneNumber)
    );
    PRINT 'Table [dbo.Users] created.';
END
GO

/* ================= 2. PASSWORD RESET TOKENS ================= */
IF OBJECT_ID('dbo.PasswordResetTokens', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.PasswordResetTokens (
        Id          INT IDENTITY(1,1) PRIMARY KEY,
        UserId      INT NOT NULL,
        Token       NVARCHAR(200) NOT NULL,
        ExpiryTime  DATETIME2 NOT NULL,
        IsUsed      BIT NOT NULL DEFAULT(0),
        CreatedAt   DATETIME2 NOT NULL DEFAULT(SYSUTCDATETIME()),
        CONSTRAINT FK_PasswordResetTokens_Users FOREIGN KEY (UserId)
            REFERENCES dbo.Users(Id) ON DELETE CASCADE
    );
    PRINT 'Table [dbo.PasswordResetTokens] created.';
END
GO

/* ================= 3. TRAINERS ================= */
IF OBJECT_ID('dbo.Trainers', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Trainers (
        TrainerId        INT IDENTITY(1,1) PRIMARY KEY,
        FullName         NVARCHAR(150) NOT NULL,
        Email            NVARCHAR(200) NOT NULL,
        PhoneNumber      NVARCHAR(20)  NULL,
        Specialization   NVARCHAR(100) NOT NULL,
        ExperienceYears  INT NOT NULL DEFAULT(0),
        Bio              NVARCHAR(MAX) NULL,
        ProfileImage     NVARCHAR(300) NULL,
        IsActive         BIT NOT NULL DEFAULT(1),
        CreatedAt        DATETIME2 NOT NULL DEFAULT(SYSUTCDATETIME()),
        CONSTRAINT UQ_Trainers_Email UNIQUE (Email)
    );
    PRINT 'Table [dbo.Trainers] created.';
END
GO

/* ================= 4. TRAINER AVAILABILITY ================= */
IF OBJECT_ID('dbo.TrainerAvailabilities', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TrainerAvailabilities (
        AvailabilityId  INT IDENTITY(1,1) PRIMARY KEY,
        TrainerId       INT NOT NULL,
        AvailableDate   DATETIME2 NOT NULL,
        StartTime       TIME NOT NULL,
        EndTime         TIME NOT NULL,
        IsAvailable     BIT NOT NULL DEFAULT(1),
        CreatedAt       DATETIME2 NOT NULL DEFAULT(SYSUTCDATETIME()),
        CONSTRAINT FK_TrainerAvailabilities_Trainers FOREIGN KEY (TrainerId)
            REFERENCES dbo.Trainers(TrainerId) ON DELETE CASCADE
    );
    PRINT 'Table [dbo.TrainerAvailabilities] created.';
END
GO

/* ================= 5. TRAINING SLOTS ================= */
IF OBJECT_ID('dbo.TrainingSlots', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TrainingSlots (
        SlotId        INT IDENTITY(1,1) PRIMARY KEY,
        TrainerId     INT NOT NULL,
        SlotDate      DATETIME2 NOT NULL,
        StartTime     TIME NOT NULL,
        EndTime       TIME NOT NULL,
        TrainingType  NVARCHAR(100) NOT NULL,
        Status        NVARCHAR(30) NOT NULL DEFAULT('Available'),
        CreatedAt     DATETIME2 NOT NULL DEFAULT(SYSUTCDATETIME()),
        CONSTRAINT FK_TrainingSlots_Trainers FOREIGN KEY (TrainerId)
            REFERENCES dbo.Trainers(TrainerId) ON DELETE CASCADE
    );
    PRINT 'Table [dbo.TrainingSlots] created.';
END
GO

/* ================= 6. BOOKINGS ================= */
IF OBJECT_ID('dbo.Bookings', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Bookings (
        BookingId    INT IDENTITY(1,1) PRIMARY KEY,
        UserId       INT NOT NULL,
        TrainerId    INT NOT NULL,
        SlotId       INT NOT NULL,
        BookingDate  DATETIME2 NOT NULL,
        Status       NVARCHAR(30) NOT NULL DEFAULT('Confirmed'),
        Notes        NVARCHAR(500) NULL,
        CreatedAt    DATETIME2 NOT NULL DEFAULT(SYSUTCDATETIME()),
        CONSTRAINT FK_Bookings_Users    FOREIGN KEY (UserId)    REFERENCES dbo.Users(Id),
        CONSTRAINT FK_Bookings_Trainers FOREIGN KEY (TrainerId) REFERENCES dbo.Trainers(TrainerId),
        CONSTRAINT FK_Bookings_Slots    FOREIGN KEY (SlotId)    REFERENCES dbo.TrainingSlots(SlotId)
    );
    PRINT 'Table [dbo.Bookings] created.';
END
GO

/* ================= 7. ONLINE SESSIONS ================= */
IF OBJECT_ID('dbo.OnlineSessions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.OnlineSessions (
        SessionId      INT IDENTITY(1,1) PRIMARY KEY,
        BookingId      INT NOT NULL,
        MeetingLink    NVARCHAR(500) NULL,
        SessionDate    DATETIME2 NOT NULL,
        StartTime      TIME NOT NULL,
        EndTime        TIME NOT NULL,
        SessionStatus  NVARCHAR(30) NOT NULL DEFAULT('Scheduled'),
        CreatedAt      DATETIME2 NOT NULL DEFAULT(SYSUTCDATETIME()),
        CONSTRAINT FK_OnlineSessions_Bookings FOREIGN KEY (BookingId)
            REFERENCES dbo.Bookings(BookingId) ON DELETE CASCADE
    );
    PRINT 'Table [dbo.OnlineSessions] created.';
END
GO

/* ================= 8. SUBSCRIPTION PLANS ================= */
IF OBJECT_ID('dbo.SubscriptionPlans', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.SubscriptionPlans (
        PlanId        INT IDENTITY(1,1) PRIMARY KEY,
        PlanName      NVARCHAR(100) NOT NULL,
        Description   NVARCHAR(500) NULL,
        DurationDays  INT NOT NULL,
        Price         DECIMAL(10,2) NOT NULL,
        IsActive      BIT NOT NULL DEFAULT(1),
        CreatedAt     DATETIME2 NOT NULL DEFAULT(SYSUTCDATETIME()),
        CONSTRAINT UQ_SubscriptionPlans_Name UNIQUE (PlanName)
    );
    PRINT 'Table [dbo.SubscriptionPlans] created.';
END
GO

/* ================= 9. USER SUBSCRIPTIONS ================= */
IF OBJECT_ID('dbo.UserSubscriptions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserSubscriptions (
        UserSubscriptionId  INT IDENTITY(1,1) PRIMARY KEY,
        UserId              INT NOT NULL,
        PlanId              INT NOT NULL,
        StartDate           DATETIME2 NOT NULL,
        EndDate             DATETIME2 NOT NULL,
        Status              NVARCHAR(30) NOT NULL DEFAULT('Active'),
        CreatedAt           DATETIME2 NOT NULL DEFAULT(SYSUTCDATETIME()),
        CONSTRAINT FK_UserSubscriptions_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id),
        CONSTRAINT FK_UserSubscriptions_Plans FOREIGN KEY (PlanId) REFERENCES dbo.SubscriptionPlans(PlanId)
    );
    PRINT 'Table [dbo.UserSubscriptions] created.';
END
GO

/* ================= 10. WORKOUTS ================= */
IF OBJECT_ID('dbo.Workouts', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Workouts (
        WorkoutId       INT IDENTITY(1,1) PRIMARY KEY,
        Name            NVARCHAR(150) NOT NULL,
        Category        NVARCHAR(50)  NOT NULL,
        Description     NVARCHAR(500) NULL,
        Duration        NVARCHAR(30)  NOT NULL,
        Difficulty      NVARCHAR(30)  NOT NULL DEFAULT('Beginner'),
        CaloriesBurned  INT NOT NULL DEFAULT(0),
        VideoUrl        NVARCHAR(300) NULL,
        ImageUrl        NVARCHAR(300) NULL,
        IsActive        BIT NOT NULL DEFAULT(1),
        CreatedAt       DATETIME2 NOT NULL DEFAULT(SYSUTCDATETIME())
    );
    PRINT 'Table [dbo.Workouts] created.';
END
GO

/* ================= 11. WORKOUT EXERCISES ================= */
IF OBJECT_ID('dbo.WorkoutExercises', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.WorkoutExercises (
        ExerciseId   INT IDENTITY(1,1) PRIMARY KEY,
        WorkoutId    INT NOT NULL,
        Name         NVARCHAR(150) NOT NULL,
        Description  NVARCHAR(500) NULL,
        Duration     NVARCHAR(30) NOT NULL,
        OrderIndex   INT NOT NULL DEFAULT(0),
        CONSTRAINT FK_WorkoutExercises_Workouts FOREIGN KEY (WorkoutId)
            REFERENCES dbo.Workouts(WorkoutId) ON DELETE CASCADE
    );
    PRINT 'Table [dbo.WorkoutExercises] created.';
END
GO

/* ================= 12. WORKOUT LOGS ================= */
IF OBJECT_ID('dbo.WorkoutLogs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.WorkoutLogs (
        LogId           INT IDENTITY(1,1) PRIMARY KEY,
        UserId          INT NOT NULL,
        WorkoutId       INT NOT NULL,
        CompletedAt     DATETIME2 NOT NULL DEFAULT(SYSUTCDATETIME()),
        CaloriesBurned  INT NOT NULL DEFAULT(0),
        CONSTRAINT FK_WorkoutLogs_Users    FOREIGN KEY (UserId)    REFERENCES dbo.Users(Id) ON DELETE CASCADE,
        CONSTRAINT FK_WorkoutLogs_Workouts FOREIGN KEY (WorkoutId) REFERENCES dbo.Workouts(WorkoutId)
    );
    PRINT 'Table [dbo.WorkoutLogs] created.';
END
GO

/* ================= 13. WORKOUT SESSIONS (STATE MACHINE & RESUME) ================= */
IF OBJECT_ID('dbo.WorkoutSessions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.WorkoutSessions (
        SessionId          INT IDENTITY(1,1) PRIMARY KEY,
        UserId             INT NOT NULL,
        WorkoutId          INT NOT NULL,
        StartTime          DATETIME2 NOT NULL DEFAULT(SYSUTCDATETIME()),
        LastActivityTime   DATETIME2 NOT NULL DEFAULT(SYSUTCDATETIME()),
        CompletedDuration  INT NOT NULL DEFAULT(0),
        RemainingDuration  INT NOT NULL DEFAULT(0),
        RequiredDuration   INT NOT NULL DEFAULT(0),
        Status             NVARCHAR(30) NOT NULL DEFAULT('Not Started'),
        CaloriesBurned     INT NOT NULL DEFAULT(0),
        CONSTRAINT FK_WorkoutSessions_Users    FOREIGN KEY (UserId)    REFERENCES dbo.Users(Id) ON DELETE CASCADE,
        CONSTRAINT FK_WorkoutSessions_Workouts FOREIGN KEY (WorkoutId) REFERENCES dbo.Workouts(WorkoutId)
    );
    PRINT 'Table [dbo.WorkoutSessions] created.';
END
GO

/* ================= 14. DIET PLANS ================= */
IF OBJECT_ID('dbo.DietPlans', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DietPlans (
        DietPlanId      INT IDENTITY(1,1) PRIMARY KEY,
        Name            NVARCHAR(150) NOT NULL,
        Goal            NVARCHAR(50)  NOT NULL,
        Description     NVARCHAR(500) NULL,
        DailyCalories   INT NOT NULL DEFAULT(0),
        ProteinGrams    INT NOT NULL DEFAULT(0),
        CarbsGrams      INT NOT NULL DEFAULT(0),
        FatGrams        INT NOT NULL DEFAULT(0),
        ImageUrl        NVARCHAR(300) NULL,
        IsActive        BIT NOT NULL DEFAULT(1),
        CreatedAt       DATETIME2 NOT NULL DEFAULT(SYSUTCDATETIME())
    );
    PRINT 'Table [dbo.DietPlans] created.';
END
GO

/* ================= 15. DIET MEALS ================= */
IF OBJECT_ID('dbo.DietMeals', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DietMeals (
        MealId        INT IDENTITY(1,1) PRIMARY KEY,
        DietPlanId    INT NOT NULL,
        MealType      NVARCHAR(30)  NOT NULL,
        Name          NVARCHAR(150) NOT NULL,
        Description   NVARCHAR(500) NULL,
        Calories      INT NOT NULL DEFAULT(0),
        IsVegetarian  BIT NOT NULL DEFAULT(1),
        OrderIndex    INT NOT NULL DEFAULT(0),
        CONSTRAINT FK_DietMeals_DietPlans FOREIGN KEY (DietPlanId)
            REFERENCES dbo.DietPlans(DietPlanId) ON DELETE CASCADE
    );
    PRINT 'Table [dbo.DietMeals] created.';
END
GO

/* ================= 16. DIET PROFILES ================= */
IF OBJECT_ID('dbo.DietProfiles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.DietProfiles (
        ProfileId           INT IDENTITY(1,1) PRIMARY KEY,
        UserId              INT NOT NULL,
        Age                 INT NOT NULL,
        HeightCm            DECIMAL(5,1) NOT NULL,
        WeightKg            DECIMAL(5,1) NOT NULL,
        Gender              NVARCHAR(10) NOT NULL,
        DietaryPreference   NVARCHAR(10) NOT NULL,
        Goal                NVARCHAR(50) NOT NULL,
        Bmr                 DECIMAL(6,1) NOT NULL DEFAULT(0),
        Tdee                DECIMAL(6,1) NOT NULL DEFAULT(0),
        RecommendedCalories INT NOT NULL DEFAULT(0),
        CreatedAt           DATETIME2 NOT NULL DEFAULT(SYSUTCDATETIME()),
        UpdatedAt           DATETIME2 NOT NULL DEFAULT(SYSUTCDATETIME()),
        CONSTRAINT FK_DietProfiles_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE,
        CONSTRAINT UQ_DietProfiles_UserId UNIQUE (UserId)
    );
    PRINT 'Table [dbo.DietProfiles] created.';
END
GO

/* ================= 17. USER DIET PLANS ================= */
IF OBJECT_ID('dbo.UserDietPlans', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserDietPlans (
        UserDietPlanId  INT IDENTITY(1,1) PRIMARY KEY,
        UserId          INT NOT NULL,
        DietPlanId      INT NOT NULL,
        StartDate       DATETIME2 NOT NULL,
        Status          NVARCHAR(30) NOT NULL DEFAULT('Active'),
        CreatedAt       DATETIME2 NOT NULL DEFAULT(SYSUTCDATETIME()),
        CONSTRAINT FK_UserDietPlans_Users FOREIGN KEY (UserId) REFERENCES dbo.Users(Id) ON DELETE CASCADE,
        CONSTRAINT FK_UserDietPlans_Plans FOREIGN KEY (DietPlanId) REFERENCES dbo.DietPlans(DietPlanId)
    );
    PRINT 'Table [dbo.UserDietPlans] created.';
END
GO


/* =========================================================
   SEED DATA
========================================================= */

/* ---- Admin account (Users) ---- */
IF NOT EXISTS (SELECT 1 FROM dbo.Users WHERE Role = 'Admin')
BEGIN
    INSERT INTO dbo.Users (FullName, Email, PhoneNumber, PasswordHash, IsActive, Role, HasUsedTrial, CreatedAt)
    VALUES (
        N'System Admin',
        N'admin@fitsync.com',
        N'9876543210',
        N'AQAAAAEAAYagAAAAENXE0Pe6vNwsGtu01zq8JHPNeeiqE7PAaK2szAnhd5ULEhg580zpz82gJw1sXr1Xvw==',
        1,
        N'Admin',
        0,
        SYSUTCDATETIME()
    );
    PRINT 'Seeded Admin user (admin@fitsync.com / Admin@123).';
END
GO

/* ---- Subscription Plans ---- */
IF NOT EXISTS (SELECT 1 FROM dbo.SubscriptionPlans)
BEGIN
    INSERT INTO dbo.SubscriptionPlans (PlanName, Description, DurationDays, Price, IsActive)
    VALUES
        (N'Basic',   N'Access to the workout library and progress tracking.', 30, 499.00,  1),
        (N'Pro',     N'Everything in Basic plus unlimited trainer bookings.', 30, 1499.00, 1),
        (N'Elite',   N'Everything in Pro plus 1:1 online coaching sessions.', 90, 3999.00, 1);
    PRINT 'Seeded Subscription Plans.';
END
GO

/* ---- Trainers ---- */
IF NOT EXISTS (SELECT 1 FROM dbo.Trainers)
BEGIN
    INSERT INTO dbo.Trainers (FullName, Email, PhoneNumber, Specialization, ExperienceYears, Bio, IsActive)
    VALUES
        (N'Arjun Mehta',  N'arjun.mehta@fitsync.com',  N'9000000001', N'Strength Training', 6, N'Strength coach focused on clean form and progressive overload.', 1),
        (N'Sara Kapoor',  N'sara.kapoor@fitsync.com',  N'9000000002', N'Yoga',              8, N'Yoga instructor specializing in flexibility and mindful movement.', 1),
        (N'Rohit Nair',   N'rohit.nair@fitsync.com',   N'9000000003', N'HIIT',              5, N'High-intensity coach for fast, effective fat-burning sessions.', 1),
        (N'Divya Rao',    N'divya.rao@fitsync.com',    N'9000000004', N'Cardio',            4, N'Cardio and endurance specialist for all fitness levels.', 1);
    PRINT 'Seeded Trainers.';
END
GO

/* ---- Training Slots (next 3 days for each trainer) ---- */
IF NOT EXISTS (SELECT 1 FROM dbo.TrainingSlots)
BEGIN
    INSERT INTO dbo.TrainingSlots (TrainerId, SlotDate, StartTime, EndTime, TrainingType, Status)
    SELECT
        t.TrainerId,
        CAST(DATEADD(DAY, d.n, CAST(GETUTCDATE() AS DATE)) AS DATETIME2),
        s.StartTime,
        s.EndTime,
        t.Specialization,
        N'Available'
    FROM dbo.Trainers t
    CROSS JOIN (VALUES (1),(2),(3)) AS d(n)
    CROSS JOIN (VALUES (CAST('07:00' AS TIME), CAST('08:00' AS TIME)),
                        (CAST('18:00' AS TIME), CAST('19:00' AS TIME))) AS s(StartTime, EndTime);
    PRINT 'Seeded Training Slots.';
END
GO

/* ---- Workouts + Exercises ---- */
IF NOT EXISTS (SELECT 1 FROM dbo.Workouts)
BEGIN
    DECLARE @StrengthId INT, @CardioId INT, @YogaId INT, @HiitId INT;

    INSERT INTO dbo.Workouts (Name, Category, Description, Duration, Difficulty, CaloriesBurned, IsActive)
    VALUES (N'Strength Training', N'Strength', N'Build strength and improve overall fitness with a structured workout.', N'30 min', N'Beginner', 250, 1);
    SET @StrengthId = SCOPE_IDENTITY();

    INSERT INTO dbo.Workouts (Name, Category, Description, Duration, Difficulty, CaloriesBurned, IsActive)
    VALUES (N'Cardio Blast', N'Cardio', N'Improve endurance and keep your body active with continuous movement.', N'25 min', N'Beginner', 300, 1);
    SET @CardioId = SCOPE_IDENTITY();

    INSERT INTO dbo.Workouts (Name, Category, Description, Duration, Difficulty, CaloriesBurned, IsActive)
    VALUES (N'Flexibility Yoga', N'Yoga', N'Improve flexibility, balance and relaxation through guided flow.', N'35 min', N'Beginner', 150, 1);
    SET @YogaId = SCOPE_IDENTITY();

    INSERT INTO dbo.Workouts (Name, Category, Description, Duration, Difficulty, CaloriesBurned, IsActive)
    VALUES (N'HIIT Burn', N'HIIT', N'High intensity intervals for an active lifestyle and maximum burn.', N'20 min', N'Intermediate', 350, 1);
    SET @HiitId = SCOPE_IDENTITY();

    INSERT INTO dbo.WorkoutExercises (WorkoutId, Name, Description, Duration, OrderIndex)
    VALUES
        (@StrengthId, N'Warm-up',           N'Prepare your body with gentle movements.',            N'3 min',  1),
        (@StrengthId, N'Bodyweight Squats',  N'Perform controlled squats with a comfortable range of motion.', N'45 sec', 2),
        (@StrengthId, N'Push-ups',           N'Keep your body controlled while performing push-ups.', N'45 sec', 3),
        (@StrengthId, N'Cool-down',          N'Stretch and lower your heart rate gradually.',        N'3 min',  4),

        (@CardioId, N'Warm-up Jog',          N'Light jog in place to raise your heart rate.',        N'3 min',  1),
        (@CardioId, N'Jumping Jacks',        N'Full-body cardio movement at a steady pace.',         N'60 sec', 2),
        (@CardioId, N'High Knees',           N'Drive your knees up quickly to build endurance.',     N'45 sec', 3),
        (@CardioId, N'Cool-down Walk',       N'Slow your pace and bring your breathing back down.',  N'3 min',  4),

        (@YogaId, N'Centering Breath',       N'Sit comfortably and focus on slow, deep breaths.',    N'3 min',  1),
        (@YogaId, N'Sun Salutation',         N'Flow through the classic sequence to warm the body.', N'5 min',  2),
        (@YogaId, N'Downward Dog Hold',      N'Hold the pose to stretch the hamstrings and spine.',  N'60 sec', 3),
        (@YogaId, N'Savasana',               N'Rest and relax to close out the practice.',           N'5 min',  4),

        (@HiitId, N'Dynamic Warm-up',        N'Prime your muscles for high intensity work.',         N'2 min',  1),
        (@HiitId, N'Burpees',                N'Full-body explosive movement, work then rest.',       N'30 sec', 2),
        (@HiitId, N'Mountain Climbers',      N'Fast-paced core and cardio combination.',             N'30 sec', 3),
        (@HiitId, N'Cool-down',              N'Bring your heart rate down with light stretching.',   N'3 min',  4);

    PRINT 'Seeded Workouts and Exercises.';
END
GO

/* ---- Diet Plans + Meals (veg/non-veg pairs) ---- */
IF NOT EXISTS (SELECT 1 FROM dbo.DietPlans)
BEGIN
    DECLARE @WeightLossId INT, @MuscleGainId INT, @MaintenanceId INT;

    INSERT INTO dbo.DietPlans (Name, Goal, Description, DailyCalories, ProteinGrams, CarbsGrams, FatGrams, IsActive)
    VALUES (N'Lean & Light', N'Weight Loss', N'A calorie-controlled plan built around lean protein and high-fiber vegetables.', 1600, 120, 140, 45, 1);
    SET @WeightLossId = SCOPE_IDENTITY();

    INSERT INTO dbo.DietPlans (Name, Goal, Description, DailyCalories, ProteinGrams, CarbsGrams, FatGrams, IsActive)
    VALUES (N'Build & Bulk', N'Muscle Gain', N'A calorie surplus plan with higher protein to support muscle recovery and growth.', 2800, 190, 300, 80, 1);
    SET @MuscleGainId = SCOPE_IDENTITY();

    INSERT INTO dbo.DietPlans (Name, Goal, Description, DailyCalories, ProteinGrams, CarbsGrams, FatGrams, IsActive)
    VALUES (N'Balanced Living', N'Maintenance', N'A well-rounded plan to maintain your current weight while fueling daily activity.', 2100, 130, 220, 65, 1);
    SET @MaintenanceId = SCOPE_IDENTITY();

    INSERT INTO dbo.DietMeals (DietPlanId, MealType, Name, Description, Calories, IsVegetarian, OrderIndex)
    VALUES
        -- Lean & Light (Weight Loss)
        (@WeightLossId, N'Breakfast', N'Vegetable Poha',            N'Flattened rice sauteed with peanuts, peas and turmeric.', 300, 1, 1),
        (@WeightLossId, N'Breakfast', N'Egg White Omelette',        N'Egg whites with spinach and tomatoes, whole-grain toast.', 320, 0, 1),
        (@WeightLossId, N'Lunch',     N'Paneer & Quinoa Bowl',      N'Grilled paneer over quinoa with mixed greens and lemon dressing.', 420, 1, 2),
        (@WeightLossId, N'Lunch',     N'Grilled Chicken Salad',     N'Grilled chicken breast over mixed greens with a light vinaigrette.', 420, 0, 2),
        (@WeightLossId, N'Snack',     N'Greek Yogurt & Berries',    N'Plain Greek yogurt with a handful of mixed berries.', 180, 1, 3),
        (@WeightLossId, N'Snack',     N'Boiled Eggs & Almonds',     N'Two boiled eggs with a small handful of almonds.', 190, 0, 3),
        (@WeightLossId, N'Dinner',    N'Lentil & Vegetable Soup',   N'Warm lentil soup loaded with seasonal vegetables.', 400, 1, 4),
        (@WeightLossId, N'Dinner',    N'Baked Fish & Vegetables',   N'Baked white fish with steamed broccoli and carrots.', 400, 0, 4),

        -- Build & Bulk (Muscle Gain)
        (@MuscleGainId, N'Breakfast', N'Oats, Banana & Plant Protein', N'Rolled oats with banana, peanut butter and plant-based protein.', 620, 1, 1),
        (@MuscleGainId, N'Breakfast', N'Oats & Whey Protein',       N'Rolled oats with banana, peanut butter and whey protein.', 620, 0, 1),
        (@MuscleGainId, N'Lunch',     N'Paneer Rice Bowl',          N'Pan-seared paneer, brown rice, and mixed vegetables.', 720, 1, 2),
        (@MuscleGainId, N'Lunch',     N'Chicken Rice Bowl',         N'Grilled chicken, brown rice, and mixed vegetables.', 720, 0, 2),
        (@MuscleGainId, N'Snack',     N'Plant Protein Shake & Almonds', N'Plant-based protein shake with a small handful of almonds.', 350, 1, 3),
        (@MuscleGainId, N'Snack',     N'Whey Shake & Almonds',      N'Whey protein shake with a small handful of almonds.', 350, 0, 3),
        (@MuscleGainId, N'Dinner',    N'Tofu & Sweet Potato',       N'Pan-seared tofu with roasted sweet potato and green beans.', 680, 1, 4),
        (@MuscleGainId, N'Dinner',    N'Beef & Sweet Potato',       N'Lean beef with roasted sweet potato and green beans.', 680, 0, 4),

        -- Balanced Living (Maintenance)
        (@MaintenanceId, N'Breakfast', N'Tofu Veggie Scramble',     N'Scrambled tofu with mixed vegetables and toast.', 450, 1, 1),
        (@MaintenanceId, N'Breakfast', N'Egg Veggie Scramble',      N'Whole eggs scrambled with mixed vegetables and toast.', 450, 0, 1),
        (@MaintenanceId, N'Lunch',     N'Chickpea Wrap',            N'Whole-wheat wrap with spiced chickpeas, avocado, and greens.', 520, 1, 2),
        (@MaintenanceId, N'Lunch',     N'Turkey Wrap',              N'Whole-wheat wrap with turkey, avocado, and greens.', 520, 0, 2),
        (@MaintenanceId, N'Snack',     N'Fruit & Nut Mix',          N'A mix of seasonal fruit and unsalted nuts.', 220, 1, 3),
        (@MaintenanceId, N'Snack',     N'Cottage Cheese & Fruit',   N'Cottage cheese with a side of seasonal fruit.', 220, 0, 3),
        (@MaintenanceId, N'Dinner',    N'Paneer & Quinoa',          N'Grilled paneer with quinoa and roasted asparagus.', 560, 1, 4),
        (@MaintenanceId, N'Dinner',    N'Salmon & Quinoa',          N'Grilled salmon with quinoa and roasted asparagus.', 560, 0, 4);

    PRINT 'Seeded Diet Plans and Meals.';
END
GO

PRINT '=============================================';
PRINT 'FitSync database setup completed successfully!';
PRINT 'Admin login -> admin@fitsync.com / Admin@123';
PRINT '=============================================';
GO
