# Architectural & Naming Conventions for React/TypeScript

This document defines the standard folder structure and naming rules for the frontend codebase. All modules, components, hooks, services, and utilities must follow these rules consistently.

---

## 1. Directory Structure & Responsibilities

```text
resources/js/
├── features/                 # Domain / Business-specific modules
│   ├── Contracts/            # Contracts feature domain
│   │   ├── ContractList/     # Table, filters, metrics, and list views
│   │   ├── ContractDetail/   # Detail view, tabs (documents, parties, history, etc.)
│   │   ├── components/       # Feature-specific modals, cards, tooltips
│   │   ├── hooks/            # Feature-specific hooks (e.g., useContractPermissions.ts)
│   │   ├── services/         # Feature-specific API clients (e.g., contractService.ts)
│   │   └── types.ts          # Feature TypeScript types & interfaces
│   ├── Workflows/            # Workflows builder, visualizer, execution
│   ├── Dashboard/            # Dashboard metrics, charts, & overviews
│   ├── FormBuilder/          # Interactive Form Builder & template designer
│   └── Core/                 # Master Data dynamic CRUD engine
│
├── pages/                    # Thin route-level pages (Inertia page entrypoints)
│   ├── contracts/            # Thin Inertia route mapping (e.g. Index.tsx)
│   ├── workflows/            # Thin Inertia route mapping
│   ├── dashboard/            # Thin Inertia route mapping
│   └── ...                   # Only handles props receiving & feature delegation
│
├── components/
│   ├── ui/                   # Generic, reusable, domain-agnostic UI elements
│   │   ├── Button/           # Buttons, icon buttons, group buttons
│   │   ├── Card/             # Generic cards, surface wrappers
│   │   ├── Input/            # Text inputs, number inputs, search inputs
│   │   └── DataTable/        # Generic headless/styled data table
│   └── feedback/             # Shared feedback states (loading, empty, error, toast)
│       ├── LoadingLottie.tsx # Animation loader
│       ├── EmptyState.tsx    # Empty placeholder
│       ├── StatusBadge.tsx   # Badge/status indicator
│       ├── Skeleton.tsx      # Skeleton loader
│       └── Toast.tsx         # Toast provider and notifications
│
├── layouts/                  # Application shells & persistent layouts
│   ├── AppLayout.tsx         # Main application layout with sidebar & header
│   ├── AuthLayout.tsx        # Authentication layout (login, reset password)
│   └── MasterPageLayout.tsx  # Generic page shell with toolbar & breadcrumbs
│
├── hooks/                    # Shared / Global cross-cutting React hooks
│   ├── useDebounce.ts        # Debounce hook
│   ├── usePermissions.ts     # Permissions and RBAC resolution hook
│   └── useMobileNavigation.ts# Mobile drawer/sheet navigation hook
│
├── lib/                      # Infrastructure, utilities, & storage helpers
│   ├── clientStorage.ts      # LocalStorage & SessionStorage wrapper
│   ├── formatters.ts         # Number, currency, and string formatters
│   ├── timeUtils.ts          # Date & timestamp utilities
│   └── utils.ts              # Styling helpers (`cn`, `clsx`, `twMerge`)
│
└── routes/                   # Routing configuration & route path constants
    ├── navigation.ts         # Navigation menu definitions & permissions
    └── routes.ts             # Route constant definitions
```

---

## 2. Naming Conventions

### 2.1 File & Folder Naming Rules

| Artifact Type | Convention | Example | Description |
| :--- | :--- | :--- | :--- |
| **Component Folder** | `PascalCase` | `ContractList/`, `ContractDetail/`, `ApprovalSteps/` | Folder containing component files. |
| **Component File** | `PascalCase.tsx` | `ContractList.tsx`, `PartiesTab.tsx`, `Button.tsx` | React functional component file. |
| **Page Component** | `PascalCase.tsx` | `ContractListPage.tsx`, `Index.tsx` | Inertia route entrypoint page. |
| **Custom Hook** | `useCamelCase.ts` | `useContracts.ts`, `usePermissions.ts` | React custom hook prefixed with `use`. |
| **Service / API** | `camelCase.ts` | `contractService.ts`, `workflowApi.ts` | Backend communication or HTTP client. |
| **Utility / Helper** | `camelCase.ts` | `formatters.ts`, `clientStorage.ts` | Pure functions without React state. |
| **Type Definition** | `camelCase.ts` or `types.ts` | `contractTypes.ts`, `types.ts` | TypeScript interfaces and types. |

---

## 3. Guiding Principles

1. **Feature Isolation**: Everything specific to a business feature belongs in `features/<FeatureName>/`. Do not place business-specific logic in `components/ui/`.
2. **Domain-Agnostic `components/ui/`**: Components in `components/ui/` must NOT import from `features/` or depend on business models.
3. **Thin Page Entrypoints**: Files in `pages/` are thin wrappers resolving Inertia controller data and immediately passing props to corresponding `features/<FeatureName>/` components.
4. **No 1-Line Proxy Files**: Do not create wrapper files that only re-export (`export * from '...'`). Import directly from the source module.
5. **Clear & Descriptive Names**: Avoid vague folder names like `parts/`, `stuff/`, or generic file names like `ui.tsx`.
