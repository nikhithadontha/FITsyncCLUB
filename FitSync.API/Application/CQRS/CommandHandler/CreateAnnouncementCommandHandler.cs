using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Command;

namespace FitSync.API.Application.CQRS.CommandHandler;

public sealed class CreateAnnouncementCommandHandler : ICqrsHandler<CreateAnnouncementCommand, object?>
{
    public Task<object?> HandleAsync(CreateAnnouncementCommand request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing AdminController.CreateAnnouncement business logic here without changing the API contract.");
    }
}
