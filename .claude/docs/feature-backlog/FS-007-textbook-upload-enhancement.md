# Feature Specification: Textbook Upload Enhancement & Duplicate Prevention

## Document Metadata
| Field | Value |
|-------|-------|
| **Feature ID** | FS-007 |
| **Feature Name** | Textbook Upload Enhancement & Duplicate Prevention |
| **Version** | 1.0.0 |
| **Status** | `APPROVAL_PENDING` |
| **Priority** | Critical (P0) |
| **Estimated Effort** | 1 week (6 days) |
| **Dependencies** | Existing textbook system, Supabase database, PDF processing pipeline |
| **Author** | Claude AI Assistant |
| **Created Date** | 2025-09-26 |
| **Last Modified** | 2025-09-26 |

## Timestamps
| Event | Date | Notes |
|-------|------|-------|
| **Draft Created** | 2025-09-26 | Initial specification drafted |
| **Review Requested** | - | Pending |
| **Approved** | - | Awaiting approval |
| **Development Started** | - | Not started |
| **UAT Completed** | - | Not started |
| **Production Released** | - | Not started |

## Status Workflow
```
DRAFT → APPROVAL_PENDING → APPROVED → IN_DEVELOPMENT → UAT → PRODUCTION_READY → DEPLOYED
```

**Implementation Gate**: This feature MUST NOT be implemented until status is `APPROVED`

---

## Executive Summary

### Current State Analysis
After deep analysis of the PingLearn codebase, we have discovered a **fully functional textbook upload system** that is:
1. **Already Built**: Complete PDF processing pipeline at `/textbooks`
2. **Hidden from Users**: Not in main navigation (only accessible via dashboard Quick Actions)
3. **Fully Functional**: Supports upload, processing, chunking, and storage
4. **Missing Duplicate Prevention**: No checks for duplicate textbooks
5. **Not Integrated**: Missing from the primary learning flow

### Key Finding
**The textbook upload feature exists but is hidden from users and lacks duplicate prevention. It needs navigation visibility, duplicate detection, and UI/UX enhancements.**

## Business Objectives

### Primary Goals
1. **Feature Discoverability**: Make textbook upload visible in main navigation
2. **Prevent Duplicate Content**: Save storage and processing costs by preventing duplicate uploads
3. **Improve User Experience**: Enhance upload flow with better feedback and mobile optimization
4. **Increase Content Library**: Enable users to build comprehensive study material libraries
5. **Support Learning Flow**: Integrate textbooks seamlessly into classroom sessions

### Success Metrics
- Feature discovery rate: >80% of active users
- Duplicate prevention rate: 100% detection accuracy
- Upload success rate: >95%
- Processing success rate: >90%
- Mobile upload adoption: >40% of total uploads
- Storage cost reduction: 30% through duplicate prevention

## Detailed Feature Requirements

### 1. Duplicate Prevention System

#### 1.1 Content Fingerprinting
```typescript
interface TextbookFingerprint {
  // Primary identifiers
  contentHash: string;        // SHA-256 hash of PDF content
  fileSize: number;           // Exact byte size
  pageCount: number;          // Total pages

  // Secondary identifiers
  titleMatch: string;         // Normalized title for fuzzy matching
  firstPageHash: string;      // Hash of first page content
  lastPageHash: string;       // Hash of last page content

  // Metadata
  uploadedBy: string;         // User ID
  uploadedAt: Date;
  schoolBoard?: string;       // NCERT, CBSE, etc.
  grade?: number;
  subject?: string;
}
```

#### 1.2 Duplicate Detection Algorithm
```typescript
interface DuplicateDetection {
  checks: {
    // Level 1: Exact match
    exactHash: {
      priority: 1;
      action: 'block';
      message: 'This exact textbook already exists';
    };

    // Level 2: Near match
    similarContent: {
      priority: 2;
      threshold: 0.95; // 95% similarity
      action: 'warn';
      message: 'A very similar textbook exists. Continue?';
    };

    // Level 3: Metadata match
    sameTitleGradeSubject: {
      priority: 3;
      action: 'suggest';
      message: 'A textbook with same title exists. Is this a different edition?';
    };
  };

  userOptions: {
    useExisting: boolean;      // Link to existing textbook
    uploadAsVersion: boolean;   // Create as new version
    forceUpload: boolean;       // Override (requires reason)
  };
}
```

