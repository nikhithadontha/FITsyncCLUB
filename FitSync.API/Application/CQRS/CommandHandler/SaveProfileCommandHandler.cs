using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Command;

namespace FitSync.API.Application.CQRS.CommandHandler;

public sealed class SaveProfileCommandHandler : ICqrsHandler<SaveProfileCommand, object?>
{
    public Task<object?> HandleAsync(SaveProfileCommand request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing DietController.SaveProfile business logic here without changing the API contract.");
    }
}
