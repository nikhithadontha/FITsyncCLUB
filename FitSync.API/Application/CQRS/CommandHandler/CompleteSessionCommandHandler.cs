using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Command;

namespace FitSync.API.Application.CQRS.CommandHandler;

public sealed class CompleteSessionCommandHandler : ICqrsHandler<CompleteSessionCommand, object?>
{
    public Task<object?> HandleAsync(CompleteSessionCommand request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing WorkoutController.CompleteSession business logic here without changing the API contract.");
    }
}
