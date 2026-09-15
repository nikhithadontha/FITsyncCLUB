using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Command;

namespace FitSync.API.Application.CQRS.CommandHandler;

public sealed class DeleteAnnouncementCommandHandler : ICqrsHandler<DeleteAnnouncementCommand, object?>
{
    public Task<object?> HandleAsync(DeleteAnnouncementCommand request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing AdminController.DeleteAnnouncement business logic here without changing the API contract.");
    }
}
