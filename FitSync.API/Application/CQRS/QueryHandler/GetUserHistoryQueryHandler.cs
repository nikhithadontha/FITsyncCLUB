using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Query;

namespace FitSync.API.Application.CQRS.QueryHandler;

public sealed class GetUserHistoryQueryHandler : ICqrsHandler<GetUserHistoryQuery, object?>
{
    public Task<object?> HandleAsync(GetUserHistoryQuery request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing WorkoutController.GetUserHistory business logic here without changing the API contract.");
    }
}
