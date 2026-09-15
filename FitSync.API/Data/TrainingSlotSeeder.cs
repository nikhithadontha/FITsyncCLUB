using FitSync_API.Models;
using Microsoft.EntityFrameworkCore;

namespace FitSync_API.Data
{
    // ============================================================
    // Keeps every active trainer stocked with bookable slots.
    //
    // The original seed only ever ran once ("if no slots exist at
    // all, create 3 days' worth"). Once those 3 days were in the
    // past, GetTrainerSlots() would always return an empty list
    // and the seed would never run again - trainers permanently
    // showed "No open slots" / "Could not load slots".
    //
    // TopUpAllTrainers() is safe to call on every app startup: it
    // only inserts the (date, time) combinations that are missing
    // for the next DaysAhead days, so it never creates duplicates
    // and never touches already-booked slots.
    // ============================================================
    public static class TrainingSlotSeeder
    {
        public const int DaysAhead = 7;

        private static readonly (TimeSpan Start, TimeSpan End)[] DailySlotTimes = new[]
        {
            (new TimeSpan(7, 0, 0), new TimeSpan(8, 0, 0)),
            (new TimeSpan(18, 0, 0), new TimeSpan(19, 0, 0))
        };

        public static void TopUpAllTrainers(FitSyncDbContext context)
        {
            var trainers = context.Trainers.Where(t => t.IsActive).ToList();
            foreach (var trainer in trainers)
            {
                TopUpSlotsForTrainer(context, trainer);
            }
        }

        // Caller is responsible for calling context.SaveChanges() afterwards.
        public static void TopUpSlotsForTrainer(FitSyncDbContext context, Trainer trainer)
        {
            var today = DateTime.UtcNow.Date;
            var windowEnd = today.AddDays(DaysAhead + 1);

            var existing = context.TrainingSlots
                .Where(s => s.TrainerId == trainer.TrainerId && s.SlotDate >= today && s.SlotDate < windowEnd)
                .Select(s => new { s.SlotDate, s.StartTime })
                .ToList();

            var existingSet = new HashSet<(DateTime, TimeSpan)>(
                existing.Select(e => (e.SlotDate, e.StartTime)));

            for (int d = 1; d <= DaysAhead; d++)
            {
                var slotDate = today.AddDays(d);

                foreach (var (start, end) in DailySlotTimes)
                {
                    if (existingSet.Contains((slotDate, start)))
                    {
                        continue;
                    }

                    context.TrainingSlots.Add(new TrainingSlot
                    {
                        TrainerId = trainer.TrainerId,
                        SlotDate = slotDate,
                        StartTime = start,
                        EndTime = end,
                        TrainingType = trainer.Specialization,
                        Status = "Available",
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }
        }
    }
}
