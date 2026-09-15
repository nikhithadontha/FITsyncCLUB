using FitSync.API.Application.CQRS.Common;

namespace FitSync.API.Application.CQRS.Query;

public sealed record GetAnnouncementsQuery : ICqrsRequest<object?>;