#### 1.3 Database Schema Updates
```sql
-- Add to textbooks table
ALTER TABLE textbooks ADD COLUMN content_hash VARCHAR(64) UNIQUE;
ALTER TABLE textbooks ADD COLUMN file_hash VARCHAR(64);
ALTER TABLE textbooks ADD COLUMN is_duplicate_of UUID REFERENCES textbooks(id);
ALTER TABLE textbooks ADD COLUMN version_number INTEGER DEFAULT 1;

-- Create fingerprints table
CREATE TABLE textbook_fingerprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  textbook_id UUID REFERENCES textbooks(id) ON DELETE CASCADE,
  content_hash VARCHAR(64) NOT NULL,
  file_size BIGINT NOT NULL,
  page_count INTEGER NOT NULL,
  first_page_hash VARCHAR(64),
  last_page_hash VARCHAR(64),
  title_normalized TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(content_hash)
);

-- Create index for fast duplicate checking
CREATE INDEX idx_fingerprints_hash ON textbook_fingerprints(content_hash);
CREATE INDEX idx_fingerprints_title ON textbook_fingerprints(title_normalized);
```

### 2. Enhanced Upload Validation

#### 2.1 Pre-Upload Checks
```typescript
interface PreUploadValidation {
  client: {
    fileType: 'application/pdf';
    maxSize: 52428800; // 50MB
    minSize: 10240;    // 10KB minimum

    quickCheck: {
      // Before upload starts
      checkFilename: boolean;  // Check if filename exists
      checkSize: boolean;      // Check if size matches existing
      suggestExisting: boolean; // Suggest similar textbooks
    };
  };

  server: {
    // After upload, before processing
    generateHash: boolean;
    checkDuplicate: boolean;
    virusScan: boolean;
    validatePDF: boolean;
    extractMetadata: boolean;
  };
}
```

#### 2.2 Duplicate Resolution UI
```typescript
interface DuplicateResolutionModal {
  type: 'exact' | 'similar' | 'metadata';

  existingTextbook: {
    id: string;
    title: string;
    uploadedBy: string;
    uploadedAt: Date;
    pageCount: number;
    chapters: number;
    usageCount: number; // How many students use it
  };

  actions: {
    useExisting: {
      label: 'Use Existing Textbook';
      description: 'Link to the already processed textbook';
      icon: 'LinkIcon';
      recommended: true;
    };

    uploadNewVersion: {
      label: 'Upload as New Version';
      description: 'If this is an updated edition';
      icon: 'RefreshIcon';
      requiresReason: true;
    };

    forceUpload: {
      label: 'Upload Anyway';
      description: 'Create separate copy (not recommended)';
      icon: 'AlertIcon';
      requiresConfirmation: true;
      requiresReason: true;
    };

    cancel: {
      label: 'Cancel Upload';
      icon: 'XIcon';
    };
  };
}
```

### 3. Navigation Integration

#### 3.1 Main Navigation Update
```typescript
// src/components/layout/TopNavigation.tsx
const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/wizard', label: 'Setup', icon: BookOpen },
  { href: '/textbooks', label: 'Textbooks', icon: FileText }, // NEW
  { href: '/classroom', label: 'Classroom', icon: Mic },
  { href: '/sessions', label: 'Past Lessons', icon: Clock },
  { href: '/notes', label: 'Notes', icon: FileText },
  { href: '/help', label: 'Help', icon: HelpCircle },
];
```

#### 3.2 Mobile Navigation
```typescript
// Ensure responsive behavior
interface MobileNavigation {
  bottomNav: boolean;        // Show in bottom navigation
  hamburgerMenu: boolean;    // Include in hamburger menu
  quickAction: boolean;       // Keep as floating action button
  badge: {
    show: boolean;
    count: number;           // Number of textbooks
    status: 'processing' | 'ready' | null;
  };
}
```

### 4. Processing Pipeline Enhancement

#### 4.1 Optimized Processing with Deduplication
```typescript
interface ProcessingOptimization {
  deduplication: {
    // If duplicate detected
    skipProcessing: boolean;
    linkToExisting: boolean;
    copyChapters: boolean;
    copyChunks: boolean;

    // Only process differences
    differential: {
      enabled: boolean;
      compareChapters: boolean;
      processNewOnly: boolean;
    };
  };

  performance: {
    caching: {
      hashCache: Map<string, string>;      // File hash cache
      chapterCache: Map<string, Chapter[]>; // Processed chapters cache
    };

    parallel: {
      maxConcurrent: 3;
      priorityQueue: boolean;
    };
  };
}
```

### 5. User Interface Enhancements

