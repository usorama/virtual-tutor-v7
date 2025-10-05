# Upload Workflow Documentation Templates
**Based on**: UPLOAD-WORKFLOW-DOC-BEST-PRACTICES.md Research
**Created**: September 19, 2025
**Purpose**: Reusable templates for documenting file upload workflows

---

## Template 1: API Endpoint Documentation (OpenAPI Format)

```yaml
openapi: 3.0.0
info:
  title: [Feature Name] API
  version: 1.0.0
  description: |
    [Brief description of the API feature]

    ## Authentication
    [Authentication requirements]

    ## Rate Limits
    [Rate limit details]

    ## Error Handling
    [Error handling approach]

paths:
  /api/[endpoint-path]:
    post:
      summary: [Brief summary]
      description: |
        [Detailed description]

        **Process**:
        1. [Step 1]
        2. [Step 2]
        3. [Step 3]

        **Constraints**:
        - [Constraint 1]
        - [Constraint 2]

      security:
        - bearerAuth: []

      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required:
                - [required_field_1]
                - [required_field_2]
              properties:
                [field_name]:
                  type: [type]
                  format: [format]
                  description: [description]

      responses:
        '201':
          description: [Success description]
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/[SchemaName]'
        '400':
          description: [Validation error description]
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '404':
          description: [Not found description]
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

components:
  schemas:
    [SchemaName]:
      type: object
      properties:
        [property_name]:
          type: [type]
          format: [format]
          description: [description]

    Error:
      type: object
      properties:
        error:
          type: string
        message:
          type: string
        details:
          type: object

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

---

## Template 2: React Component Documentation (TSDoc Format)

```typescript
/**
 * [Component Name]
 *
 * @description
 * [Detailed description of component purpose and functionality]
 *
 * @remarks
 * This component handles:
 * - [Feature 1]
 * - [Feature 2]
 * - [Feature 3]
 *
 * **Accessibility**:
 * - Keyboard navigation: [Details]
 * - ARIA attributes: [List]
 * - Screen reader support: [Details]
 *
 * **Performance**:
 * - [Performance consideration 1]
 * - [Performance consideration 2]
 *
 * @example Basic Usage
 * ```tsx
 * <ComponentName
 *   prop1="value"
 *   prop2={value}
 * />
 * ```
 *
 * @example Advanced Usage
 * ```tsx
 * <ComponentName
 *   prop1="value"
 *   prop2={value}
 *   onEvent={handler}
 *   customConfig={config}
 * />
 * ```
 *
 * @see {@link RelatedComponent} for related functionality
 * @see {@link TypeDefinition} for prop type details
 */
export interface ComponentNameProps {
  /**
   * [Prop description]
   *
   * @remarks
   * [Additional details about prop usage]
   *
   * @example
   * ```typescript
   * prop1="example-value"
   * ```
   */
  prop1: string;

  /**
   * [Prop description]
   *
   * @default [default value]
   *
   * @remarks
   * [Additional details]
   */
  prop2?: number;

  /**
   * Event handler called when [event description]
   *
   * @param param1 - [Parameter description]
   * @returns Promise that resolves when [action completes]
   *
   * @remarks
   * This handler should:
   * - [Requirement 1]
   * - [Requirement 2]
   *
   * @throws {ErrorType} When [error condition]
   *
   * @example
   * ```typescript
   * const handler = async (param1: Type) => {
   *   // Implementation
   * };
   * ```
   */
  onEvent: (param1: Type) => Promise<void>;

  /**
   * Error handler called when [error description]
   *
   * @param error - Error object containing details
   *
   * @example
   * ```typescript
   * const errorHandler = (error: ErrorType) => {
   *   console.error('Error:', error);
   *   toast.error(error.message);
   * };
   * ```
   */
  onError?: (error: ErrorType) => void;
}

/**
 * Error types that can be thrown by [ComponentName]
 */
export type ErrorType =
  | 'ERROR_CODE_1'
  | 'ERROR_CODE_2'
  | 'ERROR_CODE_3';

export const ComponentName: React.FC<ComponentNameProps> = ({
  prop1,
  prop2 = defaultValue,
  onEvent,
  onError,
}) => {
  // Implementation
};
```

### Component Documentation Markdown

```markdown
# ComponentName

## Overview
- **Purpose**: [What problem does this solve?]
- **Category**: [Form/Layout/Navigation/etc.]
- **Status**: [Stable/Beta/Experimental]
- **Since**: [Version/Date]

