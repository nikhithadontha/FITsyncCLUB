using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Command;

namespace FitSync.API.Application.CQRS.CommandHandler;

public sealed class DeleteTrainerCommandHandler : ICqrsHandler<DeleteTrainerCommand, object?>
{
    public Task<object?> HandleAsync(DeleteTrainerCommand request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing AdminController.DeleteTrainer business logic here without changing the API contract.");
    }
}
