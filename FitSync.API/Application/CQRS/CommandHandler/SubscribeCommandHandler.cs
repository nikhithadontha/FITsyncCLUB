using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Command;

namespace FitSync.API.Application.CQRS.CommandHandler;

public sealed class SubscribeCommandHandler : ICqrsHandler<SubscribeCommand, object?>
{
    public Task<object?> HandleAsync(SubscribeCommand request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing SubscriptionController.Subscribe business logic here without changing the API contract.");
    }
}