## Installation

\`\`\`bash
npm install @pinglearn/components
\`\`\`

## Import

\`\`\`typescript
import { ComponentName } from '@pinglearn/components';
\`\`\`

## Basic Usage

\`\`\`tsx
import { ComponentName } from '@pinglearn/components';

function MyComponent() {
  return (
    <ComponentName
      prop1="value"
      prop2={value}
    />
  );
}
\`\`\`

## Props API

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| prop1 | string | - | Yes | [Description] |
| prop2 | number | 0 | No | [Description] |
| onEvent | Function | - | Yes | [Description] |
| onError | Function | - | No | [Description] |

## Examples

### Example 1: Basic Usage
\`\`\`tsx
<ComponentName
  prop1="value"
  onEvent={handleEvent}
/>
\`\`\`

### Example 2: With Error Handling
\`\`\`tsx
<ComponentName
  prop1="value"
  onEvent={handleEvent}
  onError={(error) => {
    console.error('Error:', error);
    toast.error('Operation failed');
  }}
/>
\`\`\`

### Example 3: Advanced Configuration
\`\`\`tsx
<ComponentName
  prop1="value"
  prop2={10}
  onEvent={async (param) => {
    await processData(param);
    await saveToDatabase(param);
  }}
  onError={handleError}
/>
\`\`\`

## Event Handlers

### onEvent
Called when [event description].

**Signature**:
\`\`\`typescript
onEvent: (param: Type) => Promise<void>
\`\`\`

**Parameters**:
- `param`: [Parameter description]

**Returns**: Promise that resolves when [action completes]

**Example**:
\`\`\`typescript
const handleEvent = async (param: Type) => {
  await performAction(param);
};
\`\`\`

### onError
Called when an error occurs.

**Signature**:
\`\`\`typescript
onError?: (error: ErrorType) => void
\`\`\`

**Parameters**:
- `error`: Error object with type and message

**Example**:
\`\`\`typescript
const handleError = (error: ErrorType) => {
  switch (error.type) {
    case 'ERROR_CODE_1':
      toast.error('Error 1 occurred');
      break;
    case 'ERROR_CODE_2':
      toast.error('Error 2 occurred');
      break;
    default:
      toast.error('An error occurred');
  }
};
\`\`\`

## Accessibility

### Keyboard Navigation
- **Tab**: [Navigation behavior]
- **Enter**: [Action behavior]
- **Escape**: [Cancel behavior]
- **Arrow Keys**: [Navigation behavior]

### ARIA Attributes
- `aria-label`: [Description]
- `aria-labelledby`: [Description]
- `aria-describedby`: [Description]
- `role`: [Role description]

### Screen Reader Support
- [Screen reader announcement 1]
- [Screen reader announcement 2]

## Theming

\`\`\`typescript
// Theme customization example
const theme = {
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
  },
  spacing: {
    small: '8px',
    medium: '16px',
  },
};
\`\`\`

## Related Components
- [RelatedComponent1](./RelatedComponent1.md) - [Brief description]
- [RelatedComponent2](./RelatedComponent2.md) - [Brief description]

## Changelog

### Version 1.0.0 (2025-09-19)
- Initial release
- [Feature 1]
- [Feature 2]
```

---

## Template 3: Multi-Step Wizard Documentation

