# Phase 6: Admin Dashboard - Implementation Prompt

**Implementation Guide**: Complete Admin Dashboard System
**Duration**: 3-4 days
**Priority**: High - Critical for scalability
**Dependencies**: Phase 5 (Support System) completion

## 🚨 MANDATORY PRE-IMPLEMENTATION PROTOCOL

### PHASE 0: QUALITY-FIRST VALIDATION (BLOCKING)
```bash
# REQUIRED: Clean environment verification
pnpm run typecheck  # MUST show 0 errors
pnpm run lint      # MUST pass cleanly
pnpm run build     # MUST complete successfully
```

### PHASE 1: RESEARCH-FIRST PROTOCOL (BLOCKING)

#### MANIFEST RESEARCH (MANDATORY FIRST STEP)
```bash
# 1. Check existing manifest types for admin features
Read docs/manifests/virtual-tutor/MANIFEST-INDEX.md

# 2. Review existing admin/user types
Read shared-types/domain.d.ts    # Look for User, Role types
Read server-types/models.d.ts    # Check database models
Read api-contracts/rest-endpoints.json # Review API patterns
```

#### CONTEXT7 RESEARCH (MANDATORY)
```bash
# Research admin dashboard implementations
mcp__context7__resolve-library-id "next.js admin dashboard shadcn"
mcp__context7__get-library-docs [library-id] "RBAC role based access control user management"

# Research analytics dashboard patterns
mcp__context7__resolve-library-id "react analytics dashboard charts"
mcp__context7__get-library-docs [library-id] "real-time metrics dashboard components"
```

#### WEB RESEARCH (MANDATORY)
```bash
# Current admin dashboard best practices (2025)
WebSearch "Next.js 15 admin dashboard RBAC implementation patterns September 2025"
WebSearch "shadcn/ui admin interface components user management 2025"
WebSearch "Supabase RLS row level security admin permissions patterns 2025"
```

#### CODEBASE ANALYSIS (MANDATORY)
```bash
# Analyze existing authentication and user patterns
Grep "auth\|user\|role" --type="ts" --output_mode="files_with_matches"
Read src/components/ui/       # Check existing UI components
Read src/lib/auth.ts         # Understand current auth system
Read src/app/api/            # Review existing API patterns
```

### PHASE 2: IMPLEMENTATION PLAN (BLOCKING)

