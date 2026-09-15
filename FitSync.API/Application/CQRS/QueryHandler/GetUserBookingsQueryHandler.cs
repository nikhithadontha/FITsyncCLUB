using FitSync.API.Application.CQRS.Common;
using FitSync.API.Application.CQRS.Query;

namespace FitSync.API.Application.CQRS.QueryHandler;

public sealed class GetUserBookingsQueryHandler : ICqrsHandler<GetUserBookingsQuery, object?>
{
    public Task<object?> HandleAsync(GetUserBookingsQuery request, CancellationToken cancellationToken = default)
    {
        throw new NotImplementedException("Migrate the existing BookingController.GetUserBookings business logic here without changing the API contract.");
    }
}
