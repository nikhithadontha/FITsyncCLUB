using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Query;

namespace FitSync.API.Application.CQRS.QueryHandler;

public sealed class GetUserPlanQueryHandler : ICqrsHandler<GetUserPlanQuery, object?>
{
    public Task<object?> HandleAsync(GetUserPlanQuery request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing DietController.GetUserPlan business logic here without changing the API contract.");
    }
}