**DOCUMENT YOUR RESEARCH FINDINGS BEFORE PROCEEDING:**
- What admin types exist in manifests? (Reuse existing, don't duplicate)
- What context7 patterns will guide implementation?
- What 2025 best practices apply to our stack?
- What existing auth/user patterns should we extend?

## 📋 4-DAY IMPLEMENTATION ROADMAP

### Day 1: Core Admin Framework & RBAC
**Goal**: Establish role-based access control and admin authentication

#### Morning (RBAC Foundation)
1. **Database Schema Setup**
   ```sql
   -- Extend existing user types (check manifests first!)
   -- Add admin_roles, user_role_assignments, admin_activity_logs tables
   -- Implement RLS policies for admin data access
   ```

2. **RBAC Middleware Implementation**
   ```typescript
   // /lib/middleware/admin-auth.ts
   // Role-based permission checking
   // Session validation for admin users
   // Audit logging for admin actions
   ```

#### Afternoon (Admin Authentication)
3. **Admin Authentication Flow**
   ```typescript
   // /app/admin/login/page.tsx - Admin-specific login
   // /components/admin/auth/ - Admin auth components
   // Integration with existing NextAuth setup
   ```

4. **Admin Dashboard Shell**
   ```typescript
   // /app/admin/layout.tsx - Admin layout with sidebar
   // /components/admin/layout/ - Sidebar, header, navigation
   // Role-based navigation visibility
   ```

**EOD Verification**: Admin can log in, see basic dashboard, middleware protects routes

### Day 2: User Management System
**Goal**: Complete user administration capabilities

#### Morning (User Management UI)
1. **User List & Search Interface**
   ```typescript
   // /app/admin/users/page.tsx - Paginated user table
   // /components/admin/users/user-table.tsx - Data table with filtering
   // /components/admin/users/user-search.tsx - Advanced search
   ```

2. **User Detail & Edit Forms**
   ```typescript
   // /app/admin/users/[id]/page.tsx - User profile and edit
   // /components/admin/users/user-form.tsx - Create/edit user
   // Role assignment interface with permission preview
   ```

#### Afternoon (Bulk Operations)
3. **Import/Export Functionality**
   ```typescript
   // /components/admin/users/bulk-import.tsx - CSV import wizard
   // /lib/services/admin/user-management.service.ts - Bulk operations
   // /app/api/admin/users/bulk/ - Bulk API endpoints
   ```

4. **Role Management System**
   ```typescript
   // /components/admin/users/role-manager.tsx - Role assignment
   // /components/admin/security/permission-matrix.tsx - Visual permissions
   // Audit logging for all role changes
   ```

**EOD Verification**: Can create, edit, delete users; bulk import works; roles assign properly

### Day 3: Content Management Dashboard
**Goal**: Enable content administration and assignment

#### Morning (Content Management)
1. **Textbook Management Interface**
   ```typescript
   // /app/admin/content/page.tsx - Content library view
   // /components/admin/content/textbook-manager.tsx - File management
   // /components/admin/content/upload-interface.tsx - Drag-drop upload
   ```

2. **Content Assignment System**
   ```typescript
   // /components/admin/content/assignment-creator.tsx - Assignment wizard
   // /lib/services/admin/content-management.service.ts - Assignment logic
   // /app/api/admin/content/assignments/ - Assignment CRUD APIs
   ```

#### Afternoon (Analytics Integration)
3. **Content Analytics Dashboard**
   ```typescript
   // /components/admin/content/content-analytics.tsx - Usage metrics
   // /lib/services/admin/analytics.service.ts - Data aggregation
   // Real-time content usage tracking
   ```

4. **Content Moderation Tools**
   ```typescript
   // /components/admin/content/moderation-queue.tsx - Approval workflow
   // /app/api/admin/content/moderate/ - Moderation APIs
   // Automated content flagging rules
   ```

**EOD Verification**: Can upload, organize, assign content; usage analytics show; moderation works

### Day 4: Analytics & Monitoring
**Goal**: Comprehensive platform insights and monitoring

#### Morning (Real-time Analytics)
1. **Analytics Dashboard**
   ```typescript
   // /app/admin/analytics/page.tsx - Main analytics view
   // /components/admin/analytics/dashboard-overview.tsx - KPI cards
   // /components/admin/analytics/usage-chart.tsx - Real-time charts
   ```

2. **Educational Metrics Tracking**
   ```typescript
   // /components/admin/analytics/learning-metrics.tsx - Learning outcomes
   // /lib/services/admin/metrics.service.ts - Educational data processing
   // Student progress aggregation and visualization
   ```

#### Afternoon (Reporting & Monitoring)
3. **Report Builder & Export**
   ```typescript
   // /components/admin/analytics/report-builder.tsx - Custom reports
   // /app/api/admin/analytics/export/ - Data export APIs
   // PDF/CSV export functionality
   ```

4. **System Monitoring Dashboard**
   ```typescript
   // /components/admin/system/performance-monitor.tsx - System health
   // /components/admin/security/audit-log.tsx - Activity audit
   // /app/api/admin/system/health/ - Health check APIs
   ```

**EOD Verification**: Analytics show real data; reports export correctly; system monitoring active

## 🔧 TECHNICAL IMPLEMENTATION DETAILS

### Required Dependencies
```bash
# Analytics and Charts
pnpm add recharts @tremor/react lucide-react

# Data Processing
pnpm add papaparse date-fns lodash-es

# Form Handling
pnpm add react-hook-form @hookform/resolvers zod

# File Upload
pnpm add react-dropzone

# TypeScript Types
pnpm add -D @types/papaparse @types/lodash-es
```

### Key Component Patterns

#### Admin Layout Pattern
```typescript
// /components/admin/layout/admin-shell.tsx
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const permissions = useAdminPermissions(user?.id)

  return (
    <div className="flex h-screen">
      <AdminSidebar permissions={permissions} />
      <main className="flex-1 overflow-y-auto">
        <AdminHeader user={user} />
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
```

#### RBAC Hook Pattern
```typescript
// /hooks/use-admin-permissions.ts
export function useAdminPermissions(userId?: string) {
  return useSWR(
    userId ? `/api/admin/permissions/${userId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000 // 5 minutes
    }
  )
}

