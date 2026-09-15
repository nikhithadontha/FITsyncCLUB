using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Command;

namespace FitSync.API.Application.CQRS.CommandHandler;

public sealed class DeleteClassCommandHandler : ICqrsHandler<DeleteClassCommand, object?>
{
    public Task<object?> HandleAsync(DeleteClassCommand request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing AdminController.DeleteClass business logic here without changing the API contract.");
    }
}
