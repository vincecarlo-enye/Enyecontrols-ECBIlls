# Enyecontrols EC Bills System

React + Vite billing system.

## Quick Start

```bash
npm install
npm run dev
```

Then open http://localhost:5173

## Demo Credentials

| Role             | Email                  | Password   |
|------------------|------------------------|------------|
| Admin            | admin@enye.com         | admin123   |
| Tenant           | tenant@enye.com        | tenant123  |
| Facility Manager | facility@enye.com      | 123456     |
| Finance Officer  | finance@example.com    | password   |

## Project Structure

```
src/
├── app/
│   ├── router.jsx          # Root router with Suspense
│   ├── guards.jsx          # Role-based route guards
│   ├── adminRoutes.jsx     # Admin route group
│   ├── tenantRoutes.jsx    # Tenant route group
│   └── facilityRoutes.jsx  # Facility + Finance route groups
├── components/
│   ├── billing/
│   │   ├── hooks/useBills.js   # Billing data hook
│   │   ├── BillsTable.jsx
│   │   ├── BillViewerModal.jsx
│   │   └── PaymentModal.jsx
│   ├── ui/
│   │   ├── LoadingSpinner.jsx
│   │   ├── ErrorState.jsx
│   │   └── EmptyState.jsx
│   ├── charts/
│   ├── common/
│   └── navigation/
├── context/                # React Context providers
├── hooks/
│   └── useModalState.js    # Generic modal state hook
├── services/               # API/data service layer
│   ├── billingService.js
│   ├── tenantService.js
│   └── reportService.js
├── layouts/
├── pages/
│   ├── admin/
│   ├── tenant/
│   ├── facility/
│   └── finance/
├── data/mock/              # Mock JSON data (replace with API)
└── utils/
```

## Backend Integration

All data operations are centralised in `src/services/`. To connect a real API,
replace the mock implementations in each service file with `fetch()` calls:

```js
// Before (mock):
export async function fetchBills() {
  return [..._bills]
}

// After (real API):
export async function fetchBills() {
  const res = await fetch('/api/bills', { headers: { Authorization: `Bearer ${getToken()}` } })
  if (!res.ok) throw new Error('Failed to fetch bills')
  return res.json()
}
```
"# Enyecontrols-ECBIlls" 
