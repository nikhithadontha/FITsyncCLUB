using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Command;

namespace FitSync.API.Application.CQRS.CommandHandler;

public sealed class UpdateProfileCommandHandler : ICqrsHandler<UpdateProfileCommand, object?>
{
    public Task<object?> HandleAsync(UpdateProfileCommand request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing AccountController.UpdateProfile business logic here without changing the API contract.");
    }
}