```markdown
# [Wizard Name]

## Overview
- **Purpose**: [Why this wizard exists]
- **Total Steps**: [Number]
- **Estimated Time**: [Duration]
- **User Type**: [Target user persona]

## Wizard Flow

### Flow Diagram
\`\`\`
[Step 1] → [Step 2] → [Step 3] → [Complete]
   ↓           ↓           ↓
[Error]    [Error]     [Error]
   ↓           ↓           ↓
[Retry]    [Retry]     [Retry]
\`\`\`

## Step-by-Step Documentation

### Step 1: [Step Name]

**Purpose**: [Why this step exists]

**Fields**:
| Field | Type | Validation | Required | Description |
|-------|------|------------|----------|-------------|
| [field1] | [type] | [rules] | Yes | [description] |
| [field2] | [type] | [rules] | No | [description] |

**Validation Rules**:
- **Client-Side**:
  - [Rule 1]: [Description]
  - [Rule 2]: [Description]
- **Server-Side**:
  - [Rule 1]: [Description]
  - [Rule 2]: [Description]

**Error States**:
| Error Code | Trigger | Message | Recovery |
|------------|---------|---------|----------|
| [code] | [condition] | [user message] | [recovery action] |

**Next Step Conditions**:
- [Condition 1]: Proceed to Step 2
- [Condition 2]: Show error and remain on Step 1
- [Condition 3]: [Alternative action]

**UI Elements**:
- Progress indicator: "Step 1 of 3"
- Back button: [Disabled/Enabled]
- Next button: [Enabled when validation passes]
- Cancel button: [Confirmation required]

**Example**:
\`\`\`tsx
<WizardStep1
  onNext={(data) => {
    validateData(data);
    proceedToStep2();
  }}
  onError={(error) => {
    showError(error);
  }}
/>
\`\`\`

---

### Step 2: [Step Name]

[Repeat same structure as Step 1]

---

### Step 3: [Step Name]

[Repeat same structure as Step 1]

---

## State Management

### Data Flow
\`\`\`typescript
interface WizardState {
  currentStep: number;
  step1Data: Step1Data;
  step2Data: Step2Data;
  step3Data: Step3Data;
  errors: ErrorMap;
  isSubmitting: boolean;
}
\`\`\`

### Persistence Strategy
- **Session Storage**: [What data is stored]
- **Auto-Save**: [When data is saved]
- **Timeout**: [Session timeout duration]
- **Recovery**: [How to recover from timeout]

## Conditional Logic

### Decision Tree
\`\`\`
Step 1: Select Option
├── Option A → Show Step 2A
├── Option B → Show Step 2B
└── Option C → Skip to Step 3
\`\`\`

### Skip Logic
- **Condition**: [When to skip]
- **Target**: [Which step to skip to]
- **Data**: [What happens to skipped step data]

## Validation

### Per-Step Validation
- **Step 1**: [Validation rules]
- **Step 2**: [Validation rules]
- **Step 3**: [Validation rules]

### Cross-Step Validation
- [Validation rule that spans multiple steps]

### Final Validation
- [Final checks before submission]

## Progress Indication

### Visual Elements
- Progress bar: `[████████░░] 80%`
- Step numbers: `1 → 2 → [3] → 4`
- Step labels: `[✓] Done → [▶] Current → [○] Upcoming`

### User Feedback
- Current step highlighted
- Completed steps marked with checkmark
- Remaining steps grayed out
- Percentage complete displayed

## Accessibility

### Keyboard Navigation
- **Tab**: Move between fields
- **Shift+Tab**: Move backward
- **Enter**: Submit current step
- **Escape**: Cancel wizard (with confirmation)
- **Alt+Left/Right Arrow**: Navigate between steps (if allowed)

### ARIA Attributes
- `role="progressbar"`: Progress indicator
- `aria-valuenow`: Current step number
- `aria-valuemin`: 1
- `aria-valuemax`: [total steps]
- `aria-label`: "Step [X] of [Total]: [Step Name]"

### Screen Reader Announcements
- "Entering step [X] of [Total]: [Step Name]"
- "Field [name] is required"
- "Validation error: [message]"
- "Step [X] complete, proceeding to step [Y]"

## Error Handling

### Error Types
| Type | Trigger | User Message | Recovery |
|------|---------|--------------|----------|
| Validation Error | Invalid field input | [Specific message per field] | Correct input and retry |
| Network Error | API call failed | "Network error. Please try again." | Retry button |
| Timeout | Session expired | "Session expired. Please start over." | Restart wizard |

### Error Display
- Inline field errors
- Summary error message at top
- Error icon with tooltip
- Clear recovery instructions

## Save & Resume

### Auto-Save Triggers
- On step completion
- Every [X] seconds
- Before page unload

### Resume Experience
- Detect saved session on load
- Show resume prompt with timestamp
- Allow user to choose: Resume or Start Fresh

## Testing

### Test Cases
- [ ] Complete wizard with valid data
- [ ] Trigger validation errors in each step
- [ ] Test backward navigation
- [ ] Test save & resume functionality
- [ ] Test timeout recovery
- [ ] Test skip logic (if applicable)
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility

## Performance

### Optimization Strategies
- Lazy load step components
- Debounce validation
- Minimize re-renders
- Cache step data

## Related Documentation
- [Component API](./ComponentAPI.md)
- [API Endpoints](./APIEndpoints.md)
- [Error Codes](./ErrorCodes.md)
```

