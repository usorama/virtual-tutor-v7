# Upload Workflow Documentation Best Practices Research
**Research Date**: September 19, 2025
**Agent**: A4-D2 (Web Research Agent)
**Context**: FC-00-AC Implementation
**Status**: Research Complete

## Executive Summary

This research document synthesizes industry best practices for documenting file upload workflows, multi-step wizards, and database foreign key integrations. Findings are based on current (2025) standards and are directly applicable to the FC-00-AC (Student-Teacher Classroom Content Upload) implementation.

**Key Findings**:
- File upload documentation requires comprehensive coverage of UX, technical, and security aspects
- Multi-step wizards demand clear progress indication and validation documentation
- Database FK relationships need visual diagrams + constraint documentation
- TypeScript documentation standards have evolved toward TSDoc and automated generation
- Interactive documentation with code examples is now industry standard

---

## Research Topic 1: File Upload Documentation

**Search Query**: "file upload workflow documentation best practices 2025"

### Key Patterns Identified

#### 1. **Multi-Layered Documentation Structure**
- **User-Facing**: UX patterns, drag-drop interfaces, file previews
- **Technical**: API endpoints, multipart/form-data handling, streaming approaches
- **Security**: Validation rules, file type restrictions, size limits
- **Error Handling**: Clear error notifications, recovery workflows

#### 2. **Document Management Best Practices**

**Centralized Repository**:
- Single source of truth for all upload-related documentation
- Logical folder structures with consistent naming conventions
- Real-time collaboration capabilities
- Version control integration

**Standardized Processes**:
- File routing and storage protocol documentation
- Designated stakeholders and approval workflows
- Employee training materials and guidelines

#### 3. **Technical Implementation Documentation**

**Format Selection**:
- **Preferred**: `multipart/form-data` for most file uploads (supports metadata)
- **Alternative**: Binary format for simple uploads
- **Specialized**: JSON for base64-encoded content

**Performance Considerations**:
- Streaming approach documentation for large files
- Server-side processing strategies
- Progress tracking implementation

#### 4. **UX Documentation Requirements**

**Essential Features to Document**:
- Drag-and-drop capability
- File previews (image thumbnails, document icons)
- Clear error notifications with recovery options
- Responsive design elements
- Accessibility requirements (WCAG compliance)

**User Journey Documentation**:
- Step-by-step upload process flows
- Error state handling and recovery paths
- Success confirmation patterns
- File organization and management post-upload

#### 5. **Document Approval Workflow**

**Review Steps**:
- Define reviewers and approvers explicitly
- Group stakeholders into review steps
- Decide sequential vs. parallel approval flows

### Anti-Patterns to Avoid

❌ **Don't**: Document only the happy path
✅ **Do**: Include error states, edge cases, and recovery workflows

❌ **Don't**: Assume file types and sizes are self-evident
✅ **Do**: Explicitly document all validation rules and constraints

❌ **Don't**: Separate UX and technical documentation
✅ **Do**: Create unified documentation covering both perspectives

