using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Command;

namespace FitSync.API.Application.CQRS.CommandHandler;

public sealed class CreateTrainerCommandHandler : ICqrsHandler<CreateTrainerCommand, object?>
{
    public Task<object?> HandleAsync(CreateTrainerCommand request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing AdminController.CreateTrainer business logic here without changing the API contract.");
    }
}
