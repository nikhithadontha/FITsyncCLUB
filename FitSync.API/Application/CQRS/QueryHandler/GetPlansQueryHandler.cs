using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Query;

namespace FitSync.API.Application.CQRS.QueryHandler;

public sealed class GetPlansQueryHandler : ICqrsHandler<GetPlansQuery, object?>
{
    public Task<object?> HandleAsync(GetPlansQuery request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing SubscriptionController.GetPlans business logic here without changing the API contract.");
    }
}
