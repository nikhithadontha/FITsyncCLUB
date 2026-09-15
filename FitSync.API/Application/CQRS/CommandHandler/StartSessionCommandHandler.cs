using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Command;

namespace FitSync.API.Application.CQRS.CommandHandler;

public sealed class StartSessionCommandHandler : ICqrsHandler<StartSessionCommand, object?>
{
    public Task<object?> HandleAsync(StartSessionCommand request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing WorkoutController.StartSession business logic here without changing the API contract.");
    }
}
