/**
 * Textbook Management Dashboard Page
 * This page shows the hierarchical content management dashboard
 */

'use client';

import { useRouter } from 'next/navigation';
import { ContentManagementDashboard } from '@/components/textbook/ContentManagementDashboard';

export default function TextbookManagementPage() {
  const router = useRouter();

  const handleUploadNew = () => {
    // Navigate to the upload page
    router.push('/textbooks/upload');
  };

  const handleEditContent = (type: 'series' | 'book' | 'chapter', id: string) => {
    console.log(`Edit ${type} with ID: ${id}`);
    // TODO: Implement edit functionality
    alert(`Edit functionality for ${type} will be implemented soon!`);
  };

  const handleDeleteContent = (type: 'series' | 'book' | 'chapter', id: string) => {
    console.log(`Delete ${type} with ID: ${id}`);
    // TODO: Implement delete functionality
    if (confirm(`Are you sure you want to delete this ${type}?`)) {
      alert(`Delete functionality for ${type} will be implemented soon!`);
    }
  };

  return (
    <ContentManagementDashboard
      onUploadNew={handleUploadNew}
      onEditContent={handleEditContent}
      onDeleteContent={handleDeleteContent}
    />
  );
}