---

## Template 4: Database Schema & FK Documentation

```markdown
# Database Schema: [Schema Name]

## Overview
- **Purpose**: [Why this schema exists]
- **Tables**: [Count]
- **Relationships**: [Count]
- **Schema Version**: [Version]
- **Last Updated**: [Date]

## Conceptual ERD

### High-Level Description
[Describe the overall structure and business entities]

### Core Entities
- **[Entity 1]**: [Purpose]
- **[Entity 2]**: [Purpose]
- **[Entity 3]**: [Purpose]

### Relationships
- [Entity 1] → [Entity 2]: [Relationship type and description]
- [Entity 2] → [Entity 3]: [Relationship type and description]

## Logical ERD

### Tables

#### [Table Name 1]
- **Type**: [Dimension/Fact/Junction] (Color: [Color])
- **Purpose**: [What this table stores]
- **Relationships**: [List relationships]

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary key |
| [column] | [type] | [constraints] | [description] |

**Indexes**:
- `idx_[table]_[column]`: [Purpose]

**Sample Data**:
| id | [column] | [column] |
|----|----------|----------|
| [value] | [value] | [value] |

---

#### [Table Name 2]
[Repeat same structure]

---

#### [Table Name 3] (Junction Table)
- **Type**: Junction table (Color: Green)
- **Purpose**: Implements M:N relationship between [Table 1] and [Table 2]
- **Relationships**: N:1 with [Table 1], N:1 with [Table 2]

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, NOT NULL | Primary key |
| [table1]_id | UUID | FK, NOT NULL | Foreign key to [table1] |
| [table2]_id | UUID | FK, NOT NULL | Foreign key to [table2] |

---

## Physical ERD

### Foreign Key Constraints

#### FK_[table]_[parent_table]
- **Columns**: `[table].[column]` → `[parent_table].[column]`
- **Cardinality**: [N:1 / 1:1]
- **On Delete**: [CASCADE / RESTRICT / SET NULL / NO ACTION]
- **On Update**: [CASCADE / RESTRICT / SET NULL / NO ACTION]
- **Created**: [Migration file name]
- **Rationale**: [Why this constraint exists and why this cascading behavior]

**Example Violation**:
\`\`\`sql
-- This will fail:
INSERT INTO [table] ([column]) VALUES ('[non-existent-id]');
-- Error: violates foreign key constraint "FK_[table]_[parent_table]"
\`\`\`

**Cascading Behavior Example**:
\`\`\`sql
-- When CASCADE is configured:
DELETE FROM [parent_table] WHERE id = '[id]';
-- Result: Related records in [table] are automatically deleted
\`\`\`

---

[Repeat for each FK constraint]

---

### Cascading Behavior Summary

| Constraint | On Delete | On Update | Rationale |
|------------|-----------|-----------|-----------|
| FK_[table]_[parent] | CASCADE | CASCADE | [Reason] |
| FK_[table]_[parent] | RESTRICT | CASCADE | [Reason] |

### Indexes

| Index Name | Table | Columns | Type | Purpose |
|------------|-------|---------|------|---------|
| idx_[name] | [table] | [columns] | [B-tree/Hash] | [Purpose] |

## Visual ERD Diagram

\`\`\`
┌─────────────────┐
│   [Table 1]     │
│  (Dimension)    │
├─────────────────┤
│ id (PK)         │
│ [columns]       │
└─────────┬───────┘
          │ 1
          │
          │ N
┌─────────┴───────┐
│   [Table 3]     │
│   (Junction)    │
├─────────────────┤
│ id (PK)         │
│ table1_id (FK)  │
│ table2_id (FK)  │
└─────────┬───────┘
          │ N
          │
          │ 1
┌─────────┴───────┐
│   [Table 2]     │
│     (Fact)      │
├─────────────────┤
│ id (PK)         │
│ [columns]       │
└─────────────────┘
\`\`\`

## Migration History

### Migrations
1. **[Date]**: `[migration-file-name].sql`
   - Created [table name]
   - Added columns: [list]

2. **[Date]**: `[migration-file-name].sql`
   - Created [table name]
   - Added FK constraint: [name]

3. **[Date]**: `[migration-file-name].sql`
   - Created [table name]
   - Added indexes: [list]

## Data Dictionary

### [Table Name]

| Column | Type | Null | Default | Description |
|--------|------|------|---------|-------------|
| id | UUID | NO | gen_random_uuid() | Primary key |
| [column] | [type] | [YES/NO] | [value] | [description] |

## Testing Notes

### FK Constraint Testing
\`\`\`sql
-- Test 1: FK violation (should fail)
INSERT INTO [table] ([fk_column]) VALUES ('[non-existent-id]');
-- Expected: ERROR: violates foreign key constraint

-- Test 2: CASCADE delete (should succeed)
DELETE FROM [parent_table] WHERE id = '[test-id]';
SELECT COUNT(*) FROM [table] WHERE [fk_column] = '[test-id]';
-- Expected: 0 (child records deleted)

-- Test 3: RESTRICT delete (should fail)
DELETE FROM [parent_table] WHERE id = '[test-id-with-children]';
-- Expected: ERROR: violates foreign key constraint
\`\`\`

### Performance Testing
\`\`\`sql
-- Test JOIN performance with indexes
EXPLAIN ANALYZE
SELECT *
FROM [table1]
JOIN [table3] ON [table1].id = [table3].[table1]_id
JOIN [table2] ON [table3].[table2]_id = [table2].id;
-- Verify indexes are used
\`\`\`

## Maintenance Notes

### Common Operations
\`\`\`sql
-- Add new column
ALTER TABLE [table] ADD COLUMN [column] [type] [constraints];

-- Add new FK constraint
ALTER TABLE [table]
ADD CONSTRAINT FK_[table]_[parent]
FOREIGN KEY ([column]) REFERENCES [parent]([column])
ON DELETE [action] ON UPDATE [action];

-- Create index
CREATE INDEX idx_[table]_[column] ON [table]([column]);
\`\`\`

### Best Practices
- Always test FK constraints in development before production
- Document rationale for cascading behavior
- Use descriptive FK constraint names
- Create indexes on all FK columns
- Include sample data in documentation

## Related Documentation
- [Migration Guide](./MigrationGuide.md)
- [API Documentation](./APIDocumentation.md)
- [Data Model](./DataModel.md)
```

