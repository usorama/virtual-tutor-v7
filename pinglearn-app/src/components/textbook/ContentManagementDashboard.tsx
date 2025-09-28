/**
 * FS-00-AC: Hierarchical Content Management Dashboard
 *
 * This component provides a comprehensive interface for managing the hierarchical
 * textbook structure (Series → Books → Chapters), allowing administrators to
 * view, organize, and maintain the content collection.
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Search,
  Book as BookIcon,
  BookOpen,
  FileText,
  Users,
  Filter,
  MoreHorizontal,
  Edit3,
  Trash2,
  Upload,
  Download,
  Settings,
  BarChart3,
  Library
} from 'lucide-react';

import type {
  BookSeries,
  Book,
  BookChapter,
  CurriculumStandard
} from '@/types/textbook-hierarchy';

// ==================================================
// TYPE DEFINITIONS FOR DASHBOARD
// ==================================================

interface ContentStats {
  totalSeries: number;
  totalBooks: number;
  totalChapters: number;
  totalSections: number;
  recentlyAdded: number;
  needsReview: number;
}

interface SeriesWithBooks extends BookSeries {
  books_extended: BookWithChapters[];
  bookCount: number;
  chapterCount: number;
  lastUpdated: Date;
}

interface BookWithChapters extends Book {
  chapters: BookChapter[];
  chapterCount: number;
  processingStatus: 'completed' | 'processing' | 'failed' | 'pending';
}

interface FilterState {
  searchQuery: string;
  curriculum: CurriculumStandard | 'all';
  educationLevel: string | 'all';
  grade: number | 'all';
  subject: string;
  status: 'all' | 'completed' | 'processing' | 'failed' | 'pending';
}

// ==================================================
// MAIN DASHBOARD COMPONENT
// ==================================================

interface ContentManagementDashboardProps {
  onUploadNew?: () => void;
  onEditContent?: (type: 'series' | 'book' | 'chapter', id: string) => void;
  onDeleteContent?: (type: 'series' | 'book' | 'chapter', id: string) => void;
}

export function ContentManagementDashboard({
  onUploadNew,
  onEditContent,
  onDeleteContent
}: ContentManagementDashboardProps) {
  // ==================================================
  // STATE MANAGEMENT
  // ==================================================

  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - replace with actual API calls
  const [stats, setStats] = useState<ContentStats>({
    totalSeries: 0,
    totalBooks: 0,
    totalChapters: 0,
    totalSections: 0,
    recentlyAdded: 0,
    needsReview: 0
  });

  const [series, setSeries] = useState<SeriesWithBooks[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    curriculum: 'all',
    educationLevel: 'all',
    grade: 'all',
    subject: '',
    status: 'all'
  });

  // ==================================================
  // DATA LOADING
  // ==================================================

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);

    try {
      // TODO: Replace with actual API calls
      // This would typically fetch from your Supabase database
      await loadContentStats();
      await loadSeriesData();
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadContentStats = async () => {
    // Mock implementation - replace with actual Supabase query
    setStats({
      totalSeries: 12,
      totalBooks: 45,
      totalChapters: 342,
      totalSections: 1284,
      recentlyAdded: 8,
      needsReview: 3
    });
  };

  const loadSeriesData = async () => {
    // Mock implementation - replace with actual Supabase query
    const mockSeries: SeriesWithBooks[] = [
      {
        id: '1',
        series_name: 'NCERT Mathematics',
        publisher: 'National Council of Educational Research and Training',
        curriculum_standard: 'NCERT',
        grade: 10,
        subject: 'Mathematics',
        description: 'Complete Mathematics curriculum for Grade 10',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-09-15T00:00:00Z',
        books_extended: [],
        bookCount: 3,
        chapterCount: 24,
        lastUpdated: new Date('2024-09-15')
      }
    ];

    setSeries(mockSeries);
  };

  // ==================================================
  // FILTERING AND SEARCH
  // ==================================================

  const filteredSeries = series.filter(seriesItem => {
    const matchesSearch = searchQuery === '' ||
      seriesItem.series_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seriesItem.publisher.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seriesItem.subject.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCurriculum = filters.curriculum === 'all' ||
      seriesItem.curriculum_standard === filters.curriculum;

    const matchesGrade = filters.grade === 'all' ||
      seriesItem.grade === filters.grade;

    const matchesSubject = filters.subject === '' ||
      seriesItem.subject.toLowerCase().includes(filters.subject.toLowerCase());

    return matchesSearch && matchesCurriculum && matchesGrade && matchesSubject;
  });

  // ==================================================
  // RENDER COMPONENTS
  // ==================================================

  const renderStatsOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Series</CardTitle>
          <Library className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalSeries}</div>
          <p className="text-xs text-muted-foreground">
            +2 from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Books</CardTitle>
          <BookIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalBooks}</div>
          <p className="text-xs text-muted-foreground">
            +5 from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Chapters</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalChapters}</div>
          <p className="text-xs text-muted-foreground">
            +28 from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sections</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalSections}</div>
          <p className="text-xs text-muted-foreground">
            +156 from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recently Added</CardTitle>
          <Upload className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.recentlyAdded}</div>
          <p className="text-xs text-muted-foreground">
            In the last 7 days
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Needs Review</CardTitle>
          <Settings className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.needsReview}</div>
          <p className="text-xs text-muted-foreground">
            Require attention
          </p>
        </CardContent>
      </Card>
    </div>
  );

  const renderSeriesList = () => (
    <div className="space-y-4">
      {filteredSeries.map(seriesItem => (
        <Card key={seriesItem.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <CardTitle className="text-xl">{seriesItem.series_name}</CardTitle>
                <CardDescription>
                  {seriesItem.publisher} • {seriesItem.subject} • Grade {seriesItem.grade}
                </CardDescription>
                <div className="flex gap-2">
                  <Badge variant="outline">{seriesItem.curriculum_standard}</Badge>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditContent?.('series', seriesItem.id)}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteContent?.('series', seriesItem.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium">{seriesItem.bookCount}</div>
                <div className="text-muted-foreground">Books</div>
              </div>
              <div>
                <div className="font-medium">{seriesItem.chapterCount}</div>
                <div className="text-muted-foreground">Chapters</div>
              </div>
              <div>
                <div className="font-medium">
                  {seriesItem.lastUpdated.toLocaleDateString()}
                </div>
                <div className="text-muted-foreground">Last Updated</div>
              </div>
            </div>

            {seriesItem.description && (
              <p className="text-sm text-muted-foreground mt-3">
                {seriesItem.description}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderFilters = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search series, publishers, subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="curriculum">Curriculum</Label>
          <select
            id="curriculum"
            value={filters.curriculum}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              curriculum: e.target.value as FilterState['curriculum']
            }))}
            className="w-full mt-1 px-3 py-2 border border-input rounded-md"
          >
            <option value="all">All Curricula</option>
            <option value="NCERT">NCERT</option>
            <option value="CBSE">CBSE</option>
            <option value="ICSE">ICSE</option>
            <option value="State Board">State Board</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            placeholder="Filter by subject..."
            value={filters.subject}
            onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
          />
        </div>

        <Button
          variant="outline"
          onClick={() => {
            setSearchQuery('');
            setFilters({
              searchQuery: '',
              curriculum: 'all',
              educationLevel: 'all',
              grade: 'all',
              subject: '',
              status: 'all'
            });
          }}
          className="w-full"
        >
          Clear Filters
        </Button>
      </CardContent>
    </Card>
  );

  // ==================================================
  // MAIN RENDER
  // ==================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Content Management Dashboard
          </h1>
          <p className="text-lg text-gray-600 mt-1">
            Manage your hierarchical textbook collection
          </p>
        </div>
        <Button onClick={onUploadNew} className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Upload New Content
        </Button>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="series">Series</TabsTrigger>
          <TabsTrigger value="books">Books</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderStatsOverview()}
        </TabsContent>

        <TabsContent value="series" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              {renderFilters()}
            </div>
            <div className="lg:col-span-3">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">
                    Book Series ({filteredSeries.length})
                  </h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Reports
                    </Button>
                  </div>
                </div>
                {renderSeriesList()}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="books" className="mt-6">
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Book Management</h3>
            <p className="mt-1 text-sm text-gray-500">
              Individual book management interface coming soon
            </p>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Analytics Dashboard</h3>
            <p className="mt-1 text-sm text-gray-500">
              Detailed analytics and reporting coming soon
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}