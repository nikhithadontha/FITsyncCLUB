using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Query;

namespace FitSync.API.Application.CQRS.QueryHandler;

public sealed class GetFacilitiesQueryHandler : ICqrsHandler<GetFacilitiesQuery, object?>
{
    public Task<object?> HandleAsync(GetFacilitiesQuery request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing AdminController.GetFacilities business logic here without changing the API contract.");
    }
}