export function useRequirePermission(
  resource: string,
  action: string
) {
  const { data: permissions } = useAdminPermissions()
  const hasPermission = permissions?.some(p =>
    p.resource === resource && p.actions.includes(action)
  )

  useEffect(() => {
    if (!hasPermission && permissions) {
      router.push('/admin/unauthorized')
    }
  }, [hasPermission, permissions])

  return hasPermission
}
```

#### Data Table Pattern
```typescript
// /components/admin/shared/data-table.tsx
interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  loading?: boolean
  onRowClick?: (row: T) => void
  searchable?: boolean
  exportable?: boolean
  bulkActions?: BulkAction<T>[]
}

export function DataTable<T>({
  data,
  columns,
  loading,
  onRowClick,
  searchable = true,
  exportable = true,
  bulkActions = []
}: DataTableProps<T>) {
  // Implementation with tanstack/react-table
  // Built-in search, pagination, bulk selection
  // Export functionality
  // Loading states and skeletons
}
```

### Database Patterns

#### RLS Policies for Admin Data
```sql
-- Admin users can only see data they have permission for
CREATE POLICY "Admin users see permitted data" ON users FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id FROM user_role_assignments ura
    JOIN admin_roles ar ON ura.role_id = ar.id
    WHERE ar.permissions @> '[{"resource": "users", "actions": ["view"]}]'
  )
);

-- School admins only see their school's data
CREATE POLICY "School admin scope" ON users FOR ALL
USING (
  CASE
    WHEN auth.uid() IN (SELECT user_id FROM user_role_assignments WHERE scope_type = 'global')
    THEN true
    WHEN auth.uid() IN (SELECT user_id FROM user_role_assignments WHERE scope_type = 'school')
    THEN school_id = (
      SELECT scope_id FROM user_role_assignments
      WHERE user_id = auth.uid() AND scope_type = 'school'
    )
    ELSE false
  END
);
```

#### Audit Logging Pattern
```typescript
// /lib/services/admin/audit.service.ts
export async function logAdminAction(
  adminUserId: string,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, any>
) {
  const { data, error } = await supabase
    .from('admin_activity_logs')
    .insert({
      admin_user_id: adminUserId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
      ip_address: await getClientIP(),
      user_agent: await getUserAgent()
    })

  if (error) {
    console.error('Failed to log admin action:', error)
    // Don't throw - logging should not block operations
  }

  return data
}
```

### API Patterns

#### Admin API Middleware
```typescript
// /lib/middleware/admin-api.ts
export function withAdminAuth(
  handler: NextApiHandler,
  requiredPermission?: { resource: string; action: string }
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await auth(req, res)

    if (!session?.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const hasPermission = await checkAdminPermission(
      session.user.id,
      requiredPermission
    )

    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    // Log the admin action
    await logAdminAction(
      session.user.id,
      req.method,
      req.url?.split('/').pop() || 'unknown'
    )

    return handler(req, res)
  }
}
```

#### Pagination Pattern
```typescript
// /lib/utils/pagination.ts
export interface PaginationParams {
  page: number
  limit: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, any>
}

export async function paginateQuery<T>(
  query: PostgrestFilterBuilder<any, any, any>,
  params: PaginationParams
): Promise<{
  data: T[]
  total: number
  totalPages: number
  currentPage: number
}> {
  const { page, limit, search, sortBy, sortOrder, filters } = params
  const offset = (page - 1) * limit

  // Apply search
  if (search) {
    query = query.textSearch('name,email', search)
  }

  // Apply filters
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        query = query.eq(key, value)
      }
    })
  }

  // Apply sorting
  if (sortBy) {
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })
  }

  // Get total count
  const { count } = await query.select('*', { count: 'exact', head: true })

  // Get paginated data
  const { data, error } = await query
    .range(offset, offset + limit - 1)
    .select('*')

  if (error) throw error

  return {
    data,
    total: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
    currentPage: page
  }
}
```

## 🔍 VERIFICATION REQUIREMENTS

### After Each Day
```bash
# TypeScript Verification (MANDATORY)
pnpm run typecheck  # MUST show 0 errors