#### 5.1 Upload Progress with Duplicate Check
```typescript
interface EnhancedUploadProgress {
  stages: [
    {
      name: 'Validating';
      steps: ['File type check', 'Size validation', 'PDF structure'];
    },
    {
      name: 'Checking Duplicates';
      steps: ['Generating fingerprint', 'Searching library', 'Comparing content'];
    },
    {
      name: 'Uploading';
      steps: ['Transferring file', 'Saving to storage'];
    },
    {
      name: 'Processing';
      steps: ['Extracting text', 'Identifying chapters', 'Creating chunks'];
    },
    {
      name: 'Finalizing';
      steps: ['Indexing content', 'Generating preview', 'Ready for use'];
    }
  ];

  duplicateCheckResult?: {
    isDuplicate: boolean;
    similarity: number;
    existingId?: string;
    userAction?: 'use_existing' | 'upload_new' | 'cancelled';
  };
}
```

## Technical Implementation

### Backend Changes

#### 1. Duplicate Detection Service
```typescript
// src/lib/textbook/duplicate-detector.ts
export class DuplicateDetector {
  async checkDuplicate(file: File): Promise<DuplicateCheckResult> {
    const hash = await this.generateHash(file);
    const fingerprint = await this.generateFingerprint(file);

    // Check exact match
    const exactMatch = await this.findExactMatch(hash);
    if (exactMatch) {
      return { type: 'exact', existing: exactMatch };
    }

    // Check similar content
    const similarMatches = await this.findSimilar(fingerprint);
    if (similarMatches.length > 0) {
      return { type: 'similar', existing: similarMatches[0], similarity: 0.95 };
    }

    // Check metadata match
    const metadataMatch = await this.findByMetadata(file.name);
    if (metadataMatch) {
      return { type: 'metadata', existing: metadataMatch };
    }

    return { type: 'none' };
  }

  private async generateHash(file: File): Promise<string> {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
```

#### 2. Updated Upload Action
```typescript
// src/lib/textbook/actions.ts
export async function uploadTextbook(formData: FormData): Promise<TextbookUploadResponse> {
  const file = formData.get('file') as File;

  // NEW: Check for duplicates
  const duplicateCheck = await duplicateDetector.checkDuplicate(file);

  if (duplicateCheck.type === 'exact') {
    return {
      data: null,
      error: null,
      duplicate: {
        exists: true,
        type: 'exact',
        existingId: duplicateCheck.existing.id,
        message: 'This exact textbook already exists in your library'
      }
    };
  }

  if (duplicateCheck.type === 'similar') {
    // Return with warning, let frontend handle user choice
    return {
      data: null,
      error: null,
      duplicate: {
        exists: true,
        type: 'similar',
        existingId: duplicateCheck.existing.id,
        similarity: duplicateCheck.similarity,
        requiresConfirmation: true
      }
    };
  }

  // Proceed with upload if no duplicates or user confirmed
  // ... existing upload logic ...
}
```

### Frontend Changes

#### 1. Duplicate Resolution Component
```typescript
// src/components/textbook/DuplicateResolution.tsx
export function DuplicateResolution({
  duplicate,
  onResolution
}: DuplicateResolutionProps) {
  return (
    <Dialog open={!!duplicate}>
      <DialogContent className="glass-card">
        <DialogHeader>
          <DialogTitle>
            {duplicate.type === 'exact'
              ? 'Textbook Already Exists'
              : 'Similar Textbook Found'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert variant="warning">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {duplicate.type === 'exact'
                ? 'This exact textbook has already been uploaded and processed.'
                : `A textbook with ${duplicate.similarity}% similarity exists.`}
            </AlertDescription>
          </Alert>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-sm">Existing Textbook</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Title:</strong> {duplicate.existing.title}</p>
                <p><strong>Pages:</strong> {duplicate.existing.pageCount}</p>
                <p><strong>Uploaded:</strong> {formatDate(duplicate.existing.uploadedAt)}</p>
                <p><strong>Used by:</strong> {duplicate.existing.usageCount} students</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => onResolution('use_existing')}
              className="glass-button"
            >
              <Link className="h-4 w-4 mr-2" />
              Use Existing Textbook
            </Button>

            {duplicate.type !== 'exact' && (
              <Button
                onClick={() => onResolution('upload_new')}
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload as New Version
              </Button>
            )}

            <Button
              onClick={() => onResolution('cancel')}
              variant="ghost"
            >
              Cancel Upload
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

## Success Metrics

### Primary KPIs
- **Duplicate Prevention Rate**: >95% of duplicate uploads detected
- **Storage Savings**: 30% reduction in storage costs
- **User Adoption**: 80% of users discover feature within first week
- **Upload Success Rate**: >95%
- **Processing Time**: <30 seconds for 100-page PDF

### Secondary KPIs
- **False Positive Rate**: <2% for duplicate detection
- **User Satisfaction**: >4.5/5 for upload experience
- **Mobile Upload Rate**: >40% of total uploads
- **Support Tickets**: <5% related to uploads

## Implementation Phases

### Phase 1: Navigation & Discovery (Day 1)
- [ ] Add Textbooks to main navigation
- [ ] Update mobile navigation
- [ ] Add analytics tracking
- [ ] Deploy navigation changes

### Phase 2: Duplicate Prevention Backend (Days 2-3)
- [ ] Implement hash generation
- [ ] Create duplicate detection service
- [ ] Update database schema
- [ ] Add fingerprint table
- [ ] Test duplicate detection accuracy

### Phase 3: Duplicate Resolution UI (Day 4)
- [ ] Build duplicate resolution modal
- [ ] Implement user choice flow
- [ ] Add duplicate warnings
- [ ] Create version management UI

### Phase 4: UI Enhancements (Day 5)
- [ ] Enhance upload progress indicators
- [ ] Add duplicate check stage
- [ ] Implement mobile optimizations
- [ ] Add success animations

### Phase 5: Testing & Polish (Day 6)
- [ ] End-to-end testing
- [ ] Performance testing with large PDFs
- [ ] Mobile device testing
- [ ] Documentation update

## Risk Analysis

### Technical Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|------------|------------|
| Hash collision | High | Low | Use SHA-256, add secondary checks |
| False positives | Medium | Medium | Implement similarity threshold tuning |
| Performance impact | Medium | Medium | Implement async processing, caching |
| Storage for hashes | Low | High | Minimal storage, ~64 bytes per textbook |

### Business Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|------------|------------|
| User frustration with blocks | High | Medium | Clear messaging, easy override option |
| Legitimate duplicates blocked | Medium | Low | Version management system |
| Reduced uploads | Low | Low | Better UX increases quality uploads |

## Security Considerations

### File Upload Security
```typescript
interface SecurityMeasures {
  validation: {
    fileType: 'strict';        // Only true PDFs
    maxSize: 'enforced';       // Server-side validation
    minSize: 'enforced';       // Prevent empty files
    virusScan: 'required';     // Scan before processing
  };

