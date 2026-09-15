using FitSync.API.Application.CQRS.Common;

namespace FitSync.API.Application.CQRS.Command;

public sealed record CreateAnnouncementCommand : ICqrsRequest<object?>;
