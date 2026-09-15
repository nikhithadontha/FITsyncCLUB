using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Query;

namespace FitSync.API.Application.CQRS.QueryHandler;

public sealed class GetLatestSessionQueryHandler : ICqrsHandler<GetLatestSessionQuery, object?>
{
    public Task<object?> HandleAsync(GetLatestSessionQuery request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing WorkoutController.GetLatestSession business logic here without changing the API contract.");
    }
}
