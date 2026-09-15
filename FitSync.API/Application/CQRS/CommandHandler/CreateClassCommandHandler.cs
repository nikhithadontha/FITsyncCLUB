using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Command;

namespace FitSync.API.Application.CQRS.CommandHandler;

public sealed class CreateClassCommandHandler : ICqrsHandler<CreateClassCommand, object?>
{
    public Task<object?> HandleAsync(CreateClassCommand request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing AdminController.CreateClass business logic here without changing the API contract.");
    }
}