---

## Template 5: File Upload Flow Documentation

```markdown
# File Upload Flow: [Feature Name]

## Overview
- **Purpose**: [What this upload feature accomplishes]
- **Supported File Types**: [List MIME types]
- **Max File Size**: [Size in MB]
- **Max Files**: [Count]
- **Storage**: [Storage system used]

## Upload Process Flow

### High-Level Flow
\`\`\`
1. User selects files (drag-drop or file picker)
2. Client-side validation
3. File upload to storage
4. Database record creation
5. Success/error feedback
\`\`\`

### Detailed Sequence Diagram
\`\`\`
User → Client: Select files
Client → Client: Validate files (type, size)
Client → Storage: Upload files
Storage → Client: Return storage paths
Client → API: Create database records
API → Database: Insert with FK constraints
Database → API: Return created records
API → Client: Success response
Client → User: Show success message
\`\`\`

## File Selection

### Drag-and-Drop Interface
- **Target Area**: [Describe drop zone]
- **Visual Feedback**: [Describe hover state]
- **Multiple Files**: [Yes/No]

### File Picker
- **Trigger**: [Button/link description]
- **Accept**: [MIME types]
- **Multiple**: [Yes/No]

### UI States
| State | Visual | Description |
|-------|--------|-------------|
| Idle | [Description] | Waiting for user action |
| Drag Over | [Description] | User dragging files over drop zone |
| Validating | [Description] | Checking file type and size |
| Uploading | [Description] | Files being uploaded |
| Success | [Description] | Upload completed successfully |
| Error | [Description] | Validation or upload failed |

## Validation

### Client-Side Validation

#### File Type Validation
\`\`\`typescript
const allowedTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'video/mp4'
];

function validateFileType(file: File): boolean {
  return allowedTypes.includes(file.type);
}
\`\`\`

**Error Messages**:
- Invalid type: "File type not supported. Allowed: PDF, JPEG, PNG, MP4"

#### File Size Validation
\`\`\`typescript
const maxFileSize = 10 * 1024 * 1024; // 10MB

function validateFileSize(file: File): boolean {
  return file.size <= maxFileSize;
}
\`\`\`

**Error Messages**:
- Too large: "File exceeds maximum size of 10MB"

#### File Count Validation
\`\`\`typescript
const maxFiles = 5;

function validateFileCount(files: File[]): boolean {
  return files.length <= maxFiles;
}
\`\`\`

**Error Messages**:
- Too many: "Maximum 5 files allowed"

### Server-Side Validation

#### Duplicate Detection
\`\`\`typescript
async function checkDuplicate(
  filename: string,
  classroomId: string
): Promise<boolean> {
  const existing = await db.query(
    'SELECT id FROM classroom_content WHERE file_name = $1 AND classroom_id = $2',
    [filename, classroomId]
  );
  return existing.rows.length > 0;
}
\`\`\`

**Error Messages**:
- Duplicate: "File '[filename]' already exists in this classroom"

#### FK Constraint Validation
\`\`\`typescript
async function validateClassroom(classroomId: string): Promise<boolean> {
  const classroom = await db.query(
    'SELECT id FROM classrooms WHERE id = $1',
    [classroomId]
  );
  return classroom.rows.length > 0;
}
\`\`\`

**Error Messages**:
- Invalid FK: "Classroom not found"

## Upload Implementation

### Storage Upload
\`\`\`typescript
import { createClient } from '@supabase/supabase-js';

async function uploadToStorage(
  file: File,
  path: string
): Promise<{ path: string; url: string }> {
  const supabase = createClient(url, key);

  const { data, error } = await supabase.storage
    .from('classroom-content')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;

  return {
    path: data.path,
    url: supabase.storage.from('classroom-content').getPublicUrl(path).data.publicUrl
  };
}
\`\`\`

### Database Record Creation
\`\`\`typescript
async function createContentRecord(
  uploadedContentId: string,
  classroomId: string
): Promise<ClassroomContent> {
  const { data, error } = await supabase
    .from('classroom_content')
    .insert({
      uploaded_content_id: uploadedContentId,
      classroom_id: classroomId
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
\`\`\`

## Progress Tracking

### Progress States
| State | Progress | Description |
|-------|----------|-------------|
| Queued | 0% | File in upload queue |
| Uploading | 1-99% | File being uploaded |
| Processing | 99% | Creating database record |
| Complete | 100% | Upload successful |
| Failed | - | Upload failed |

### Progress UI
\`\`\`tsx
<FileUploadProgress
  fileName={file.name}
  progress={uploadProgress}
  status={uploadStatus}
  onCancel={handleCancel}
/>
\`\`\`

## Error Handling

### Error Types
\`\`\`typescript
type UploadError =
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILE_TYPE'
  | 'TOO_MANY_FILES'
  | 'DUPLICATE_FILE'
  | 'STORAGE_ERROR'
  | 'DATABASE_ERROR'
  | 'FK_CONSTRAINT_VIOLATION'
  | 'NETWORK_ERROR';
\`\`\`

### Error Messages
| Error Type | User Message | Recovery Action |
|------------|--------------|-----------------|
| FILE_TOO_LARGE | "File exceeds 10MB" | Select smaller file |
| INVALID_FILE_TYPE | "File type not supported" | Select valid file type |
| TOO_MANY_FILES | "Maximum 5 files allowed" | Select fewer files |
| DUPLICATE_FILE | "File already exists" | Rename or skip |
| STORAGE_ERROR | "Upload failed. Please try again." | Retry upload |
| DATABASE_ERROR | "Failed to save. Please try again." | Retry save |
| FK_CONSTRAINT_VIOLATION | "Invalid classroom" | Contact support |
| NETWORK_ERROR | "Network error. Check connection." | Check network and retry |

### Error Recovery
\`\`\`typescript
async function handleUploadError(
  error: UploadError,
  file: File
): Promise<void> {
  switch (error) {
    case 'STORAGE_ERROR':
    case 'NETWORK_ERROR':
      // Retry with exponential backoff
      await retryUpload(file);
      break;

    case 'FILE_TOO_LARGE':
    case 'INVALID_FILE_TYPE':
      // Show error, no retry
      showError(error);
      break;

    default:
      // Log and show generic error
      logError(error);
      showError('UNKNOWN_ERROR');
  }
}
\`\`\`

## Success Feedback

### Success Message
- Toast notification: "Files uploaded successfully"
- Updated file list showing new files
- Confetti animation (optional)

### Post-Upload Actions
- Clear file selection
- Reset form state
- Refresh file list
- Navigate to content list (optional)

## Performance Optimization

### Chunked Upload (for large files)
\`\`\`typescript
async function uploadLargeFile(
  file: File,
  chunkSize: number = 1024 * 1024 // 1MB chunks
): Promise<void> {
  const chunks = Math.ceil(file.size / chunkSize);

  for (let i = 0; i < chunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    await uploadChunk(chunk, i, chunks);
    updateProgress((i + 1) / chunks * 100);
  }
}
\`\`\`

### Parallel Uploads
\`\`\`typescript
async function uploadMultipleFiles(files: File[]): Promise<void> {
  await Promise.all(
    files.map(file => uploadFile(file))
  );
}
\`\`\`

### Retry Strategy
\`\`\`typescript
async function uploadWithRetry(
  file: File,
  maxRetries: number = 3
): Promise<void> {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      await uploadFile(file);
      return;
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries) throw error;
      await delay(Math.pow(2, attempt) * 1000); // Exponential backoff
    }
  }
}
\`\`\`

## Security Considerations

### File Validation
- Validate MIME type (client and server)
- Check file extension matches MIME type
- Scan for malicious content (server-side)

### Access Control
- Verify user has permission to upload to classroom
- Check file size limits per user role
- Enforce rate limits

### Storage Security
- Use signed URLs for access
- Set appropriate CORS policies
- Enable versioning for accidental deletions

## Accessibility

### Keyboard Navigation
- **Tab**: Focus file picker button
- **Enter/Space**: Open file picker
- **Escape**: Cancel upload

### Screen Reader Announcements
- "File picker opened"
- "File [name] selected"
- "Uploading [name], [progress]%"
- "Upload complete: [name]"
- "Upload failed: [error message]"

### ARIA Attributes
\`\`\`html
<div
  role="region"
  aria-label="File upload area"
  aria-describedby="upload-instructions"
>
  <input
    type="file"
    aria-label="Select files to upload"
    aria-required="true"
  />
</div>
\`\`\`

## Testing

### Test Cases
- [ ] Upload single file successfully
- [ ] Upload multiple files successfully
- [ ] Trigger file type validation error
- [ ] Trigger file size validation error
- [ ] Trigger file count validation error
- [ ] Trigger duplicate file error
- [ ] Trigger network error and retry
- [ ] Cancel upload mid-progress
- [ ] Test drag-and-drop interface
- [ ] Test keyboard navigation
- [ ] Test screen reader announcements

## API Reference

See [API Documentation](./API-DOCUMENTATION.md) for detailed endpoint documentation.

## Related Documentation
- [API Endpoints](./API-DOCUMENTATION.md)
- [Database Schema](./DATABASE-SCHEMA.md)
- [Component Documentation](./COMPONENT-DOCUMENTATION.md)
- [Error Handling](./ERROR-HANDLING.md)
```

