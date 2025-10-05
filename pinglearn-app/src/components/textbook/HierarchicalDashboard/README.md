# HierarchicalDashboard Components

**Feature**: FS-00-AC - Textbook Multi-Chapter Collection Management System
**Purpose**: Navigation and management components for hierarchical textbook content

---

## Components

### TreeView
Collapsible tree view for navigating book series → books → chapters hierarchy.

```typescript
<TreeView
  series={bookSeries}
  onSeriesClick={(id) => handleSeriesClick(id)}
  onBookClick={(id) => handleBookClick(id)}
  onChapterClick={(id) => handleChapterClick(id)}
  initialExpandedSeries={['series-1']}
/>
```

### ContentCardGrid
Card-based grid view for book series discovery with statistics.

```typescript
<ContentCardGrid
  series={bookSeries}
  onSeriesClick={(id) => handleClick(id)}
  onEditSeries={(id) => openEditModal(id)}
  onDeleteSeries={(id) => confirmDelete(id)}
  columns={{ default: 1, md: 2, lg: 3 }}
/>
```

### SearchAndFilter
Advanced search and filtering controls with collapsible panel.

```typescript
<SearchAndFilter
  filters={currentFilters}
  onFiltersChange={(filters) => setFilters(filters)}
  options={{
    grades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    subjects: ['Mathematics', 'Science', 'English'],
    publishers: ['NCERT', 'Oxford', 'Pearson']
  }}
/>
```

### QuickEditModal
Modal dialog for inline editing of series, books, or chapters.

```typescript
<QuickEditModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  entityType="series" // 'series' | 'book' | 'chapter'
  entity={selectedEntity}
  onSave={async (updated) => await saveEntity(updated)}
  isSaving={isSaving}
/>
```

---

## Features

- ✅ Tree view with expand/collapse
- ✅ Card grid with responsive layout
- ✅ Multi-dimensional filtering
- ✅ Full-text search
- ✅ Inline metadata editing
- ✅ Keyboard navigation
- ✅ TypeScript strict mode
- ✅ Fully accessible

---

## Hierarchy Structure

```
📖 Book Series (NCERT Mathematics)
  ├─ 📘 Book (Class 10 Mathematics - 2024 Edition)
  │  ├─ 📄 Chapter 1: Real Numbers
  │  ├─ 📄 Chapter 2: Polynomials
  │  └─ 📄 Chapter 3: Linear Equations
  └─ 📘 Book (Class 9 Mathematics)
```

---

See full documentation: `/docs/change_records/feature_changes/FC-00-AC-B4-UPLOAD-DASHBOARD.md`
