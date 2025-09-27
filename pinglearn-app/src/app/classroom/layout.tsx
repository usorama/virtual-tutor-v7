'use client';

import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { useEffect } from 'react';
import './classroom.css';

export default function ClassroomLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Lock scrolling when classroom is mounted
  useEffect(() => {
    // Add overflow lock to html and body when classroom is active
    document.documentElement.classList.add('classroom-lock');
    document.body.classList.add('classroom-lock');

    // Cleanup: Remove overflow lock when leaving classroom
    return () => {
      document.documentElement.classList.remove('classroom-lock');
      document.body.classList.remove('classroom-lock');
    };
  }, []);

  return (
    <AuthenticatedLayout>
      <div className="classroom-container">
        {children}
      </div>
    </AuthenticatedLayout>
  );
}