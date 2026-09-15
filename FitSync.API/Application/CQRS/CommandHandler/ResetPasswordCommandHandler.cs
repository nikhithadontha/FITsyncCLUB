using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Command;

namespace FitSync.API.Application.CQRS.CommandHandler;

public sealed class ResetPasswordCommandHandler : ICqrsHandler<ResetPasswordCommand, object?>
{
    public Task<object?> HandleAsync(ResetPasswordCommand request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing AccountController.ResetPassword business logic here without changing the API contract.");
    }
}
