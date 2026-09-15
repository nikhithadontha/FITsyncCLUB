using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Query;

namespace FitSync.API.Application.CQRS.QueryHandler;

public sealed class GetActiveSessionQueryHandler : ICqrsHandler<GetActiveSessionQuery, object?>
{
    public Task<object?> HandleAsync(GetActiveSessionQuery request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing WorkoutController.GetActiveSession business logic here without changing the API contract.");
    }
}