# Functionality Tests
# Day 1: Admin login works, basic dashboard renders
# Day 2: User CRUD operations function, roles assign correctly
# Day 3: Content upload/assign works, analytics show data
# Day 4: Reports generate, monitoring displays metrics

# Database Verification
# Check RLS policies protect data correctly
# Verify audit logs capture admin actions
# Confirm role permissions enforce properly
```

### Manual Testing Scenarios

#### RBAC Testing
```typescript
// Test different role access levels
1. Create Super Admin user - verify global access
2. Create School Admin user - verify school-scoped access
3. Create Teacher user - verify class-scoped access
4. Attempt unauthorized actions - verify blocks

// Test permission inheritance
1. Assign role with limited permissions
2. Verify UI hides unauthorized features
3. Test API endpoint protection
4. Check audit logs record attempts
```

#### User Management Testing
```typescript
// Test user lifecycle
1. Create new user via admin panel
2. Assign roles and verify permissions
3. Bulk import users from CSV
4. Edit user details and roles
5. Deactivate and reactivate user

// Test search and filtering
1. Search users by name, email, role
2. Filter by status, school, grade level
3. Sort by various columns
4. Export filtered results
```

#### Content Management Testing
```typescript
// Test content workflow
1. Upload new textbook files
2. Organize into grades/subjects
3. Assign to specific users/classes
4. Track assignment completion
5. View usage analytics

// Test content analytics
1. Verify real-time usage tracking
2. Check completion rate calculations
3. Test time-on-content metrics
4. Validate popular content rankings
```

## 🔒 SECURITY IMPLEMENTATION

### Authentication Security
```typescript
// Multi-factor authentication for admin accounts
// Session timeout for admin sessions (shorter than regular users)
// IP allowlisting for admin panel access (optional)
// Concurrent session limits for admin users
```

### Data Protection
```typescript
// Row-level security policies for all admin data
// Audit logging for all admin actions
// Encryption of sensitive admin data
// Secure file upload with virus scanning
```

### API Security
```typescript
// Rate limiting for admin API endpoints
// CSRF protection for state-changing operations
// Input validation and sanitization
// SQL injection prevention
```

## 📊 ANALYTICS IMPLEMENTATION

### Metrics Collection
```typescript
// Real-time user activity tracking
// Content usage and engagement metrics
// System performance monitoring
// Educational outcome measurements
```

### Dashboard Visualizations
```typescript
// KPI summary cards with trend indicators
// Interactive charts with drill-down capability
// Real-time activity feeds
// Comparative analytics (time periods, cohorts)
```

### Report Generation
```typescript
// Custom report builder with filters
// Scheduled report generation and email delivery
// Export formats: PDF, CSV, Excel
// Report templates for common use cases
```

## 🚀 SUCCESS CRITERIA

### Technical Completion
- [ ] All TypeScript compiles without errors
- [ ] All tests pass (unit, integration, E2E)
- [ ] Security audit passes
- [ ] Performance benchmarks met

### Functional Completion
- [ ] Admin authentication and authorization working
- [ ] User management fully operational
- [ ] Content management and assignment functioning
- [ ] Analytics dashboard showing real data
- [ ] Audit logging capturing all actions

### User Experience
- [ ] Intuitive navigation and workflows
- [ ] Responsive design across devices
- [ ] Fast load times (<2 seconds)
- [ ] Comprehensive error handling and messaging

### Documentation
- [ ] Admin user guide created
- [ ] API documentation updated
- [ ] Security procedures documented
- [ ] Troubleshooting guide available

## 🔄 POST-IMPLEMENTATION

### Immediate Tasks
1. Create admin user training materials
2. Set up monitoring and alerting
3. Conduct security review
4. Plan rollout to initial admin users

### Performance Monitoring
1. Set up analytics tracking for admin usage
2. Monitor system performance under admin load
3. Track user adoption and feedback
4. Identify optimization opportunities

### Future Enhancements
1. Mobile admin app development
2. Advanced AI-powered analytics
3. Third-party integration expansion
4. Enterprise features for districts

---

**Implementation Version**: 1.0
**Created**: September 19, 2025
**Ready for**: Immediate implementation after Phase 5 completion
**Research Foundation**: [Admin Dashboard Research](../research/phase-6-admin-dashboard-research.md)
**Main Documentation**: [Phase 6 Admin Dashboard](./phase-6-admin-dashboard.md)