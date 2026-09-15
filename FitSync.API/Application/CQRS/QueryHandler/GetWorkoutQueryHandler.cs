using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Query;

namespace FitSync.API.Application.CQRS.QueryHandler;

public sealed class GetWorkoutQueryHandler : ICqrsHandler<GetWorkoutQuery, object?>
{
    public Task<object?> HandleAsync(GetWorkoutQuery request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing WorkoutController.GetWorkout business logic here without changing the API contract.");
    }
}
