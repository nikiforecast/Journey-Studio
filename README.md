# Journey Studio (JS)

Collaborative workspace for mapping user journeys, research notes, and product discovery.

## Quick start

```bash
npm install
npm run dev
```

Copy environment variables from a teammate or see [docs/deployment/ENVIRONMENT_VARIABLES_GUIDE.md](docs/deployment/ENVIRONMENT_VARIABLES_GUIDE.md).

## Documentation

All project documentation lives under **[docs/](docs/README.md)**:

| Topic | Location |
|-------|----------|
| Deployment & Netlify | [docs/deployment/](docs/deployment/) |
| Auth (Supabase / Auth0) | [docs/auth/](docs/auth/) |
| Database & RLS | [docs/database/](docs/database/) |
| Product features | [docs/features/](docs/features/) |
| Troubleshooting | [docs/troubleshooting/](docs/troubleshooting/) |
| Architecture diagrams | [docs/assets/](docs/assets/) |

## Repository layout

```
src/                 React app (Vite + TypeScript)
netlify/functions/   Serverless AI & background jobs
supabase/            Migrations, config, edge functions
kyp-mcp-connector/   MCP server for Claude Cowork
docs/                Documentation
scripts/             Deploy script and ad-hoc SQL/JS utilities
```

## Tech stack

React · Vite · TypeScript · Tailwind · Supabase · Netlify · OpenAI

See [docs/assets/journey-studio-tech-stack.svg](docs/assets/journey-studio-tech-stack.svg) for an architecture overview.
