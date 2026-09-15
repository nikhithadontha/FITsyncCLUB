using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Command;

namespace FitSync.API.Application.CQRS.CommandHandler;

public sealed class ActivateTrialCommandHandler : ICqrsHandler<ActivateTrialCommand, object?>
{
    public Task<object?> HandleAsync(ActivateTrialCommand request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing SubscriptionController.ActivateTrial business logic here without changing the API contract.");
    }
}
