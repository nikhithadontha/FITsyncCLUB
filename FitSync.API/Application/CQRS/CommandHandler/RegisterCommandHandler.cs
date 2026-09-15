using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Command;

namespace FitSync.API.Application.CQRS.CommandHandler;

public sealed class RegisterCommandHandler : ICqrsHandler<RegisterCommand, object?>
{
    public Task<object?> HandleAsync(RegisterCommand request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing AccountController.Register business logic here without changing the API contract.");
    }
}
