# Smart Apartment Maintenance System -- Frontend

React single-page application providing role-based dashboards for residents, maintenance staff, and administrators to manage apartment maintenance complaints end-to-end.

## Prerequisites

- Node.js 18+ (20+ recommended)
- Backend API Gateway running on `http://localhost:8000`

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

Open the URL printed by Vite (typically `http://localhost:5173`).

From the project root, start the full stack (backend + frontend) with:

```bash
./scripts/dev-local.sh
```

## Environment Variables

Reference: `.env.example`

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | Backend API Gateway base URL (no trailing slash) |

## Scripts

| Command | Action |
|---------|--------|
| `npm run dev` | Start Vite development server (HMR) |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Serve production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest unit tests |

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19 |
| Language | TypeScript | 6 |
| Build Tool | Vite | 8 |
| Routing | react-router-dom | 7 |
| Testing | Vitest + happy-dom | 3 |
| Linting | ESLint + typescript-eslint | 9 |

## Application Routes

| Path | Role | Page | Description |
|------|------|------|-------------|
| `/login` | Public | LoginPage | Email/password authentication |
| `/` | - | HomePage | Auto-redirects to role-specific dashboard |
| `/resident` | Resident | ResidentPage | Create, track, complete complaints |
| `/admin` | Admin | AdminPage | All complaints, assign staff, analytics |
| `/admin/staff` | Admin | ManageStaffPage | Onboard, edit, activate/deactivate staff |
| `/admin/residents` | Admin | ManageResidentsPage | Onboard, edit, activate/deactivate residents |
| `/staff` | Staff | StaffPage | Assigned work queue, status updates |
| `/reviews` | Admin, Staff | ReviewsPage | Feedback and ratings for completed complaints |

## Component Hierarchy

```
App (Router + AuthProvider)
├── LoginPage
├── HomePage (role-based redirect)
└── AppShell (layout: nav + content)
    ├── AdminPage
    │   └── DeleteComplaintConfirmModal
    ├── StaffPage
    │   ├── AuthenticatedImage
    │   └── RowActionMenu
    ├── ResidentPage
    │   ├── AccessibleDialog (new/edit complaint)
    │   ├── AccessibleDialog (complete + rate)
    │   ├── StarRatingInput
    │   ├── DeleteComplaintConfirmModal
    │   └── RowActionMenu
    ├── ManageStaffPage
    │   ├── AccessibleDialog (onboard/edit)
    │   ├── AccessibleDialog (confirm activate/deactivate)
    │   └── RowActionMenu
    ├── ManageResidentsPage
    │   ├── AccessibleDialog (onboard/edit)
    │   ├── AccessibleDialog (confirm activate/deactivate)
    │   └── RowActionMenu
    └── ReviewsPage
```

## Key Components

| Component | File | Purpose |
|-----------|------|---------|
| `AppShell` | `components/AppShell.tsx` | Navigation, sign-out, layout wrapper |
| `RequireRole` | `components/RequireRole.tsx` | Route guard (single role or array) |
| `AccessibleDialog` | `components/AccessibleDialog.tsx` | Modal with focus trap, ESC close, scroll lock |
| `RowActionMenu` | `components/RowActionMenu.tsx` | Three-dot menu with keyboard navigation |
| `AuthenticatedImage` | `components/AuthenticatedImage.tsx` | Loads images with Bearer token |
| `StarRatingInput` | `components/StarRatingInput.tsx` | Interactive 1-5 star selector |
| `DeleteComplaintConfirmModal` | `components/DeleteComplaintConfirmModal.tsx` | Deletion confirmation dialog |
| `AuthContext` | `context/AuthContext.tsx` | JWT storage, user state, login/logout |

## Project Structure

```
ams-frontend/src/
├── api/
│   ├── client.ts            # API call functions (fetch wrapper)
│   └── types.ts             # TypeScript interfaces (Complaint, User, Review)
├── components/
│   ├── AccessibleDialog.tsx # Reusable accessible modal
│   ├── AppShell.tsx         # Layout + role-based navigation
│   ├── AuthenticatedImage.tsx
│   ├── DeleteComplaintConfirmModal.tsx
│   ├── RequireRole.tsx      # Route protection
│   ├── RowActionMenu.tsx    # Dropdown action menu
│   └── StarRatingInput.tsx
├── context/
│   └── AuthContext.tsx      # Auth state management
├── domain/
│   ├── complaintWorkflow.ts # Status transition rules
│   └── complaintWorkflow.test.ts
├── pages/
│   ├── AdminPage.tsx        # Admin dashboard + analytics
│   ├── HomePage.tsx         # Role redirect
│   ├── LoginPage.tsx        # Authentication form
│   ├── ManageResidentsPage.tsx
│   ├── ManageStaffPage.tsx
│   ├── ResidentPage.tsx     # Complaint CRUD + completion
│   ├── ReviewsPage.tsx      # Reviews with filters
│   └── StaffPage.tsx        # Assigned work + lightbox
├── App.tsx                  # Route definitions
├── main.tsx                 # Entry point
└── index.css                # Global styles + theme variables
```

## Accessibility (WCAG 2.1 AA)

The application meets WCAG 2.1 Level AA compliance:

- **Color contrast:** All text meets 4.5:1 minimum (body: 14.5:1, muted: 7.0:1)
- **Keyboard navigation:** Full operability via Tab, Arrow keys, Enter, Space, Escape
- **Screen readers:** Semantic HTML, ARIA landmarks, live regions, hidden decorative icons
- **Focus management:** Visible focus indicators, focus trap in modals, focus restoration
- **Motion preferences:** Respects `prefers-reduced-motion`
- **High contrast:** Supports `forced-colors` and `prefers-contrast: more`

## Authentication Flow

1. User submits email/password on `/login`
2. Backend returns JWT access token (30-minute expiry)
3. Token stored in `sessionStorage`
4. `AuthContext` attaches `Authorization: Bearer <token>` to all API calls
5. On token expiry or 401 response, user is redirected to `/login`
6. Sign-out clears token and redirects to `/login`

## Features by Role

### Resident
- Create, edit, delete complaints (while pending)
- Attach images (while pending)
- Track complaint status
- Complete resolved complaints with star rating + feedback
- Reopen resolved complaints

### Maintenance Staff
- View assigned complaints
- Advance status (pending → in progress → resolved)
- Reopen in-progress complaints
- View attached images in lightbox
- View own reviews and ratings

### Admin
- View all complaints with filters (status, category, priority)
- Assign staff to complaints
- Delete any complaint
- View category-wise analytics
- Onboard/edit/activate/deactivate staff and residents
- View all reviews with staff and rating filters