### Sources
- [The Digital Project Manager - Document Management Best Practices](https://thedigitalprojectmanager.com/project-management/document-management-best-practices/)
- [Filestage - Document Approval Workflow](https://filestage.io/blog/document-approval-workflow/)
- [Speakeasy - File Uploads in OpenAPI](https://www.speakeasy.com/openapi/content/file-uploads)
- [Uploadcare - File Uploader UX Best Practices](https://uploadcare.com/blog/file-uploader-ux-best-practices/)
- [Tyk - REST API File Upload Guidance](https://tyk.io/blog/api-design-guidance-file-upload/)

---

## Research Topic 2: Multi-Step Wizard Documentation

**Search Query**: "multi-step wizard documentation best practices 2025"

### Key Patterns Identified

#### 1. **Core Design Principles**

**Wizard UI Definition**:
- Design pattern that breaks complex processes into sequential, manageable steps
- Guides users smoothly from start to finish
- Reduces cognitive overload by focusing on one task cluster at a time

**Documentation Structure**:
- Overview of entire wizard flow
- Individual step documentation
- State management documentation
- Validation rules per step

#### 2. **Progress Indication Documentation**

**Essential Elements**:
- Current step indicator
- Total steps count
- Progress bar or step numbers
- Completed/current/upcoming visual states

**Benefits to Document**:
- Lowers user frustration
- Increases completion rates
- Provides clear sense of remaining effort

#### 3. **Cognitive Load Reduction Strategies**

**Field Optimization**:
- **Recommendation**: Maximum 5 form fields per step
- Segmentation strategy documentation
- Logical grouping of related fields
- Justification for field placement

**Visual Hierarchy**:
- Primary vs. secondary actions
- Field importance indication
- Optional vs. required field marking

#### 4. **Technical Features to Document**

**Save and Resume Functionality**:
- Session persistence mechanisms
- Data recovery on return
- Timeout handling
- User notification strategies

**Validation and Error Handling**:
- Per-step validation rules
- Immediate feedback mechanisms
- Error message standards
- Prevent-forward-on-error logic

**Conditional Logic**:
- Dynamic step rendering based on previous inputs
- Personalization documentation
- Skip logic flows
- Branch documentation

#### 5. **Accessibility Requirements**

**W3C Standards**:
- Repeat overall instructions on every page
- Split forms according to logical control groups
- Keyboard navigation documentation
- Screen reader compatibility

**ARIA Attributes**:
- Role definitions for wizard components
- Aria-labels for progress indicators
- Live region announcements for step changes

### Recommended Documentation Format

```markdown
## Wizard Name: [Name]

### Overview
- Purpose: [Why this wizard exists]
- Total Steps: [Number]
- Estimated Time: [Duration]

### Step-by-Step Flow

#### Step 1: [Step Name]
- **Purpose**: [Why this step]
- **Fields**: [List with types and validation]
- **Validation Rules**: [Client-side and server-side]
- **Error States**: [Possible errors and recovery]
- **Next Step Conditions**: [What enables forward progress]

[Repeat for each step]

### State Management
- [How data persists between steps]
- [Save/resume implementation]

### Conditional Logic
- [Decision trees and branch paths]

### Accessibility Features
- [Keyboard navigation]
- [Screen reader support]
```

### Anti-Patterns to Avoid

❌ **Don't**: Document only the linear happy path
✅ **Do**: Include all conditional branches and skip logic

❌ **Don't**: Omit validation rule documentation
✅ **Do**: Document client-side AND server-side validation

❌ **Don't**: Forget accessibility documentation
✅ **Do**: Document keyboard navigation, ARIA labels, and screen reader behavior

### Sources
- [Webstacks - Multi-Step Form Best Practices](https://www.webstacks.com/blog/multi-step-form)
- [Eleken - Wizard UI Pattern](https://www.eleken.co/blog-posts/wizard-ui-pattern-explained)
- [Medium - React Multi-Step Form with Wizard Pattern](https://medium.com/@vandanpatel29122001/react-building-a-multi-step-form-with-wizard-pattern-85edec21f793)
- [W3C - Multi-page Forms Accessibility](https://www.w3.org/WAI/tutorials/forms/multi-page/)
- [FormAssembly - Multi-Step Form Best Practices](https://www.formassembly.com/blog/multi-step-form-best-practices/)

---

## Research Topic 3: Database FK Integration Documentation

**Search Query**: "foreign key relationship documentation best practices 2025"

### Key Patterns Identified

#### 1. **Documentation Importance**

**Why Document FKs?**:
- Helps developers understand database constraints
- Documents cascading behaviors (CASCADE, RESTRICT, SET NULL)
- Makes maintenance and schema modifications easier
- Enables analysts to understand relationships
- Prevents orphaned records and data integrity issues

#### 2. **Naming Conventions**

**Standard Format**: `FK_<child_table>_<parent_table>`

**Examples**:
```sql
-- Good naming
FK_classroom_content_classrooms
FK_classroom_content_uploaded_content
FK_uploaded_content_profiles

-- Poor naming (avoid)
fk_123
content_fk
classroom_fk_1
```

#### 3. **Visual Documentation Requirements**

**ERD Best Practices**:
- **Crow's Foot Notation**: Standard for showing cardinality (1:1, 1:N, M:N)
- **Color Coding**: Use colors to denote table types (fact, dimension, junction)
- **Subject Areas**: Group related tables into domains for readability
- **Three Levels**: Conceptual → Logical → Physical

**ERD Elements to Include**:
- Table names
- Column names with data types
- Primary keys (PK) marked
- Foreign keys (FK) marked
- Relationship lines with cardinality
- Constraint names

#### 4. **Constraint Documentation**

**Essential Details**:
```markdown
### Foreign Key: FK_classroom_content_classrooms

**Child Table**: classroom_content
**Parent Table**: classrooms
**Columns**: classroom_content.classroom_id → classrooms.id

**Constraint Type**: FOREIGN KEY
**On Delete**: CASCADE
**On Update**: CASCADE

**Purpose**: Ensures classroom_content records belong to valid classrooms.
When a classroom is deleted, all associated content is automatically removed.

**Migration**: 2025-09-19-create-classroom-content-table.sql
**Created**: 2025-09-19
**Last Modified**: 2025-09-19
```

#### 5. **Cascading Action Documentation**

**Standard Actions**:
- **CASCADE**: Delete/update child records automatically
- **RESTRICT**: Prevent parent deletion if children exist
- **SET NULL**: Set child FK to NULL on parent deletion
- **NO ACTION**: Similar to RESTRICT (database-dependent)

**Documentation Template**:
```markdown
### Cascading Behavior

| Action | On Delete | On Update | Rationale |
|--------|-----------|-----------|-----------|
| FK_classroom_content_classrooms | CASCADE | CASCADE | Content is meaningless without classroom |
| FK_classroom_content_uploaded_content | RESTRICT | CASCADE | Prevent accidental content deletion |
| FK_uploaded_content_profiles | RESTRICT | CASCADE | Preserve content ownership |
```

#### 6. **Implementation Best Practices**

**Data Type Consistency**:
- FK and referenced column MUST have identical data types
- Document data type choices and rationale

**Index Creation**:
- FK columns should be indexed for JOIN performance
- Document index strategy and performance rationale

**Testing and Validation**:
- Test FK constraints in development before production
- Document test scenarios and expected behavior
- Include constraint violation examples

**Data Warehouse Considerations**:
- Use `NOCHECK` (SQL Server) or `RELY DISABLE NOVALIDATE` (Oracle) for DW FK
- Document why validation is disabled
- Explain relationship awareness without enforcement

### Recommended Documentation Structure

```markdown
## Database Schema: [Schema Name]

### Overview
- Purpose: [Why this schema exists]
- Tables: [Count]
- Relationships: [Count]

### Table Relationships

#### Parent-Child Relationships

##### classrooms → classroom_content (1:N)
- **FK Constraint**: FK_classroom_content_classrooms
- **Columns**: classroom_content.classroom_id → classrooms.id
- **Cardinality**: One classroom has many content items
- **On Delete**: CASCADE (delete content when classroom deleted)
- **On Update**: CASCADE
- **Rationale**: Content is meaningless without classroom context

[Repeat for each relationship]

### ERD Diagram
[Include visual diagram here]

### Migration History
- [List migrations that created/modified FK constraints]

### Testing Notes
- [Document how FK constraints were tested]
- [Include constraint violation examples]
```

### Anti-Patterns to Avoid

❌ **Don't**: Create FKs without documenting cascading behavior
✅ **Do**: Explicitly document ON DELETE and ON UPDATE actions with rationale

❌ **Don't**: Use generic FK constraint names
✅ **Do**: Use descriptive names following FK_child_parent convention

❌ **Don't**: Forget to document the "why" behind relationships
✅ **Do**: Include business logic rationale for each FK constraint

❌ **Don't**: Omit data type documentation
✅ **Do**: Document data types and ensure FK/PK consistency

### Sources
- [CelerData - Foreign Keys Explained](https://celerdata.com/glossary/foreign-keys)
- [Microsoft Learn - Create Foreign Key Relationships](https://learn.microsoft.com/en-us/sql/relational-databases/tables/create-foreign-key-relationships)
- [Medium - Mastering Primary Key and Foreign Key](https://medium.com/@DataWithSantosh/mastering-primary-key-and-foreign-key-in-relational-databases-0f57c5cc49e9)
- [OWOX - Primary and Foreign Keys in SQL](https://www.owox.com/blog/articles/primary-and-foreign-keys-sql)
- [CockroachDB - Common Foreign Key Mistakes](https://www.cockroachlabs.com/blog/common-foreign-key-mistakes/)
- [PostgreSQL - Foreign Keys Tutorial](https://www.postgresql.org/docs/current/tutorial-fk.html)

---

## Research Topic 4: TypeScript API Documentation

**Search Query**: "TypeScript API documentation best practices 2025"

### Key Patterns Identified

#### 1. **Documentation Tool Evolution**

**TypeDoc (Industry Standard for 2025)**:
- Automatically generates documentation from TypeScript code
- Reads TypeScript code + JSDoc/TSDoc comments
- Creates professional HTML documentation
- Promotes collaboration and transparency

**TSDoc vs JSDoc**:
- **TSDoc**: Newer standard by TypeScript authors (recommended for 2025)
- **JSDoc**: Still widely supported, but legacy for TypeScript
- **Key Difference**: TSDoc designed specifically for TypeScript, JSDoc focused on type annotations for plain JS

#### 2. **Type Safety Documentation**

**Strict Mode (Default for 2025)**:
- Enable strict mode in tsconfig.json
- Document why strict mode is required
- Catch subtle bugs through type checking

**Explicit Typing**:
- Never use `any` type (document exceptions if absolutely necessary)
- Always define types explicitly
- Document complex types with comments

**Example**:
```typescript
/**
 * Represents uploaded content metadata
 * @remarks
 * This interface ensures type safety for all uploaded content operations.
 * Never use `any` for content_type - must be explicit MIME type.
 *
 * @example
 * ```typescript
 * const content: UploadedContentMetadata = {
 *   id: uuid(),
 *   file_name: "textbook.pdf",
 *   content_type: "application/pdf", // Explicit, not 'any'
 *   file_size: 1024000
 * };
 * ```
 */
export interface UploadedContentMetadata {
  id: string;
  file_name: string;
  content_type: string; // MIME type (e.g., "application/pdf")
  file_size: number; // bytes
  upload_timestamp: string; // ISO 8601
}
```

#### 3. **Modern TypeScript Features (2025)**

**ECMAScript Modules (ESM)**:
- 2025 default is ESM (not CommonJS)
- Document import/export patterns
- Future-proof interoperability

**Utility Types**:
- Document usage of `Partial<T>`, `Pick<T>`, `Omit<T>`, `Record<K, V>`, `Required<T>`
- Combine utility types with custom types
- Provide examples for complex transformations

**Example**:
```typescript
/**
 * Partial update payload for classroom content
 * @remarks
 * Uses TypeScript's Partial utility to make all fields optional,
 * allowing clients to update only specific fields.
 *
 * @example
 * ```typescript
 * const update: ClassroomContentUpdate = {
 *   title: "Updated Title"
 *   // Other fields remain unchanged
 * };
 * ```
 */
export type ClassroomContentUpdate = Partial<ClassroomContent>;
```

#### 4. **API Documentation Structure**

**Essential Sections**:
1. **Overview**: Purpose and high-level description
2. **Installation**: How to import/use
3. **Type Definitions**: Interfaces, types, enums
4. **Functions/Methods**: Signature, parameters, return types
5. **Examples**: Real-world usage examples
6. **Error Handling**: Possible errors and how to handle
7. **Change Log**: Version history and breaking changes

**TSDoc Comment Format**:
```typescript
/**
 * Uploads content and associates it with a classroom
 *
 * @param file - The file to upload (multipart/form-data)
 * @param classroomId - UUID of the target classroom
 * @param metadata - Additional content metadata
 *
 * @returns Promise resolving to uploaded content record
 *
 * @throws {UploadError} When file validation fails
 * @throws {DatabaseError} When FK constraint violation occurs
 *
 * @remarks
 * This function handles:
 * - File validation (type, size)
 * - Supabase Storage upload
 * - Database record creation with FK to classroom
 *
 * @example
 * ```typescript
 * const result = await uploadClassroomContent(
 *   file,
 *   "550e8400-e29b-41d4-a716-446655440000",
 *   { title: "Chapter 1", subject: "Mathematics" }
 * );
 * console.log(result.storage_path);
 * ```
 *
 * @see {@link ClassroomContent} for return type structure
 * @see {@link UploadMetadata} for metadata schema
 */
export async function uploadClassroomContent(
  file: File,
  classroomId: string,
  metadata: UploadMetadata
): Promise<ClassroomContent> {
  // Implementation
}
```

#### 5. **Collaboration & Code Quality**

**Pull Request Requirements**:
- Include updated type definitions
- Ensure new functionality has proper type annotations
- Update documentation for API changes
- Add examples for new features

**CI/CD Integration**:
- Run TypeDoc generation in CI pipeline
- Fail builds on type errors
- Generate documentation artifacts
- Deploy docs to hosting (Vercel, Netlify, etc.)

### TSDoc vs JSDoc Comparison

| Feature | JSDoc | TSDoc |
|---------|-------|-------|
| **Target** | Plain JavaScript | TypeScript |
| **Type Annotations** | Required (in comments) | Optional (types in code) |
| **Standard** | Loosely defined | Rigorously specified |
| **Tooling** | JSDoc CLI | TypeDoc, TSDoc linter |
| **2025 Status** | Legacy (but supported) | Recommended |
| **Syntax** | `@param {string} name` | `@param name - Description` |

**Recommendation**: Use TSDoc for new TypeScript projects in 2025.

### Recommended Documentation Workflow

1. **Write Code with TSDoc Comments**:
   ```typescript
   /** TSDoc comment here */
   export interface MyType { }
   ```

2. **Generate Documentation**:
   ```bash
   npx typedoc --out docs src/index.ts
   ```

3. **Review Generated Docs**:
   - Check for completeness
   - Verify examples render correctly
   - Test navigation

4. **Deploy Documentation**:
   ```bash
   vercel deploy docs --prod
   ```

5. **Automate in CI**:
   ```yaml
   # .github/workflows/docs.yml
   - name: Generate TypeScript Docs
     run: npm run docs:generate
   - name: Deploy Docs
     run: npm run docs:deploy
   ```

### Anti-Patterns to Avoid

❌ **Don't**: Use `any` type without documentation
✅ **Do**: Explicitly document why `any` is necessary (rare cases only)

❌ **Don't**: Omit return type documentation
✅ **Do**: Document return types with examples

❌ **Don't**: Forget to document thrown errors
✅ **Do**: Use `@throws` to document all possible errors

❌ **Don't**: Write documentation that duplicates type information
✅ **Do**: Add context, rationale, and examples beyond types

### Sources
- [TypeScript Official - JSDoc Reference](https://www.typescriptlang.org/docs/handbook/jsdoc-supported-types.html)
- [DEV.to - TypeScript Best Practices 2025](https://dev.to/sovannaro/typescript-best-practices-2025-elevate-your-code-quality-1gh3)
- [Microsoft - TSDoc Guidelines](https://github.com/microsoft/FluidFramework/wiki/TSDoc-Guidelines)
- [Microsoft - TSDoc Standard](https://github.com/microsoft/tsdoc)
- [Medium - TypeScript Best Practices 2025](https://medium.com/@nikhithsomasani/best-practices-for-using-typescript-in-2025-a-guide-for-experienced-developers-4fca1cfdf052)
- [TSDoc Official](https://tsdoc.org/)

---

## Research Topic 5: React Component Library Documentation

**Search Query**: "React component library documentation 2025"

### Key Patterns Identified

#### 1. **Industry-Leading Component Libraries (2025)**

**Top Libraries with Exemplary Documentation**:

1. **Material UI (MUI)**:
   - 92.9k GitHub stars, 3.8M weekly downloads
   - Comprehensive API documentation
   - Interactive examples
   - Customization guides

2. **Chakra UI**:
   - 37.3k GitHub stars, 533k weekly downloads
   - Accessibility-first documentation
   - Theme customization examples
   - Component composition guides

3. **Ant Design**:
   - 91.5k GitHub stars, 1.3M weekly downloads
   - Enterprise-focused documentation
   - Design system integration
   - Internationalization guides

4. **Radix UI + Tailwind**:
   - Unstyled, accessible components
   - Composition-focused documentation
   - Headless component patterns

5. **Mantine**:
   - 123 components, 40+ hooks
   - Hook-based documentation
   - Form management guides

#### 2. **Component Documentation Structure**

**Essential Sections**:

```markdown
## Component Name: [ComponentName]

### Overview
- **Purpose**: [What problem does this solve?]
- **Category**: [Form/Layout/Navigation/etc.]
- **Status**: [Stable/Beta/Experimental]

### Installation
\`\`\`bash
npm install @pinglearn/components
\`\`\`

### Import
\`\`\`typescript
import { ComponentName } from '@pinglearn/components';
\`\`\`

### Basic Usage
\`\`\`tsx
<ComponentName prop1="value" prop2={value} />
\`\`\`

### Props API

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| prop1 | string | - | Yes | Description |
| prop2 | number | 0 | No | Description |

### Examples

#### Example 1: Basic Usage
\`\`\`tsx
[Code example]
\`\`\`

#### Example 2: Advanced Usage
\`\`\`tsx
[Code example]
\`\`\`

### Accessibility
- Keyboard navigation: [Details]
- ARIA attributes: [List]
- Screen reader support: [Details]

### Theming
[How to customize with theme]

### Related Components
- [Link to related component 1]
- [Link to related component 2]
```

#### 3. **Key Documentation Trends (2025)**

**Built-in Accessibility**:
- ARIA attribute documentation
- Keyboard navigation tables
- Screen reader compatibility notes
- WCAG 2.1 compliance indicators

**Interactive Examples**:
- Live code playgrounds (CodeSandbox, StackBlitz)
- Editable examples
- Copy-to-clipboard functionality
- Dark/light mode toggles

**AI-Assisted Features**:
- AI-powered component search
- Auto-generated variations
- Smart prop suggestions

**TypeScript-First**:
- All examples in TypeScript
- Prop type definitions visible
- Generic type documentation

#### 4. **Props Documentation Best Practices**

**Comprehensive Prop Tables**:
```markdown
### Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| files | File[] | [] | Yes | Array of files to upload |
| onUpload | (files: File[]) => Promise<void> | - | Yes | Upload handler callback |
| maxFiles | number | 10 | No | Maximum number of files allowed |
| accept | string | "*" | No | Accepted file types (MIME) |
| maxSize | number | 5242880 | No | Max file size in bytes (default: 5MB) |
| disabled | boolean | false | No | Disable upload functionality |
| multiple | boolean | true | No | Allow multiple file selection |
| onError | (error: UploadError) => void | - | No | Error handler callback |
```

**TypeScript Type Definitions**:
```typescript
/**
 * Props for FileUpload component
 */
export interface FileUploadProps {
  /** Array of files to upload */
  files: File[];

  /** Upload handler callback */
  onUpload: (files: File[]) => Promise<void>;

  /** Maximum number of files allowed (default: 10) */
  maxFiles?: number;

  /** Accepted file types (MIME types, default: "*") */
  accept?: string;

  /** Max file size in bytes (default: 5MB) */
  maxSize?: number;

  /** Disable upload functionality */
  disabled?: boolean;

  /** Allow multiple file selection */
  multiple?: boolean;

  /** Error handler callback */
  onError?: (error: UploadError) => void;
}
```

#### 5. **Example Documentation Patterns**

**Progressive Examples** (Simple → Advanced):

```markdown
### Examples

#### Basic File Upload
\`\`\`tsx
<FileUpload
  files={files}
  onUpload={handleUpload}
/>
\`\`\`

#### With File Type Restrictions
\`\`\`tsx
<FileUpload
  files={files}
  onUpload={handleUpload}
  accept="application/pdf,image/*"
  maxSize={10485760} // 10MB
/>
\`\`\`

#### With Error Handling
\`\`\`tsx
<FileUpload
  files={files}
  onUpload={handleUpload}
  onError={(error) => {
    console.error('Upload failed:', error);
    toast.error(error.message);
  }}
/>
\`\`\`

#### Complete Example with All Features
\`\`\`tsx
<FileUpload
  files={files}
  onUpload={async (files) => {
    await uploadToStorage(files);
    await createDatabaseRecords(files);
  }}
  accept="application/pdf,image/*"
  maxFiles={5}
  maxSize={10485760}
  multiple={true}
  disabled={isUploading}
  onError={(error) => {
    logError(error);
    showErrorToast(error);
  }}
/>
\`\`\`
```

#### 6. **Event Handler Documentation**

**Standard Format**:
```markdown
### Event Handlers

#### onUpload
Called when files are ready to upload.

**Signature**:
\`\`\`typescript
onUpload: (files: File[]) => Promise<void>
\`\`\`

**Parameters**:
- `files`: Array of File objects to upload

**Returns**: Promise that resolves when upload completes

**Example**:
\`\`\`typescript
const handleUpload = async (files: File[]) => {
  for (const file of files) {
    await uploadToSupabase(file);
  }
};
\`\`\`

#### onError
Called when an error occurs during validation or upload.

**Signature**:
\`\`\`typescript
onError?: (error: UploadError) => void
\`\`\`

**Parameters**:
- `error`: UploadError object containing error details

**Example**:
\`\`\`typescript
const handleError = (error: UploadError) => {
  switch (error.code) {
    case 'FILE_TOO_LARGE':
      toast.error(`File exceeds ${maxSize} bytes`);
      break;
    case 'INVALID_FILE_TYPE':
      toast.error('Invalid file type');
      break;
    default:
      toast.error('Upload failed');
  }
};
\`\`\`
```

### Component Categories Documentation

**Organize by Function**:
- **Form Components**: FileUpload, FormWizard, ValidationField
- **Layout Components**: WizardStep, ProgressIndicator
- **Feedback Components**: ErrorMessage, SuccessToast
- **Data Display**: FilePreview, MetadataDisplay

### Anti-Patterns to Avoid

❌ **Don't**: Provide only basic examples
✅ **Do**: Include progressive examples from simple to advanced

❌ **Don't**: Omit TypeScript type definitions
✅ **Do**: Show prop types and interfaces explicitly

❌ **Don't**: Forget accessibility documentation
✅ **Do**: Document keyboard navigation, ARIA, and screen reader support

❌ **Don't**: Use vague prop descriptions
✅ **Do**: Provide clear, specific descriptions with examples

### Sources
- [Builder.io - React Component Libraries 2025](https://www.builder.io/blog/react-component-library)
- [Prismic - React Component Libraries 2025](https://prismic.io/blog/react-component-libraries)
- [Material UI Official](https://mui.com/)
- [BrowserStack - React Component Libraries Guide](https://www.browserstack.com/guide/react-components-libraries)
- [Medium - Modern UI Component Libraries](https://medium.com/@mahesh.paul.j/top-10-modern-ui-component-libraries-for-react-a-2025-guide-fcbc54e517e8)

---

## Additional Research: Specialized Documentation Topics

### OpenAPI/Swagger Documentation Best Practices

**Search Query**: "API endpoint documentation OpenAPI Swagger best practices 2025"

#### Key Findings

**Design-First Approach**:
- Create OpenAPI spec before implementation
- Single source of truth for API contract
- Validate implementation against spec in CI/CD

**Interactive Documentation**:
- Swagger UI for live testing
- API explorers allowing developers to test without leaving docs
- Immediate feedback mechanisms

**Security Documentation**:
- Define authentication schemes globally using `securitySchemes`
- Document API key, OAuth, JWT patterns
- Include security examples

**Code Examples**:
- Include snippets in popular languages (JavaScript, TypeScript, Python, cURL)
- Step-by-step tutorials for common scenarios
- Downloadable Postman collections

**CI/CD Integration**:
- Validate docs match API schema on every push
- Automated testing against OpenAPI definition
- Generate SDK documentation automatically

**Example OpenAPI Documentation**:
```yaml
openapi: 3.0.0
info:
  title: Classroom Content Upload API
  version: 1.0.0
  description: |
    API for uploading and managing classroom content.

    ## Authentication
    All endpoints require JWT authentication.

    ## Rate Limits
    - 100 requests per minute per user

    ## Error Handling
    Standard HTTP status codes with detailed error messages.

paths:
  /api/classroom-content/upload:
    post:
      summary: Upload classroom content
      description: |
        Uploads content files and associates them with a classroom.

        **Process**:
        1. Validate file type and size
        2. Upload to Supabase Storage
        3. Create database record with FK to classroom

        **Constraints**:
        - File size: Max 10MB
        - File types: PDF, images, videos
        - Classroom must exist (FK constraint)

      security:
        - bearerAuth: []

      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required:
                - file
                - classroom_id
              properties:
                file:
                  type: string
                  format: binary
                  description: File to upload
                classroom_id:
                  type: string
                  format: uuid
                  description: UUID of target classroom
                metadata:
                  $ref: '#/components/schemas/UploadMetadata'

      responses:
        '201':
          description: Content uploaded successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ClassroomContent'
        '400':
          description: Validation error
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'
        '404':
          description: Classroom not found (FK violation)
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

components:
  schemas:
    ClassroomContent:
      type: object
      properties:
        id:
          type: string
          format: uuid
        classroom_id:
          type: string
          format: uuid
        uploaded_content_id:
          type: string
          format: uuid
        title:
          type: string
        file_name:
          type: string
        storage_path:
          type: string
        created_at:
          type: string
          format: date-time

    UploadMetadata:
      type: object
      properties:
        title:
          type: string
        subject:
          type: string

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

#### Sources
- [Swagger - API Documentation Best Practices](https://swagger.io/blog/api-documentation/best-practices-in-api-documentation/)
- [OpenAPI - Best Practices](https://learn.openapis.org/best-practices.html)
- [Theneo - API Documentation Guide 2025](https://www.theneo.io/blog/api-documentation-best-practices-guide-2025)
- [APImatic - OpenAPI Best Practices](https://www.apimatic.io/blog/2022/11/14-best-practices-to-write-openapi-for-better-api-consumption)

---

### Database Schema & ERD Documentation Best Practices

**Search Query**: "database schema documentation ERD diagram best practices 2025"

#### Key Findings

**Three-Level Documentation**:
1. **Conceptual ERD**: High-level overview, business entities
2. **Logical ERD**: Detailed relationships, technology-independent
3. **Physical ERD**: Implementation-specific, includes indexes, constraints

**Visual Design Best Practices**:
- **Color Coding**: Fact tables (blue), dimension tables (green), junction tables (yellow)
- **Crow's Foot Notation**: Standard for cardinality (1:1, 1:N, M:N)
- **Subject Areas**: Group related tables into domains for large schemas
- **Consistent Naming**: Apply naming conventions to all objects

**Documentation Elements**:
- Table and column comments (inserted into database)
- Sample data showing realistic examples
- Visual relationship lines with cardinality
- Constraint names and types
- Index documentation
- Migration history

**ERD Tools (2025)**:
- **DbSchema**: Comprehensive features, visual design, SQL editor
- **DrawDB**: Browser-based, drag-and-drop, exports SQL
- **Lucidchart**: Collaborative diagramming
- **Vertabelo**: Database modeling specialist

**Example ERD Documentation**:
```markdown
## Database Schema: Classroom Content System

### Conceptual Overview
- **Purpose**: Manage student-teacher classroom content uploads
- **Core Entities**: Classrooms, Uploaded Content, Classroom Content (junction)
- **Relationships**: Many-to-many through junction table

### Logical ERD

#### Tables

##### classrooms
- **Type**: Dimension table (blue)
- **Purpose**: Store classroom information
- **Relationships**: 1:N with classroom_content

**Columns**:
- id (UUID, PK)
- teacher_profile_id (UUID, FK → profiles.id)
- classroom_name (VARCHAR)
- created_at (TIMESTAMP)

##### uploaded_content
- **Type**: Fact table (yellow)
- **Purpose**: Store content metadata and storage paths
- **Relationships**: 1:N with classroom_content

**Columns**:
- id (UUID, PK)
- uploader_profile_id (UUID, FK → profiles.id)
- file_name (VARCHAR)
- content_type (VARCHAR)
- storage_path (TEXT)
- file_size (INTEGER)
- created_at (TIMESTAMP)

##### classroom_content
- **Type**: Junction table (green)
- **Purpose**: Associate content with classrooms (M:N relationship)
- **Relationships**: N:1 with classrooms, N:1 with uploaded_content

**Columns**:
- id (UUID, PK)
- classroom_id (UUID, FK → classrooms.id)
- uploaded_content_id (UUID, FK → uploaded_content.id)
- added_at (TIMESTAMP)

### Physical ERD

#### Foreign Key Constraints

##### FK_classroom_content_classrooms
- **Columns**: classroom_content.classroom_id → classrooms.id
- **On Delete**: CASCADE
- **On Update**: CASCADE
- **Rationale**: Content is classroom-specific; remove when classroom deleted

##### FK_classroom_content_uploaded_content
- **Columns**: classroom_content.uploaded_content_id → uploaded_content.id
- **On Delete**: RESTRICT
- **On Update**: CASCADE
- **Rationale**: Prevent accidental content deletion; maintain referential integrity

##### FK_uploaded_content_profiles
- **Columns**: uploaded_content.uploader_profile_id → profiles.id
- **On Delete**: RESTRICT
- **On Update**: CASCADE
- **Rationale**: Preserve content ownership; prevent orphaned uploads

#### Indexes
- idx_classroom_content_classroom_id (classroom_id) - JOIN performance
- idx_classroom_content_uploaded_content_id (uploaded_content_id) - JOIN performance
- idx_uploaded_content_uploader_id (uploader_profile_id) - Filter by uploader

#### Sample Data

**classrooms**:
| id | teacher_profile_id | classroom_name |
|----|-------------------|----------------|
| 550e8400... | 660e8400... | Grade 10 Math A |

**uploaded_content**:
| id | uploader_profile_id | file_name | content_type | storage_path |
|----|-------------------|-----------|--------------|--------------|
| 770e8400... | 660e8400... | chapter1.pdf | application/pdf | uploads/770e8400.../chapter1.pdf |

**classroom_content**:
| id | classroom_id | uploaded_content_id |
|----|--------------|-------------------|
| 880e8400... | 550e8400... | 770e8400... |

### Migration History
1. `2025-09-15-create-classrooms-table.sql`
2. `2025-09-16-create-uploaded-content-table.sql`
3. `2025-09-19-create-classroom-content-table.sql`

### Visual Diagram
[Include ERD diagram image here]

### Testing Notes
- FK constraint violation tested: Attempt to insert classroom_content with non-existent classroom_id → Expected: Error 23503
- CASCADE behavior tested: Delete classroom → Expected: Associated classroom_content records deleted automatically
```

#### Sources
- [DbSchema - PostgreSQL ER Diagram Tools](https://dbschema.com/blog/postgresql/top-free-er-diagram-tools/)
- [Lucidchart - ER Diagrams](https://www.lucidchart.com/pages/er-diagrams)
- [Vertabelo - Good ER Diagram Layout](https://vertabelo.com/blog/vertabelo-tips-good-er-diagram-layout/)
- [ByteBase - Database Schema Diagram Tools](https://www.bytebase.com/blog/top-database-schema-diagram-tools/)
- [DbSchema - MySQL Database Documentation](https://dbschema.com/blog/mysql/database-documentation/)

---

## Synthesis: Application to FC-00-AC

### How These Best Practices Apply

#### 1. **File Upload Documentation** → FC-00-AC Upload Flow
- Document drag-drop interface
- Specify file type restrictions (PDF, images, videos)
- Document file size limits (10MB max)
- Include error handling for validation failures
- Show progress indication during upload

#### 2. **Multi-Step Wizard Documentation** → FC-00-AC 3-Step Wizard
- Document each step clearly (Select Files → Review & Confirm → Upload)
- Show progress indicator (Step 1 of 3)
- Document validation rules per step
- Include save/resume functionality (if applicable)
- Show conditional logic (e.g., skip confirmation if single file)

#### 3. **Database FK Documentation** → FC-00-AC Schema
- Document all three FK constraints:
  - `FK_classroom_content_classrooms` (CASCADE)
  - `FK_classroom_content_uploaded_content` (RESTRICT)
  - `FK_uploaded_content_profiles` (RESTRICT)
- Include ERD showing M:N relationship through junction table
- Document cascading behaviors with rationale
- Show migration history

#### 4. **TypeScript API Documentation** → FC-00-AC Components/APIs
- Use TSDoc for all component props
- Document API endpoints with OpenAPI
- Include type definitions for all interfaces
- Show examples from simple to advanced
- Document error types and handling

#### 5. **React Component Documentation** → FC-00-AC Components
- Document `FileUploadWizard` component with full props API
- Include accessibility features (keyboard navigation, ARIA)
- Show progressive examples
- Document event handlers (`onUpload`, `onError`, `onProgress`)
- Include theming/customization options

### Recommended Documentation Structure for FC-00-AC

```
/docs/features/classroom-content-upload/
├── README.md                           # Overview and quick start
├── USER-GUIDE.md                       # End-user documentation
├── TECHNICAL-SPECIFICATION.md          # Complete technical spec
├── API-DOCUMENTATION.md                # API endpoints (OpenAPI)
├── COMPONENT-DOCUMENTATION.md          # React components (TSDoc)
├── DATABASE-SCHEMA.md                  # Schema + ERD + FKs
├── WIZARD-FLOW.md                      # Multi-step wizard details
├── ERROR-HANDLING.md                   # Error types and recovery
└── EXAMPLES.md                         # Code examples and tutorials
```

---

## Key Takeaways

### Industry Standards (2025)

1. **Interactive Documentation**: Live code examples, API explorers, immediate feedback
2. **TypeScript-First**: TSDoc over JSDoc, type safety emphasized
3. **Accessibility**: WCAG 2.1 compliance, ARIA documentation mandatory
4. **Visual Documentation**: ERD diagrams, sequence diagrams, component trees
5. **Single Source of Truth**: OpenAPI specs, TypeDoc generation, automated updates
6. **CI/CD Integration**: Automated doc generation, validation, deployment

### Documentation Hierarchy

1. **High-Level**: README, overview, quick start
2. **Conceptual**: Architecture, design decisions, rationale
3. **Logical**: Workflows, relationships, dependencies
4. **Physical**: Implementation details, code examples, APIs
5. **Operational**: Deployment, monitoring, troubleshooting

### Quality Criteria

✅ **Good Documentation**:
- Clear, concise language
- Progressive examples (simple → advanced)
- Visual aids (diagrams, screenshots)
- Interactive elements
- Up-to-date (automated generation)
- Accessible (WCAG compliant)
- Searchable and navigable
- Version-controlled

❌ **Poor Documentation**:
- Outdated information
- Missing examples
- No visual aids
- Unclear language
- Incomplete coverage
- Not accessible
- Difficult to navigate

---

## Conclusion

This research synthesizes current (2025) industry best practices for documenting file upload workflows, multi-step wizards, database foreign key integrations, TypeScript APIs, and React component libraries. All findings are directly applicable to the FC-00-AC implementation and should guide the documentation creation process.

**Next Steps**:
1. Create documentation templates based on these patterns
2. Develop style guide for consistent documentation
3. Apply patterns to FC-00-AC documentation
4. Set up automated documentation generation (TypeDoc, OpenAPI)
5. Integrate documentation validation into CI/CD

---

**Research Complete**: September 19, 2025
**Agent**: A4-D2 (Web Research Agent)
**Status**: Ready for Template Creation
