# FitSync CQRS structure

This folder is organized by request type:

- Command
- CommandHandler
- Common
- Query
- QueryHandler

The files are endpoint-specific scaffolding generated from the current controller endpoints. Existing controllers, frontend assets, models, DbContext, and SQL scripts are preserved. Business logic migration must be completed handler-by-handler before build/deployment.
