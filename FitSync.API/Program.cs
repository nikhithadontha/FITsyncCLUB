using FitSync_API.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Register FitSyncDbContext with SQLite or SQL Server
var dbProvider = builder.Configuration.GetValue<string>("DatabaseProvider") ?? "Sqlite";
var sqliteConnection = builder.Configuration.GetConnectionString("SqliteConnection") ?? "Data Source=FitSync.db";
var sqlServerConnection = builder.Configuration.GetConnectionString("FitSyncConnection");

builder.Services.AddDbContext<FitSyncDbContext>(options =>
{
    if (dbProvider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(sqlServerConnection))
    {
        options.UseSqlServer(sqlServerConnection);
    }
    else
    {
        options.UseSqlite(sqliteConnection);
    }
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Make it obvious which database this run is actually writing to -
// this is the #1 cause of "my data isn't showing up" confusion when
// switching between SQLite and SQL Server.
if (dbProvider.Equals("SqlServer", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(sqlServerConnection))
{
    Console.WriteLine($"[FitSync] Using SQL Server -> {sqlServerConnection}");
}
else
{
    var fullDbPath = Path.GetFullPath(sqliteConnection.Replace("Data Source=", "").Trim());
    Console.WriteLine($"[FitSync] Using SQLite -> {fullDbPath}");
}

// Automatically initialize and seed the database on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<FitSyncDbContext>();
        DbInitializer.Initialize(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while initializing the database.");
    }
}

// Serve HTML, CSS, JavaScript, images and videos from wwwroot
app.UseDefaultFiles();
app.UseStaticFiles();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();