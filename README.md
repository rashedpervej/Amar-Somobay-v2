# Somobay

<p align="center">
  <strong>A modern, mobile-first cooperative management platform for Bangladesh.</strong>
  <br />
  সহজ, স্বচ্ছ ও সুদমুক্ত সমবায় ব্যবস্থাপনা
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white" />
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Backend-3fcf8e?logo=supabase&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/Status-Active%20Development-orange" />
</p>

---

## Overview

**Somobay** is a mobile-first cooperative management application designed for community-based savings, collective financial goals, and interest-free financial assistance in Bangladesh.

The platform aims to make cooperative operations easier to manage and understand for members, cooperative administrators, collectors, and platform administrators. It brings member management, savings activities, approvals, financial records, and reporting into one structured system.

Somobay is being developed around transparent workflows, clear financial records, role-based access, and Islamic financial principles. **Interest (Riba) is not part of the platform's intended financial model.**

> **Project status:** Active development. Features, workflows, and architecture may evolve. Do not treat this repository as a production-ready financial system until the security, accounting, and end-to-end acceptance checks have been completed.

## Core modules

Somobay is planned around three savings categories and one separate interest-free assistance module.

| Module | Purpose |
| --- | --- |
| **General Cooperative Savings** | Regular member savings, deposits, withdrawals, balances, transaction history, receipts, and cooperative-level reporting. |
| **ROSCA** | Group-based rotating savings, scheduled contributions, draw management, payout tracking, outstanding contributions, and draw history. |
| **Joint Goal / Collective Savings** | Shared savings goals, target amounts, member contributions, progress tracking, and goal completion. |
| **Qard Hasanah** | A separate interest-free assistance and repayment workflow for eligible existing cooperative members. |

### Qard Hasanah eligibility

Qard Hasanah is separate from the savings categories. Access is controlled by the cooperative administrator. Only existing cooperative members who meet the administrator-configured eligibility rules may apply.

The eligibility policy may be configured by member, member group, or applicable scheme, subject to the final approved business rules.

## User roles

The application is designed to support role-specific experiences and permissions.

- **Member** — views personal savings, contributions, transactions, applications, statements, and notifications.
- **Cooperative Admin** — manages a cooperative's members, schemes, transactions, approvals, collection operations, and reports.
- **Collector** — performs assigned collection and payment-related tasks within the permissions granted by the cooperative.
- **Platform Super Admin** — oversees platform-level cooperative administration and platform configuration.

A user's access must be determined by authenticated role and organization membership. UI visibility alone is not an authorization boundary; access must also be enforced by backend policies.

## Product principles

- **Mobile-first experience:** prioritize practical, readable workflows on mobile devices.
- **Role-aware UX:** provide distinct navigation and screens for Member, Cooperative Admin, Collector, and Platform Admin.
- **Responsive administration:** make the relevant administration workflows usable on both mobile and desktop; desktop web may use a dedicated layout.
- **Financial clarity:** distinguish deposits, withdrawals, contributions, payouts, outstanding principal, and balances. Do not silently combine unrelated financial balances.
- **Auditability:** sensitive financial and administrative actions should be traceable.
- **Security by design:** enforce organization boundaries, role permissions, authentication, and Row Level Security (RLS).
- **Interest-free model:** do not introduce interest, interest-based returns, or interest-equivalent charges.

## Technology

The current repository includes the following main technologies:

| Area | Technology |
| --- | --- |
| Frontend | React 19, TypeScript |
| Build tooling | Vite 6 |
| Routing | React Router |
| Client state | Zustand |
| Backend / data | Supabase (PostgreSQL, Auth, RLS, Storage) |
| Server | Node.js, Express, TypeScript |
| UI / motion | Tailwind CSS, Lucide React, Motion |

See [package.json](./package.json) for the current dependency list and available scripts.

## Run locally

### Requirements

- Node.js (use a current LTS release)
- npm
- Access to a configured Supabase project
- Required API credentials for any optional integrations enabled in your local environment

### 1. Clone the repository

