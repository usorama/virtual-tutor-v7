# BulkUpload Components

**Feature**: FS-00-AC - Textbook Multi-Chapter Collection Management System
**Purpose**: Modular components for multi-file PDF upload with intelligent auto-grouping

---

## Components

### UploadZone
Drag-and-drop file upload zone with visual feedback.

```typescript
<UploadZone
  onFilesSelected={(files) => handleFiles(files)}
  maxFiles={50}
  maxFileSize={100}
/>
```

### FileGroupingInterface
Displays auto-detected file groups with manual override capabilities.

```typescript
<FileGroupingInterface
  fileGroups={groups}
  onGroupNameUpdate={(id, name) => updateGroup(id, name)}
  onFileRemoveFromGroup={(groupId, fileId) => removeFile(groupId, fileId)}
  onGroupDelete={(id) => deleteGroup(id)}
  onNewGroupCreate={() => createGroup()}
/>
```

### BatchProcessingView
Real-time progress tracking for batch file processing.

```typescript
<BatchProcessingView
  processingState={state}
  onCancel={() => cancelProcessing()}
  onPause={() => pauseProcessing()}
  onResume={() => resumeProcessing()}
/>
```

---

## Features

- ✅ Drag-and-drop file upload
- ✅ Auto-detection of file groups
- ✅ Manual group editing
- ✅ Confidence score display
- ✅ Real-time progress tracking
- ✅ Error handling and recovery
- ✅ TypeScript strict mode
- ✅ Fully accessible

---

See full documentation: `/docs/change_records/feature_changes/FC-00-AC-B4-UPLOAD-DASHBOARD.md`