  storage: {
    isolation: 'user-scoped';  // Separate user spaces
    encryption: 'at-rest';     // Encrypted storage
    cdn: 'signed-urls';        // Time-limited access
  };

  processing: {
    sandboxed: true;           // Isolated processing
    timeout: 300000;           // 5-minute timeout
    memoryLimit: '512MB';      // Prevent DoS
  };
}
```

## Monitoring & Analytics

### Metrics to Track
```typescript
interface UploadAnalytics {
  events: {
    upload_started: number;
    duplicate_detected: number;
    duplicate_type: 'exact' | 'similar' | 'metadata';
    user_choice: 'use_existing' | 'upload_new' | 'cancel';
    upload_completed: number;
    processing_completed: number;
    processing_failed: number;
  };

  performance: {
    upload_duration: number;
    hash_generation_time: number;
    duplicate_check_time: number;
    processing_duration: number;
    total_time: number;
  };

  storage: {
    files_uploaded: number;
    duplicates_prevented: number;
    storage_saved_mb: number;
    cost_saved_usd: number;
  };
}
```

## Acceptance Criteria

### Must Have
- [ ] Textbooks visible in main navigation
- [ ] Duplicate detection with >95% accuracy
- [ ] User can choose to use existing textbook
- [ ] Mobile-responsive upload interface
- [ ] Clear duplicate warning messages
- [ ] Hash-based exact duplicate prevention

### Should Have
- [ ] Similarity-based near-duplicate detection
- [ ] Version management for textbooks
- [ ] Progress indicator for duplicate checking
- [ ] Batch upload with duplicate checking
- [ ] Admin override for duplicates

### Nice to Have
- [ ] OCR for scanned PDF comparison
- [ ] Auto-merge similar textbooks
- [ ] Duplicate detection for partial uploads
- [ ] ML-based content similarity
- [ ] Community sharing of textbooks

## References

### Existing Code
- Upload Form: `pinglearn-app/src/components/textbook/UploadForm.tsx`
- Processing Logic: `pinglearn-app/src/lib/textbook/processor.ts`
- Server Actions: `pinglearn-app/src/lib/textbook/actions.ts`
- Textbooks Page: `pinglearn-app/src/app/textbooks/`

### Design Assets
- Figma File: `pinglearn-app/docs/design/file-upload-ui/Upload File UI Kit.fig`
- Glass Morphism: `pinglearn-app/src/styles/glass-morphism.css`
- Wireframes: `pinglearn-app/public/upload-wireframe-responsive.html`

### Database Schema
- Tables: `textbooks`, `chapters`, `content_chunks`
- New: `textbook_fingerprints` table for duplicate detection
- Indexes: Content hash, title normalization

---

**Document Status**: `APPROVAL_PENDING`
**Next Action**: Review and approve for implementation
**Owner**: Product Team
**Technical Lead**: Engineering Team