using FitSync_API.Data;
using FitSync_API.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FitSync_API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WorkoutController : ControllerBase
    {
        private readonly FitSyncDbContext _context;

        public WorkoutController(FitSyncDbContext context)
        {
            _context = context;
        }

        // ============================
        // GET ALL WORKOUTS
        // ============================
        [HttpGet]
        public async Task<IActionResult> GetWorkouts([FromQuery] string? category)
        {
            var query = _context.Workouts
                .Where(w => w.IsActive)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(category))
            {
                query = query.Where(w =>
                    w.Category.ToLower() == category.Trim().ToLower());
            }

            var workouts = await query
                .OrderBy(w => w.Name)
                .Select(w => new
                {
                    w.WorkoutId,
                    w.Name,
                    w.Category,
                    w.Description,
                    w.Duration,
                    w.Difficulty,
                    w.CaloriesBurned,
                    w.VideoUrl,
                    w.ImageUrl
                })
                .ToListAsync();

            return Ok(workouts);
        }

        // ============================
        // GET SINGLE WORKOUT WITH EXERCISES
        // ============================
        [HttpGet("{id}")]
        public async Task<IActionResult> GetWorkout(int id)
        {
            var workout = await _context.Workouts
                .Where(w => w.WorkoutId == id && w.IsActive)
                .Include(w => w.Exercises.OrderBy(e => e.OrderIndex))
                .FirstOrDefaultAsync();

            if (workout == null)
            {
                return NotFound(new { message = "Workout not found." });
            }

            return Ok(new
            {
                workout.WorkoutId,
                workout.Name,
                workout.Category,
                workout.Description,
                workout.Duration,
                workout.Difficulty,
                workout.CaloriesBurned,
                workout.VideoUrl,
                workout.ImageUrl,
                Exercises = workout.Exercises.Select(e => new
                {
                    e.ExerciseId,
                    e.Name,
                    e.Description,
                    e.Duration
                })
            });
        }

        // ============================
        // WORKOUT STATE MACHINE: START SESSION
        // State: Scheduled -> Not Started -> In Progress
        // ============================
        [HttpPost("session/start")]
        public async Task<IActionResult> StartSession([FromBody] StartSessionRequest request)
        {
            var workout = await _context.Workouts.FirstOrDefaultAsync(w => w.WorkoutId == request.WorkoutId && w.IsActive);
            if (workout == null)
            {
                return NotFound(new { message = "Workout not found." });
            }

            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            // Check if there is an existing incomplete or paused session for this workout
            var existingSession = await _context.WorkoutSessions
                .Where(s => s.UserId == request.UserId && s.WorkoutId == request.WorkoutId && (s.Status == "Incomplete" || s.Status == "Paused" || s.Status == "In Progress"))
                .OrderByDescending(s => s.LastActivityTime)
                .FirstOrDefaultAsync();

            if (existingSession != null && existingSession.RemainingDuration > 0)
            {
                existingSession.Status = "In Progress";
                existingSession.LastActivityTime = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Resumed existing workout session.",
                    session = new
                    {
                        existingSession.SessionId,
                        existingSession.WorkoutId,
                        existingSession.CompletedDuration,
                        existingSession.RemainingDuration,
                        existingSession.RequiredDuration,
                        existingSession.Status,
                        workoutName = workout.Name
                    }
                });
            }

            var reqDurationSeconds = ParseDurationToSeconds(workout.Duration);

            var session = new WorkoutSession
            {
                UserId = request.UserId,
                WorkoutId = request.WorkoutId,
                StartTime = DateTime.UtcNow,
                LastActivityTime = DateTime.UtcNow,
                CompletedDuration = 0,
                RemainingDuration = reqDurationSeconds,
                RequiredDuration = reqDurationSeconds,
                Status = "In Progress",
                CaloriesBurned = 0
            };

            _context.WorkoutSessions.Add(session);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Workout session started.",
                session = new
                {
                    session.SessionId,
                    session.WorkoutId,
                    session.CompletedDuration,
                    session.RemainingDuration,
                    session.RequiredDuration,
                    session.Status,
                    workoutName = workout.Name
                }
            });
        }

        // ============================
        // WORKOUT STATE MACHINE: UPDATE PROGRESS
        // State: In Progress -> Paused / Incomplete
        // ============================
        [HttpPost("session/update")]
        public async Task<IActionResult> UpdateSession([FromBody] UpdateSessionRequest request)
        {
            var session = await _context.WorkoutSessions.FindAsync(request.SessionId);
            if (session == null || session.UserId != request.UserId)
            {
                return NotFound(new { message = "Workout session not found or unauthorized." });
            }

            session.CompletedDuration = request.CompletedDuration;
            session.RemainingDuration = Math.Max(0, session.RequiredDuration - request.CompletedDuration);
            session.LastActivityTime = DateTime.UtcNow;
            session.Status = string.IsNullOrWhiteSpace(request.Status) ? "Incomplete" : request.Status;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Workout session updated.",
                session = new
                {
                    session.SessionId,
                    session.CompletedDuration,
                    session.RemainingDuration,
                    session.RequiredDuration,
                    session.Status
                }
            });
        }

        // ============================
        // WORKOUT STATE MACHINE: COMPLETE SESSION
        // Enforces actual duration >= required duration!
        // ============================
        [HttpPost("session/complete")]
        public async Task<IActionResult> CompleteSession([FromBody] CompleteSessionRequest request)
        {
            var session = await _context.WorkoutSessions
                .Include(s => s.Workout)
                .FirstOrDefaultAsync(s => s.SessionId == request.SessionId && s.UserId == request.UserId);

            if (session == null)
            {
                return NotFound(new { message = "Workout session not found." });
            }

            // CRITICAL SERVER-SIDE VALIDATION: Elapsed duration must satisfy required duration!
            if (request.CompletedDuration < session.RequiredDuration)
            {
                session.CompletedDuration = request.CompletedDuration;
                session.RemainingDuration = session.RequiredDuration - request.CompletedDuration;
                session.Status = "Incomplete";
                session.LastActivityTime = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return BadRequest(new
                {
                    message = $"Your workout is incomplete. You completed {request.CompletedDuration} seconds. {session.RemainingDuration} seconds remaining to finish your workout.",
                    status = "Incomplete",
                    completedDuration = request.CompletedDuration,
                    remainingDuration = session.RemainingDuration
                });
            }

            // Mark completed
            session.CompletedDuration = session.RequiredDuration;
            session.RemainingDuration = 0;
            session.Status = "Completed";
            session.LastActivityTime = DateTime.UtcNow;
            session.CaloriesBurned = session.Workout.CaloriesBurned;

            // Log to historical WorkoutLogs
            var log = new WorkoutLog
            {
                UserId = session.UserId,
                WorkoutId = session.WorkoutId,
                CompletedAt = DateTime.UtcNow,
                CaloriesBurned = session.CaloriesBurned
            };
            _context.WorkoutLogs.Add(log);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"✓ {session.Workout.Name} successfully completed!",
                status = "Completed",
                logId = log.LogId
            });
        }

        // ============================
        // GET ACTIVE / INCOMPLETE SESSION FOR USER (FOR RESUME)
        // ============================
        [HttpGet("session/active/{userId}")]
        public async Task<IActionResult> GetActiveSession(int userId)
        {
            var session = await _context.WorkoutSessions
                .Where(s => s.UserId == userId && (s.Status == "Incomplete" || s.Status == "Paused" || s.Status == "In Progress") && s.RemainingDuration > 0)
                .Include(s => s.Workout)
                .OrderByDescending(s => s.LastActivityTime)
                .FirstOrDefaultAsync();

            if (session == null)
            {
                return Ok(new { active = false });
            }

            return Ok(new
            {
                active = true,
                session = new
                {
                    session.SessionId,
                    session.WorkoutId,
                    session.CompletedDuration,
                    session.RemainingDuration,
                    session.RequiredDuration,
                    session.Status,
                    workoutName = session.Workout.Name,
                    category = session.Workout.Category
                }
            });
        }

        // ============================
        // GET LATEST SESSION FOR USER & WORKOUT (PRESERVES COMPLETED ACROSS REFRESH)
        // ============================
        [HttpGet("session/latest/{userId}/{workoutId}")]
        public async Task<IActionResult> GetLatestSession(int userId, int workoutId)
        {
            var session = await _context.WorkoutSessions
                .Where(s => s.UserId == userId && s.WorkoutId == workoutId)
                .Include(s => s.Workout)
                .OrderByDescending(s => s.LastActivityTime)
                .FirstOrDefaultAsync();

            if (session == null)
            {
                return Ok(new { found = false, session = (object?)null });
            }

            return Ok(new
            {
                found = true,
                session = new
                {
                    session.SessionId,
                    session.WorkoutId,
                    session.CompletedDuration,
                    session.RemainingDuration,
                    session.RequiredDuration,
                    session.Status,
                    workoutName = session.Workout.Name,
                    category = session.Workout.Category
                }
            });
        }

        // ============================
        // COMPREHENSIVE USER PROGRESS (LAST 7 DAYS + KPIS + CHARTS)
        // ============================
        [HttpGet("progress/{userId}")]
        public async Task<IActionResult> GetUserProgress(int userId)
        {
            var today = DateTime.UtcNow.Date;
            var sevenDaysAgo = today.AddDays(-6);

            var logs = await _context.WorkoutLogs
                .Where(l => l.UserId == userId && l.CompletedAt >= sevenDaysAgo)
                .Include(l => l.Workout)
                .ToListAsync();

            var sessions = await _context.WorkoutSessions
                .Where(s => s.UserId == userId && s.LastActivityTime >= sevenDaysAgo)
                .Include(s => s.Workout)
                .ToListAsync();

            var allUserSessions = await _context.WorkoutSessions
                .Where(s => s.UserId == userId)
                .ToListAsync();

            var completedCount = allUserSessions.Count(s => s.Status == "Completed");
            var incompleteCount = allUserSessions.Count(s => s.Status == "Incomplete" || s.Status == "Paused");
            var totalWorkouts = completedCount + incompleteCount;
            var totalDurationSeconds = allUserSessions.Sum(s => s.CompletedDuration);
            var totalCalories = logs.Sum(l => l.CaloriesBurned);

            // Classes & Trainer sessions & Subscription
            var trainerSessions = await _context.Bookings.CountAsync(b => b.UserId == userId && (b.Status == "Confirmed" || b.Status == "Completed"));
            var activeSub = await _context.UserSubscriptions
                .Include(s => s.Plan)
                .FirstOrDefaultAsync(s => s.UserId == userId && s.Status == "Active");
            var currentSubscription = activeSub?.Plan != null ? $"{activeSub.Plan.PlanName} Plan" : "No Active Plan";

            string totalDurationFormatted = totalDurationSeconds >= 3600
                ? $"{totalDurationSeconds / 3600}h {(totalDurationSeconds % 3600) / 60}m"
                : (totalDurationSeconds >= 60 ? $"{totalDurationSeconds / 60} minutes" : $"{totalDurationSeconds} seconds");

            // Itemized 7-day workouts (Section 14: Date, Workout, Category, Duration, Calories, Status)
            var sevenDayWorkouts = new List<object>();

            foreach (var l in logs)
            {
                sevenDayWorkouts.Add(new
                {
                    date = $"{l.CompletedAt:dddd}, {l.CompletedAt:MMM d}",
                    dayOfWeek = l.CompletedAt.ToString("dddd"),
                    workout = l.Workout?.Name ?? "Workout",
                    workoutName = l.Workout?.Name ?? "Workout",
                    category = l.Workout?.Category ?? "Strength",
                    duration = $"{Math.Max(1, l.Workout?.CaloriesBurned > 0 ? 30 : 25)} minutes",
                    calories = $"{l.CaloriesBurned} calories",
                    caloriesBurned = l.CaloriesBurned,
                    status = "Completed",
                    completedAt = l.CompletedAt
                });
            }

            foreach (var s in sessions.Where(s => s.Status == "Incomplete" || s.Status == "Paused"))
            {
                var dur = s.CompletedDuration >= 60 ? $"{s.CompletedDuration / 60} minutes" : $"{s.CompletedDuration} seconds";
                sevenDayWorkouts.Add(new
                {
                    date = $"{s.LastActivityTime:dddd}, {s.LastActivityTime:MMM d}",
                    dayOfWeek = s.LastActivityTime.ToString("dddd"),
                    workout = s.Workout?.Name ?? "Cardio",
                    workoutName = s.Workout?.Name ?? "Cardio",
                    category = s.Workout?.Category ?? "Cardio",
                    duration = dur,
                    calories = $"{s.CaloriesBurned} calories",
                    caloriesBurned = s.CaloriesBurned,
                    status = "Incomplete",
                    completedAt = s.LastActivityTime
                });
            }

            // Last 7 days daily breakdown for charts
            var daysList = new List<object>();
            for (int i = 6; i >= 0; i--)
            {
                var dayDate = today.AddDays(-i);
                var dayLogs = logs.Where(l => l.CompletedAt.Date == dayDate).ToList();
                var daySessions = sessions.Where(s => s.LastActivityTime.Date == dayDate).ToList();

                daysList.Add(new
                {
                    date = dayDate.ToString("yyyy-MM-dd"),
                    dayName = dayDate.ToString("ddd"),
                    dayOfWeek = dayDate.ToString("dddd"),
                    isToday = i == 0,
                    workoutsCount = dayLogs.Count + daySessions.Count(s => s.Status != "Completed"),
                    completedCount = dayLogs.Count,
                    incompleteCount = daySessions.Count(s => s.Status == "Incomplete" || s.Status == "Paused"),
                    minutes = Math.Round((decimal)daySessions.Sum(s => s.CompletedDuration) / 60, 1),
                    calories = dayLogs.Sum(l => l.CaloriesBurned) + daySessions.Where(s => s.Status != "Completed").Sum(s => s.CaloriesBurned)
                });
            }

            // Streak calculation
            var distinctDays = logs.Select(l => l.CompletedAt.Date).Distinct().OrderByDescending(d => d).ToList();
            int streak = 0;
            var cursor = today;
            foreach (var d in distinctDays)
            {
                if (d == cursor) { streak++; cursor = cursor.AddDays(-1); }
                else break;
            }

            var weeklyProgress = Math.Min(5, logs.Count);

            return Ok(new
            {
                summary = new
                {
                    totalWorkouts,
                    completedWorkouts = completedCount,
                    incompleteWorkouts = incompleteCount,
                    totalWorkoutDuration = totalDurationFormatted,
                    totalDurationMinutes = Math.Round((decimal)totalDurationSeconds / 60, 1),
                    caloriesBurned = totalCalories,
                    classesAttended = 0,
                    classesScheduled = 0,
                    trainerSessions,
                    currentSubscription,
                    weeklyGoalProgress = $"{weeklyProgress} / 5 Workouts",
                    weeklyGoalPercent = Math.Min(100, weeklyProgress * 20),
                    dayStreak = streak > 0 ? streak : (completedCount > 0 ? 1 : 0),
                    completionRate = totalWorkouts > 0 ? (int)Math.Round((decimal)completedCount / totalWorkouts * 100) : 0
                },
                last7Days = daysList,
                sevenDayWorkouts,
                completionBreakdown = new
                {
                    completed = completedCount,
                    incomplete = incompleteCount,
                    completionRate = totalWorkouts > 0 ? (int)Math.Round((decimal)completedCount / totalWorkouts * 100) : 0
                },
                weeklyGoal = new
                {
                    target = 5,
                    completed = weeklyProgress,
                    percent = Math.Min(100, weeklyProgress * 20),
                    statusText = weeklyProgress >= 5 ? "Target achieved!" : $"{5 - weeklyProgress} more workout(s) needed this week."
                }
            });
        }

        // Backward-compatible history endpoint
        [HttpGet("history/{userId}")]
        public async Task<IActionResult> GetUserHistory(int userId)
        {
            var logs = await _context.WorkoutLogs
                .Where(l => l.UserId == userId)
                .Include(l => l.Workout)
                .OrderByDescending(l => l.CompletedAt)
                .ToListAsync();

            return Ok(new
            {
                totalWorkouts = logs.Count,
                totalCalories = logs.Sum(l => l.CaloriesBurned),
                dayStreak = logs.Count > 0 ? 1 : 0,
                recent = logs.Take(10).Select(l => new
                {
                    l.LogId,
                    l.CompletedAt,
                    l.CaloriesBurned,
                    WorkoutName = l.Workout.Name,
                    Category = l.Workout.Category
                })
            });
        }

        private static int ParseDurationToSeconds(string duration)
        {
            if (string.IsNullOrWhiteSpace(duration)) return 30;
            var d = duration.Trim().ToLower();
            if (d.Contains(":"))
            {
                var parts = d.Split(':');
                if (parts.Length == 2 && int.TryParse(parts[0], out var m) && int.TryParse(parts[1], out var s))
                {
                    return m * 60 + s;
                }
            }
            var digits = new string(d.Where(char.IsDigit).ToArray());
            if (int.TryParse(digits, out var val))
            {
                if (d.Contains("min")) return val * 60;
                return val;
            }
            return 30;
        }
    }

    public class StartSessionRequest
    {
        public int UserId { get; set; }
        public int WorkoutId { get; set; }
    }

    public class UpdateSessionRequest
    {
        public int SessionId { get; set; }
        public int UserId { get; set; }
        public int CompletedDuration { get; set; }
        public string Status { get; set; } = "Incomplete";
    }

    public class CompleteSessionRequest
    {
        public int SessionId { get; set; }
        public int UserId { get; set; }
        public int CompletedDuration { get; set; }
    }
}
