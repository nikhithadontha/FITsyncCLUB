using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Query;

namespace FitSync.API.Application.CQRS.QueryHandler;

public sealed class GetAnnouncementsQueryHandler : ICqrsHandler<GetAnnouncementsQuery, object?>
{
    public Task<object?> HandleAsync(GetAnnouncementsQuery request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing AdminController.GetAnnouncements business logic here without changing the API contract.");
    }
}
