using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Command;

namespace FitSync.API.Application.CQRS.CommandHandler;

public sealed class CheckPhoneCommandHandler : ICqrsHandler<CheckPhoneCommand, object?>
{
    public Task<object?> HandleAsync(CheckPhoneCommand request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing AccountController.CheckPhone business logic here without changing the API contract.");
    }
}
