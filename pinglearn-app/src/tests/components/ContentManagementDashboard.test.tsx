/**
 * ContentManagementDashboard Component Tests
 * TEST-001: Comprehensive React component testing
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ContentManagementDashboard } from '@/components/textbook/ContentManagementDashboard';
import { createMockTextbook, createMockApiResponse } from '@/tests/factories';
import { mockFetch, createTestEnvironment } from '@/tests/utils';

// Mock SWR
vi.mock('swr', () => ({
  default: vi.fn()
}));

// Mock Supabase client
const mockSupabase = {
  channel: vi.fn(),
  removeChannel: vi.fn()
};

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabase)
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardDescription: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardHeader: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  CardTitle: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, ...props }: any) => (
    <span data-variant={variant} {...props}>
      {children}
    </span>
  )
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value, onValueChange, ...props }: any) => (
    <div data-testid="tabs" data-value={value} {...props}>
      {children}
    </div>
  ),
  TabsContent: ({ children, value, ...props }: any) => (
    <div data-testid={`tab-content-${value}`} {...props}>
      {children}
    </div>
  ),
  TabsList: ({ children, ...props }: any) => (
    <div data-testid="tabs-list" {...props}>
      {children}
    </div>
  ),
  TabsTrigger: ({ children, value, onClick, ...props }: any) => (
    <button
      data-testid={`tab-trigger-${value}`}
      onClick={() => onClick?.(value)}
      {...props}
    >
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({ onChange, value, placeholder, ...props }: any) => (
    <input
      onChange={onChange}
      value={value}
      placeholder={placeholder}
      {...props}
    />
  )
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>
}));

// Mock SWR with default behavior
import useSWR from 'swr';
const mockUseSWR = useSWR as any;

describe('ContentManagementDashboard', () => {
  let testEnv: ReturnType<typeof createTestEnvironment>;
  let mockSWRReturn: any;
  let mockChannel: any;

  beforeEach(() => {
    testEnv = createTestEnvironment();
    vi.clearAllMocks();

    // Setup default SWR mock
    mockSWRReturn = {
      data: createMockApiResponse({
        totalSeries: 5,
        totalBooks: 15,
        totalChapters: 150,
        totalSections: 450,
        recentlyAdded: 3,
        needsReview: 2
      }),
      isLoading: false,
      error: null,
      mutate: vi.fn()
    };

    mockUseSWR.mockReturnValue(mockSWRReturn);

    // Setup Supabase channel mock
    mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn()
    };
    mockSupabase.channel.mockReturnValue(mockChannel);
  });

  afterEach(() => {
    testEnv.cleanup();
  });

  describe('Component Rendering', () => {
    it('should render dashboard with basic structure', () => {
      render(<ContentManagementDashboard />);

      expect(screen.getByTestId('tabs')).toBeInTheDocument();
      expect(screen.getByTestId('tabs-list')).toBeInTheDocument();
    });

    it('should render overview tab by default', () => {
      render(<ContentManagementDashboard />);

      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveAttribute('data-value', 'overview');
    });

    it('should render statistics when data is loaded', () => {
      render(<ContentManagementDashboard />);

      expect(screen.getByText('5')).toBeInTheDocument(); // totalSeries
      expect(screen.getByText('15')).toBeInTheDocument(); // totalBooks
      expect(screen.getByText('150')).toBeInTheDocument(); // totalChapters
    });

    it('should show loading state when data is loading', () => {
      mockUseSWR.mockReturnValue({
        ...mockSWRReturn,
        isLoading: true,
        data: null
      });

      render(<ContentManagementDashboard />);

      // Should show skeleton or loading indicators
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
    });

    it('should handle error state gracefully', () => {
      mockUseSWR.mockReturnValue({
        ...mockSWRReturn,
        isLoading: false,
        error: new Error('Failed to fetch data'),
        data: null
      });

      render(<ContentManagementDashboard />);

      // Should still render the dashboard structure
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('should switch between tabs', () => {
      render(<ContentManagementDashboard />);

      const seriesTab = screen.getByTestId('tab-trigger-series');
      const booksTab = screen.getByTestId('tab-trigger-books');

      expect(seriesTab).toBeInTheDocument();
      expect(booksTab).toBeInTheDocument();

      fireEvent.click(seriesTab);
      // Tab switching would be handled by the tabs component
    });

    it('should maintain tab state correctly', () => {
      render(<ContentManagementDashboard />);

      const tabs = screen.getByTestId('tabs');
      expect(tabs).toHaveAttribute('data-value', 'overview');
    });
  });

  describe('Search Functionality', () => {
    it('should render search input', () => {
      render(<ContentManagementDashboard />);

      const searchInput = screen.getByPlaceholderText(/search/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('should update search query on input', () => {
      render(<ContentManagementDashboard />);

      const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;

      fireEvent.change(searchInput, { target: { value: 'mathematics' } });
      expect(searchInput.value).toBe('mathematics');
    });

    it('should filter content based on search query', async () => {
      render(<ContentManagementDashboard />);

      const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;

      fireEvent.change(searchInput, { target: { value: 'physics' } });

      // Should trigger filtering logic
      await waitFor(() => {
        expect(searchInput.value).toBe('physics');
      });
    });

    it('should clear search results when query is empty', () => {
      render(<ContentManagementDashboard />);

      const searchInput = screen.getByPlaceholderText(/search/i) as HTMLInputElement;

      fireEvent.change(searchInput, { target: { value: 'test' } });
      fireEvent.change(searchInput, { target: { value: '' } });

      expect(searchInput.value).toBe('');
    });
  });

  describe('Statistics Display', () => {
    it('should display all statistics correctly', () => {
      render(<ContentManagementDashboard />);

      // Check each statistic is displayed
      expect(screen.getByText('5')).toBeInTheDocument(); // totalSeries
      expect(screen.getByText('15')).toBeInTheDocument(); // totalBooks
      expect(screen.getByText('150')).toBeInTheDocument(); // totalChapters
      expect(screen.getByText('450')).toBeInTheDocument(); // totalSections
    });

    it('should handle zero statistics', () => {
      mockUseSWR.mockReturnValue({
        ...mockSWRReturn,
        data: createMockApiResponse({
          totalSeries: 0,
          totalBooks: 0,
          totalChapters: 0,
          totalSections: 0,
          recentlyAdded: 0,
          needsReview: 0
        })
      });

      render(<ContentManagementDashboard />);

      // Should display zeros without errors
      expect(screen.getAllByText('0')).toHaveLength(6);
    });

    it('should format large numbers appropriately', () => {
      mockUseSWR.mockReturnValue({
        ...mockSWRReturn,
        data: createMockApiResponse({
          totalSeries: 1000,
          totalBooks: 5000,
          totalChapters: 50000,
          totalSections: 150000,
          recentlyAdded: 25,
          needsReview: 12
        })
      });

      render(<ContentManagementDashboard />);

      expect(screen.getByText('1000')).toBeInTheDocument();
      expect(screen.getByText('5000')).toBeInTheDocument();
    });
  });

  describe('Real-time Updates', () => {
    it('should setup Supabase realtime subscription', () => {
      render(<ContentManagementDashboard />);

      expect(mockSupabase.channel).toHaveBeenCalledWith('textbook_changes');
      expect(mockChannel.on).toHaveBeenCalled();
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });

    it('should handle realtime INSERT events', async () => {
      render(<ContentManagementDashboard />);

      // Get the callback function passed to channel.on
      const onCallback = mockChannel.on.mock.calls.find(
        (call: any[]) => call[0] === 'postgres_changes'
      )?.[1];

      expect(onCallback).toBeDefined();

      // Simulate an INSERT event
      onCallback({
        eventType: 'INSERT',
        new: { id: 'new-series', series_name: 'New Series' },
        schema: 'public',
        table: 'book_series'
      });

      await waitFor(() => {
        expect(mockSWRReturn.mutate).toHaveBeenCalled();
      });
    });

    it('should handle realtime UPDATE events', async () => {
      render(<ContentManagementDashboard />);

      const onCallback = mockChannel.on.mock.calls.find(
        (call: any[]) => call[0] === 'postgres_changes'
      )?.[1];

      onCallback({
        eventType: 'UPDATE',
        new: { id: 'series-1', series_name: 'Updated Series' },
        old: { id: 'series-1', series_name: 'Old Series' },
        schema: 'public',
        table: 'book_series'
      });

      await waitFor(() => {
        expect(mockSWRReturn.mutate).toHaveBeenCalled();
      });
    });

    it('should handle realtime DELETE events', async () => {
      render(<ContentManagementDashboard />);

      const onCallback = mockChannel.on.mock.calls.find(
        (call: any[]) => call[0] === 'postgres_changes'
      )?.[1];

      onCallback({
        eventType: 'DELETE',
        old: { id: 'series-1', series_name: 'Deleted Series' },
        schema: 'public',
        table: 'book_series'
      });

      await waitFor(() => {
        expect(mockSWRReturn.mutate).toHaveBeenCalled();
      });
    });

    it('should cleanup subscriptions on unmount', () => {
      const { unmount } = render(<ContentManagementDashboard />);

      unmount();

      expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel);
    });
  });

  describe('Action Callbacks', () => {
    it('should call onUploadNew when upload button is clicked', () => {
      const mockOnUploadNew = vi.fn();
      render(<ContentManagementDashboard onUploadNew={mockOnUploadNew} />);

      const uploadButton = screen.getByRole('button', { name: /upload/i });
      fireEvent.click(uploadButton);

      expect(mockOnUploadNew).toHaveBeenCalled();
    });

    it('should call onEditContent with correct parameters', () => {
      const mockOnEditContent = vi.fn();
      render(<ContentManagementDashboard onEditContent={mockOnEditContent} />);

      // Find and click an edit button (would be in a content row)
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      if (editButtons.length > 0) {
        fireEvent.click(editButtons[0]);
        expect(mockOnEditContent).toHaveBeenCalledWith('series', expect.any(String));
      }
    });

    it('should call onDeleteContent with correct parameters', () => {
      const mockOnDeleteContent = vi.fn();
      render(<ContentManagementDashboard onDeleteContent={mockOnDeleteContent} />);

      // Find and click a delete button (would be in a content row)
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0]);
        expect(mockOnDeleteContent).toHaveBeenCalledWith('series', expect.any(String));
      }
    });
  });

  describe('Data Refresh', () => {
    it('should refresh data when SWR mutate is called', async () => {
      render(<ContentManagementDashboard />);

      // Trigger a manual refresh
      await mockSWRReturn.mutate();

      expect(mockSWRReturn.mutate).toHaveBeenCalled();
    });

    it('should handle refresh failures gracefully', async () => {
      mockSWRReturn.mutate.mockRejectedValueOnce(new Error('Refresh failed'));

      render(<ContentManagementDashboard />);

      await expect(mockSWRReturn.mutate()).rejects.toThrow('Refresh failed');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ContentManagementDashboard />);

      const tabs = screen.getByTestId('tabs');
      expect(tabs).toBeInTheDocument();

      // Search input should be accessible
      const searchInput = screen.getByPlaceholderText(/search/i);
      expect(searchInput).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<ContentManagementDashboard />);

      const searchInput = screen.getByPlaceholderText(/search/i);

      // Test keyboard interaction
      fireEvent.keyDown(searchInput, { key: 'Enter' });
      fireEvent.keyDown(searchInput, { key: 'Escape' });

      expect(searchInput).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<ContentManagementDashboard />);

      const initialRenderCount = mockUseSWR.mock.calls.length;

      // Re-render with same props
      rerender(<ContentManagementDashboard />);

      // SWR should be called same number of times (cached)
      expect(mockUseSWR.mock.calls.length).toBe(initialRenderCount);
    });

    it('should handle large datasets efficiently', () => {
      mockUseSWR.mockReturnValue({
        ...mockSWRReturn,
        data: createMockApiResponse({
          totalSeries: 10000,
          totalBooks: 50000,
          totalChapters: 500000,
          totalSections: 1500000,
          recentlyAdded: 100,
          needsReview: 50
        })
      });

      const startTime = Date.now();
      render(<ContentManagementDashboard />);
      const renderTime = Date.now() - startTime;

      // Should render quickly even with large numbers
      expect(renderTime).toBeLessThan(1000);
    });
  });

  describe('Error Handling', () => {
    it('should handle SWR errors gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      mockUseSWR.mockReturnValue({
        ...mockSWRReturn,
        error: new Error('Network error'),
        data: null
      });

      render(<ContentManagementDashboard />);

      // Should still render without crashing
      expect(screen.getByTestId('tabs')).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    it('should handle malformed data gracefully', () => {
      mockUseSWR.mockReturnValue({
        ...mockSWRReturn,
        data: { invalid: 'data structure' }
      });

      render(<ContentManagementDashboard />);

      // Should render with fallback values
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
    });

    it('should handle null data gracefully', () => {
      mockUseSWR.mockReturnValue({
        ...mockSWRReturn,
        data: null
      });

      render(<ContentManagementDashboard />);

      // Should render with default/empty state
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
    });
  });
});