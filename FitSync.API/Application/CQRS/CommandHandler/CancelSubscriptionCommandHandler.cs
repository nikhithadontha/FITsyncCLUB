using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Command;

namespace FitSync.API.Application.CQRS.CommandHandler;

public sealed class CancelSubscriptionCommandHandler : ICqrsHandler<CancelSubscriptionCommand, object?>
{
    public Task<object?> HandleAsync(CancelSubscriptionCommand request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing SubscriptionController.CancelSubscription business logic here without changing the API contract.");
    }
}
