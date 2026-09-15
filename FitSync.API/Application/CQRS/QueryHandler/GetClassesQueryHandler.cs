using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Query;

namespace FitSync.API.Application.CQRS.QueryHandler;

public sealed class GetClassesQueryHandler : ICqrsHandler<GetClassesQuery, object?>
{
    public Task<object?> HandleAsync(GetClassesQuery request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing AdminController.GetClasses business logic here without changing the API contract.");
    }
}
