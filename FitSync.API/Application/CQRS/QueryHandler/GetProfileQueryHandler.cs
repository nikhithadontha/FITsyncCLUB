using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Query;

namespace FitSync.API.Application.CQRS.QueryHandler;

public sealed class GetProfileQueryHandler : ICqrsHandler<GetProfileQuery, object?>
{
    public Task<object?> HandleAsync(GetProfileQuery request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing DietController.GetProfile business logic here without changing the API contract.");
    }
}
