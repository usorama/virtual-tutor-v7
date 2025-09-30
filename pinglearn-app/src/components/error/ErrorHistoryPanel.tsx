/**
 * Error History Panel
 * ERR-006: Error Monitoring Integration
 *
 * Displays a list of recent errors for debugging and support.
 * Allows filtering, sorting, and exporting error data.
 */

'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getUserFriendlyMessage, addBreadcrumb } from '@/lib/monitoring';
import type {
  EnrichedError,
  ErrorCategory,
  ErrorSeverity,
} from '@/lib/monitoring/types';
import {
  AlertCircle,
  Download,
  Filter,
  RefreshCw,
  Trash2,
  XCircle,
} from 'lucide-react';

interface ErrorHistoryPanelProps {
  errors: EnrichedError[];
  maxErrors?: number;
  onClear?: () => void;
  onRefresh?: () => void;
  onExport?: (errors: EnrichedError[]) => void;
  className?: string;
}

type SortOption = 'newest' | 'oldest' | 'severity';

export function ErrorHistoryPanel({
  errors,
  maxErrors = 50,
  onClear,
  onRefresh,
  onExport,
  className,
}: ErrorHistoryPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    ErrorCategory | 'all'
  >('all');
  const [selectedSeverity, setSelectedSeverity] = useState<
    ErrorSeverity | 'all'
  >('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null);

  // Filter and sort errors
  const filteredErrors = useMemo(() => {
    let filtered = errors;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((e) => e.category === selectedCategory);
    }

    // Filter by severity
    if (selectedSeverity !== 'all') {
      filtered = filtered.filter((e) => e.severity === selectedSeverity);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (b.timestamp || 0) - (a.timestamp || 0);
        case 'oldest':
          return (a.timestamp || 0) - (b.timestamp || 0);
        case 'severity':
          return getSeverityWeight(b.severity) - getSeverityWeight(a.severity);
        default:
          return 0;
      }
    });

    // Limit to maxErrors
    return sorted.slice(0, maxErrors);
  }, [errors, selectedCategory, selectedSeverity, sortBy, maxErrors]);

  const handleClear = () => {
    addBreadcrumb('Error history cleared');
    onClear?.();
  };

  const handleExport = () => {
    addBreadcrumb('Error history exported', {
      errorCount: filteredErrors.length,
    });
    onExport?.(filteredErrors);
  };

  const handleCopyErrorId = (errorId: string) => {
    navigator.clipboard.writeText(errorId);
    addBreadcrumb('Error ID copied', { errorId });
  };

  const toggleErrorDetails = (errorId: string) => {
    setExpandedErrorId(expandedErrorId === errorId ? null : errorId);
  };

  const getSeverityBadgeVariant = (
    severity: ErrorSeverity | undefined
  ): 'default' | 'destructive' | 'outline' => {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'outline';
    }
  };

  const formatTimestamp = (timestamp: number | undefined): string => {
    if (!timestamp) return 'Unknown time';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleString();
  };

  if (errors.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Error History</CardTitle>
          <CardDescription>No errors recorded</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
          <AlertCircle className="mb-2 h-12 w-12 opacity-50" />
          <p>All systems are working normally.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Error History</CardTitle>
            <CardDescription>
              {filteredErrors.length} of {errors.length} errors shown
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {onRefresh && (
              <Button
                onClick={onRefresh}
                variant="ghost"
                size="icon"
                title="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            {onExport && filteredErrors.length > 0 && (
              <Button
                onClick={handleExport}
                variant="ghost"
                size="icon"
                title="Export"
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
            {onClear && (
              <Button
                onClick={handleClear}
                variant="ghost"
                size="icon"
                title="Clear history"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Select
            value={selectedCategory}
            onValueChange={(v) => setSelectedCategory(v as ErrorCategory | 'all')}
          >
            <SelectTrigger className="w-[150px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="connection">Connection</SelectItem>
              <SelectItem value="api">API</SelectItem>
              <SelectItem value="validation">Validation</SelectItem>
              <SelectItem value="authentication">Authentication</SelectItem>
              <SelectItem value="authorization">Authorization</SelectItem>
              <SelectItem value="voice">Voice</SelectItem>
              <SelectItem value="transcription">Transcription</SelectItem>
              <SelectItem value="render">Render</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={selectedSeverity}
            onValueChange={(v) => setSelectedSeverity(v as ErrorSeverity | 'all')}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as SortOption)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="severity">By Severity</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Error list */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {filteredErrors.map((error) => (
              <div
                key={error.errorId}
                className="cursor-pointer rounded-lg border p-3 transition-colors hover:bg-muted/50"
                onClick={() => toggleErrorDetails(error.errorId || '')}
              >
                {/* Error summary */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 shrink-0 text-red-600" />
                      <span className="text-sm font-medium">
                        {getUserFriendlyMessage(error)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{formatTimestamp(error.timestamp)}</span>
                      {error.category && (
                        <Badge variant="outline" className="text-xs">
                          {error.category}
                        </Badge>
                      )}
                      {error.severity && (
                        <Badge
                          variant={getSeverityBadgeVariant(error.severity)}
                          className="text-xs"
                        >
                          {error.severity}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {expandedErrorId === error.errorId && (
                  <div className="mt-3 space-y-2 border-t pt-3 text-xs">
                    {error.errorId && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Error ID:</span>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyErrorId(error.errorId || '');
                          }}
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs font-mono"
                        >
                          {error.errorId.substring(0, 8)}...
                        </Button>
                      </div>
                    )}
                    {error.code && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Code:</span>
                        <span className="font-mono">{error.code}</span>
                      </div>
                    )}
                    {error.message && (
                      <div>
                        <span className="text-muted-foreground">Message:</span>
                        <p className="mt-1 font-mono text-xs">{error.message}</p>
                      </div>
                    )}
                    {error.context?.component && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Component:</span>
                        <span className="font-mono">
                          {error.context.component}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

/**
 * Get numeric weight for severity sorting
 */
function getSeverityWeight(severity: ErrorSeverity | undefined): number {
  switch (severity) {
    case 'critical':
      return 4;
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
    default:
      return 0;
  }
}