```bash
git clone https://github.com/rashedpervej/Amar-Somobay-v2.git
cd Amar-Somobay-v2
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a local environment file based on the example:

```bash
cp .env.example .env.local
```

On Windows, you can copy the file manually:

```powershell
Copy-Item .env.example .env.local
```

Review `.env.example` and add the values required by the features you intend to run. Never commit `.env.local`, service-role keys, database passwords, private tokens, or other secrets.

### 4. Start the development server

```bash
npm run dev
```

Use the local URL printed in the terminal.

### 5. Build and type-check

```bash
npm run lint
npm run build
```

The `lint` script currently runs the TypeScript compiler in no-emit mode. Run both checks before submitting changes.

## Environment and security

- Keep credentials in local environment files or your deployment provider's secret manager.
- Never expose the Supabase service-role key in browser code.
- Use the Supabase anon/publishable key only with correctly configured RLS policies.
- Do not disable RLS to make a screen work.
- Validate sensitive operations on the server/database layer; frontend checks are not sufficient.
- Test tenant isolation and role permissions with separate test accounts.
- Do not use real member financial data in screenshots, demos, or test fixtures.
- Review SQL migrations before applying them to a shared or production database.

The repository contains SQL setup, migration, workflow, and security-related scripts. These scripts may represent different stages of development. **Do not execute every `.sql` file in filename order.** Review the intended migration sequence, current database schema, and rollback implications first.

## Project structure

The repository currently contains these main areas:

```text
.
├── api/                  # API-related code
├── data/                 # Data assets and fixtures
├── public/               # Static public assets
├── src/
│   ├── components/       # Shared UI components
│   ├── constants/        # Application constants
│   ├── data/             # Frontend data and configuration
│   ├── hooks/            # Reusable React hooks
│   ├── lib/              # Shared libraries and integrations
│   ├── pages/            # Application screens
│   ├── store/            # Zustand state stores
│   ├── types/             # TypeScript types
│   ├── App.tsx            # Application routes and composition
│   ├── index.css          # Global styles
│   └── main.tsx           # Frontend entry point
├── *.sql                  # Database setup and migration scripts
├── server.ts              # Express server entry point
├── package.json
├── vite.config.ts
└── vercel.json
```

This is a high-level map; consult the source tree for the current file-level structure.

## Development guidance

When adding or changing a feature:

1. Identify the affected role, module, route, and user workflow.
2. Check whether a reusable component or existing workflow already exists.
3. Preserve the established design system and mobile-first interaction patterns.
4. Keep financial calculations and state transitions consistent with the approved business rules.
5. Enforce permissions at the backend/database layer, not only in the UI.
6. Add or update tests for success, failure, loading, empty, and permission-denied states.
7. Run `npm run lint` and `npm run build`.
8. Document schema changes and provide a safe migration/rollback plan.

For financial workflows, use explicit approval states and auditable transaction records. Never treat a UI success message as proof that a database transaction has committed.

## Documentation

Project documentation and SQL files are maintained in the repository. Start with the relevant audit/specification documents and check their status and date before relying on them, as some documents may describe earlier implementation stages.

Useful starting points:

- [Core structure and UX audit](./AMAR_SOMOBAY_CORE_STRUCTURE_UX_AUDIT.md)
- [Interactive UX and QA audit](./AMAR_SOMOBAY_INTERACTIVE_UX_QA_AUDIT.md)
- [Role-based application audit](./AUDIT_REPORT_ROLE_BASED_APPLICATION.md)
- [Application routes](./routes_list.txt)
- [Supabase setup](./SUPABASE_SETUP.sql)

## Roadmap direction

The product is being developed incrementally:

1. Strengthen the cooperative foundation, identity, roles, permissions, and security.
2. Complete General Cooperative Savings workflows.
3. Develop ROSCA workflows and draw/payout controls.
4. Develop Joint Goal contribution and completion workflows.
5. Complete Qard Hasanah eligibility, application, disbursement, and repayment workflows.
6. Consolidate role-based mobile experiences and dedicated desktop administration where needed.
7. Complete end-to-end testing, accessibility checks, financial reconciliation, and production readiness review.

The roadmap is a direction, not a claim that every item is already implemented.

## Contributing

Changes should be focused and reviewable. Prefer feature branches and pull requests over direct changes to the main branch.

Before opening a pull request:

- Explain the user problem and affected roles/modules.
- List routes, components, and database objects changed.
- Include relevant screenshots for UI changes.
- Include test results.
- Clearly identify any migration, permission, or financial-accounting impact.

## License

No open-source license is currently specified in this repository. Unless a license is added, the source remains subject to the repository owner's rights; do not assume it is available for unrestricted reuse.