---

## Template Usage Guide

### When to Use Each Template

1. **API Endpoint Documentation (Template 1)**:
   - Use for documenting REST API endpoints
   - Include for file upload APIs, CRUD operations
   - Required for public APIs

2. **React Component Documentation (Template 2)**:
   - Use for all React components
   - Required for component libraries
   - Include TSDoc comments in source code

3. **Multi-Step Wizard Documentation (Template 3)**:
   - Use for documenting multi-step forms/wizards
   - Include step-by-step flow, validation, state management
   - Required for complex user workflows

4. **Database Schema & FK Documentation (Template 4)**:
   - Use for documenting database schemas
   - Include ERD diagrams, FK constraints, migrations
   - Required for understanding data relationships

5. **File Upload Flow Documentation (Template 5)**:
   - Use for documenting file upload features
   - Include validation, error handling, progress tracking
   - Required for upload-heavy features

### Customization Tips

- Replace `[placeholders]` with actual content
- Remove sections not applicable to your use case
- Add project-specific sections as needed
- Maintain consistent formatting across documents
- Update examples to match your implementation

### Validation Checklist

Before finalizing documentation:
- [ ] All placeholders replaced
- [ ] Code examples tested and working
- [ ] TypeScript types validated
- [ ] Links to related docs verified
- [ ] Accessibility section complete
- [ ] Error handling documented
- [ ] Examples progress from simple to advanced
- [ ] Screenshots/diagrams included where helpful

---

**Templates Ready for Use**: September 19, 2025
**Based on Research**: UPLOAD-WORKFLOW-DOC-BEST-PRACTICES.md
**Status**: Production-Ready
