---
name: Frontend-Backend Integration Plan
overview: ""
todos: []
---

# Frontend-Backend Integration Plan

## Overview

Integrate the React frontend with Django REST Framework backend, replacing all mock data with real API calls and implementing missing backend models and APIs.

## Architecture Analysis

### Current State

- **Frontend**: React + TypeScript, mock authentication, localStorage for logbooks, mock data in all pages
- **Backend**: Django REST Framework, User management only, JWT authentication ready
- **Gap**: No API service layer in frontend, missing backend models for logbooks/entries/utility logs

### Integration Flow

```javascript
Frontend (React) → API Service Layer → Django REST API → PostgreSQL Database
```



## Phase 1: Backend User Model Enhancement

### 1.1 Add name field to User model

- **File**: `backend/accounts/models.py`
- Add `name` field (CharField, max_length=255, optional initially)
- Update UserSerializer to include name
- Create migration

## Phase 2: Backend Models & APIs

### 2.1 Create Logbook Models

- **New App**: `backend/logbooks/`
- **Models**:
- `LogbookSchema` - Template/schema definition (matches frontend `LogbookSchema`)
- `LogbookEntry` - Dynamic entries based on schemas
- `LogbookField` - Embedded in schema (JSONField or separate model)
- **APIs**: CRUD for schemas and entries

### 2.2 Create Utility Logs Model

- **Model**: `UtilityReading` (matches frontend `UtilityReading` interface)
- **APIs**: Create, List, Update, Delete, Approve/Reject

### 2.3 Create Air Validation Model

- **Model**: `AirValidation` (matches frontend `AirValidation` interface)
- **APIs**: Create, List, Update, Approve/Reject

### 2.4 Create Chemical Prep Model

- **Model**: `ChemicalPreparation` (matches frontend interface)
- **APIs**: CRUD operations

### 2.5 Create Instruments Model

- **Model**: `Instrument` (matches frontend interface)
- **APIs**: CRUD, calibration tracking

### 2.6 Create Sites Model

- **Model**: `Site` (matches frontend interface)
- **APIs**: CRUD operations

## Phase 3: Frontend API Service Layer

### 3.1 Create API Configuration

- **File**: `frontend/src/lib/api/config.ts`
- Base URL configuration
- Axios instance with interceptors
- JWT token management (store in localStorage, auto-refresh)

### 3.2 Create API Services

- **File**: `frontend/src/lib/api/auth.ts` - Login, logout, refresh
- **File**: `frontend/src/lib/api/users.ts` - User CRUD
- **File**: `frontend/src/lib/api/logbooks.ts` - Schema and entry APIs
- **File**: `frontend/src/lib/api/utility-logs.ts` - Utility readings
- **File**: `frontend/src/lib/api/air-validation.ts` - Air validation
- **File**: `frontend/src/lib/api/chemical-prep.ts` - Chemical prep
- **File**: `frontend/src/lib/api/instruments.ts` - Instruments
- **File**: `frontend/src/lib/api/sites.ts` - Sites

### 3.3 Create React Query Hooks

- **File**: `frontend/src/hooks/useAuth.ts` - Auth mutations/queries
- **File**: `frontend/src/hooks/useUsers.ts` - User management
- **File**: `frontend/src/hooks/useLogbooks.ts` - Logbook operations
- **File**: `frontend/src/hooks/useUtilityLogs.ts` - Utility logs
- **File**: `frontend/src/hooks/useAirValidation.ts` - Air validation

## Phase 4: Frontend Integration

### 4.1 Update AuthContext

- **File**: `frontend/src/contexts/AuthContext.tsx`
- Replace mock login with API call
- Store JWT tokens
- Auto-refresh token logic
- Update role: "customer" → "client"

### 4.2 Update User Type

- **File**: `frontend/src/types/index.ts`
- Add `name` field to User interface
- Change `customer` role to `client`
- Ensure UUID compatibility

### 4.3 Update LoginPage

- **File**: `frontend/src/pages/LoginPage.tsx`
- Connect to real login API
- Handle errors properly
- Remove demo accounts or make them optional

### 4.4 Update UsersPage

- **File**: `frontend/src/pages/UsersPage.tsx`
- Replace mock data with API calls
- Implement real CRUD operations
- Add loading/error states

### 4.5 Update LogbooksPage

- **File**: `frontend/src/pages/LogbooksPage.tsx`
- Replace localStorage with API calls
- Fetch schemas from backend
- Create entries via API

### 4.6 Update UtilityLogsPage

- **File**: `frontend/src/pages/UtilityLogsPage.tsx`
- Replace mock data with API calls
- Implement create/list/update operations

### 4.7 Update AirValidationPage

- **File**: `frontend/src/pages/AirValidationPage.tsx`
- Replace mock data with API calls
- Submit validations via API

### 4.8 Update Other Pages

- ChemicalPrepPage, InstrumentsPage, ReportsPage, DashboardPage
- Connect to respective APIs
- Replace mock data

## Phase 5: Backend Configuration

### 5.1 CORS Configuration

- **File**: `backend/core/settings.py`
- Install `django-cors-headers`
- Configure CORS for frontend origin
- Allow credentials

### 5.2 Environment Variables

- **File**: `frontend/.env` or `frontend/.env.local`
- Add `VITE_API_BASE_URL=http://localhost:8000/api`

## Phase 6: Data Migration

### 6.1 Migrate Existing Data

- Convert frontend logbook schemas to backend
- Create initial data fixtures if needed

## Implementation Order

1. **Backend User Enhancement** (Phase 1)
2. **Backend Models** (Phase 2) - Create all models and migrations
3. **Backend APIs** (Phase 2) - Create ViewSets and serializers
4. **CORS Setup** (Phase 5.1)
5. **Frontend API Layer** (Phase 3)
6. **Frontend Integration** (Phase 4) - One page at a time
7. **Testing & Refinement**

## Key Files to Modify

### Backend

- `backend/accounts/models.py` - Add name field
- `backend/accounts/serializers.py` - Include name
- `backend/core/settings.py` - CORS config
- `backend/logbooks/models.py` - New file
- `backend/logbooks/views.py` - New file
- `backend/logbooks/serializers.py` - New file
- `backend/logbooks/urls.py` - New file
- Similar for utility_logs, air_validation, etc.

### Frontend

- `frontend/src/contexts/AuthContext.tsx` - Real API
- `frontend/src/types/index.ts` - Update types
- `frontend/src/lib/api/*.ts` - New API service files
- `frontend/src/hooks/use*.ts` - React Query hooks
- All page components - Replace mock data

## Dependencies to Add

### Backend

- `django-cors-headers` - CORS support

### Frontend

- `axios` - HTTP client (if not using fetch)
- Already has `@tanstack/react-query`

## Testing Strategy