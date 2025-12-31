# Everyday Property Manager

[![GitHub](https://img.shields.io/badge/GitHub-adamj--ops%2Fproperty--manager-blue?logo=github)](https://github.com/adamj-ops/property-manager)

A modern, full-stack property management application built with TanStack Start.

## Features

- **Property Management** - Track and manage rental properties
- **Tenant Management** - Manage tenant information and leases
- **Financial Tracking** - Monitor rent collection and expenses
- **Maintenance Requests** - Handle property maintenance workflows
- **Dashboard Analytics** - Visual insights into your portfolio

## Tech Stack

- [React 19](https://19.react.dev/)
- [React Compiler](https://19.react.dev/learn/react-compiler)
- [TanStack Start](https://tanstack.com/start/latest)
- [TanStack Router](https://tanstack.com/router/latest)
- [TanStack Query](https://tanstack.com/query/latest)
- [TanStack Form](https://tanstack.com/form/latest)
- [TanStack Virtual](https://tanstack.com/virtual/latest)
- [Better Auth](https://www.better-auth.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Prisma](https://www.prisma.io/)
- [Zod](https://zod.dev/)
- [next-intl core library](https://next-intl-docs.vercel.app/docs/environments/core-library)
- [Nodemailer](https://nodemailer.com/) + [React Email](https://react.email/)

## Design System

The UI is built on a custom design system derived from [Rehab Planner Pro](https://github.com/adamj-ops/rehab-planner-pro) for visual consistency:

- **Warm gray palette** with soft green and coral accents
- **14px base font** optimized for data-dense dashboards
- **Dark mode first** design with refined shadows
- **Consistent component patterns** (Button, Card, Input variants)

See `.cursor/docs/DESIGN_SYSTEM.md` for full documentation.

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- PostgreSQL database

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.development
cp .env.example .env.production

# Push database schema
pnpm db:push:d

# Start development server
pnpm dev
```

### Environment Variables

Required environment variables:

```env
VITE_APP_NAME="Everyday Property Manager"
VITE_APP_URL="http://localhost:3000"
VITE_APP_EMAIL="noreply@example.com"

DATABASE_URL="postgresql://..."

BETTER_AUTH_SECRET="your-secret-key"
```

## Development

```bash
# Start dev server
pnpm dev

# Type checking
pnpm typecheck

# Linting
pnpm lint
pnpm lint:fix

# Database
pnpm db:push:d     # Push schema (development)
pnpm db:studio:d   # Open Prisma Studio

# Email preview
pnpm email
```

## Project Structure

```
├── src/
│   ├── components/     # UI components
│   │   ├── layout/     # Layout components (sidebar, header)
│   │   └── ui/         # Shadcn UI components
│   ├── routes/         # File-based routing
│   ├── services/       # API services and queries
│   ├── server/         # Server-side code
│   ├── libs/           # Utility libraries
│   ├── hooks/          # React hooks
│   └── styles/         # Global styles
├── prisma/             # Database schema
├── plugins/            # Tailwind plugins
└── .cursor/            # Project documentation
    ├── docs/           # Design system docs
    ├── notes/          # Development notes
    └── rules/          # Coding guidelines
```

## Documentation

Comprehensive project documentation is available in the `.cursor/docs/` directory:

| Document | Description |
|----------|-------------|
| [PROJECT_DOCUMENTATION.md](.cursor/docs/PROJECT_DOCUMENTATION.md) | Executive summary, product vision, system architecture |
| [TECHNICAL_SPEC.md](.cursor/docs/TECHNICAL_SPEC.md) | Database schema, API design, authentication |
| [FEATURE_ROADMAP.md](.cursor/docs/FEATURE_ROADMAP.md) | Phased implementation plan with sprint breakdown |
| [DESIGN_SYSTEM.md](.cursor/docs/DESIGN_SYSTEM.md) | Visual design specification |

### Reference Materials

- [EPICS_AND_USER_STORIES.md](.cursor/reference/EPICS_AND_USER_STORIES.md) - Detailed feature specifications
- [property-management-prototype.md](.cursor/reference/property-management-prototype.md) - ASCII wireframes and UX specs

## License

Private - All rights reserved
