using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Query;

namespace FitSync.API.Application.CQRS.QueryHandler;

public sealed class GetUserSubscriptionQueryHandler : ICqrsHandler<GetUserSubscriptionQuery, object?>
{
    public Task<object?> HandleAsync(GetUserSubscriptionQuery request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing SubscriptionController.GetUserSubscription business logic here without changing the API contract.");
    }
}
