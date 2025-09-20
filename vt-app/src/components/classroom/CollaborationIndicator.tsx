'use client';

import { useState, useEffect, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Users,
  Wifi,
  WifiOff,
  User,
  Crown,
  Circle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Collaborator {
  id: string;
  name: string;
  color: string;
  avatar: string;
  isOnline: boolean;
  lastSeen: Date;
  role: 'student' | 'teacher' | 'tutor';
  cursor?: {
    x: number;
    y: number;
  };
}

interface CollaborationIndicatorProps {
  collaborators: string[];
  sessionId: string;
  className?: string;
}

export function CollaborationIndicator({
  collaborators,
  sessionId,
  className
}: CollaborationIndicatorProps) {
  // State
  const [activeCollaborators, setActiveCollaborators] = useState<Collaborator[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');
  const [showDetails, setShowDetails] = useState(false);

  /**
   * Initialize collaboration data
   */
  const initializeCollaboration = useCallback(() => {
    // Mock data for demonstration - in real app this would come from Supabase real-time
    const mockCollaborators: Collaborator[] = [
      {
        id: 'tutor-ai',
        name: 'AI Tutor',
        color: '#3b82f6',
        avatar: 'AT',
        isOnline: true,
        lastSeen: new Date(),
        role: 'tutor'
      },
      {
        id: 'student-1',
        name: 'Student',
        color: '#22c55e',
        avatar: 'S',
        isOnline: true,
        lastSeen: new Date(),
        role: 'student'
      }
    ];

    setActiveCollaborators(mockCollaborators);
  }, []);

  /**
   * Handle collaborator cursor movement
   */
  const updateCollaboratorCursor = useCallback((collaboratorId: string, position: { x: number; y: number }) => {
    setActiveCollaborators(prev =>
      prev.map(collab =>
        collab.id === collaboratorId
          ? { ...collab, cursor: position, lastSeen: new Date() }
          : collab
      )
    );
  }, []);

  /**
   * Handle collaborator status changes
   */
  const updateCollaboratorStatus = useCallback((collaboratorId: string, isOnline: boolean) => {
    setActiveCollaborators(prev =>
      prev.map(collab =>
        collab.id === collaboratorId
          ? { ...collab, isOnline, lastSeen: new Date() }
          : collab
      )
    );
  }, []);

  /**
   * Format last seen time
   */
  const formatLastSeen = useCallback((lastSeen: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;

    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ago`;
  }, []);

  /**
   * Get role icon
   */
  const getRoleIcon = useCallback((role: string) => {
    switch (role) {
      case 'teacher':
      case 'tutor':
        return Crown;
      default:
        return User;
    }
  }, []);

  /**
   * Get connection status color
   */
  const getConnectionColor = useCallback((status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
        return 'text-yellow-500';
      case 'disconnected':
        return 'text-red-500';
      default:
        return 'text-muted-foreground';
    }
  }, []);

  /**
   * Initialize on mount
   */
  useEffect(() => {
    initializeCollaboration();

    // Simulate connection status changes
    const statusInterval = setInterval(() => {
      setConnectionStatus(prev =>
        prev === 'connected' ? 'connected' : 'connected'
      );
    }, 30000);

    return () => clearInterval(statusInterval);
  }, [initializeCollaboration]);

  /**
   * Update last seen timestamps
   */
  useEffect(() => {
    const updateInterval = setInterval(() => {
      setActiveCollaborators(prev => [...prev]); // Trigger re-render for time updates
    }, 60000); // Update every minute

    return () => clearInterval(updateInterval);
  }, []);

  const onlineCount = activeCollaborators.filter(c => c.isOnline).length;
  const totalCount = activeCollaborators.length;

  return (
    <div className={cn("absolute top-4 left-4 z-40", className)}>
      <Card className="bg-background/95 backdrop-blur-sm border shadow-lg">
        <CardContent className="p-3">
          {/* Main Indicator */}
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => setShowDetails(!showDetails)}
          >
            {/* Connection Status */}
            <div className="flex items-center gap-1">
              {connectionStatus === 'connected' ? (
                <Wifi className={cn("h-4 w-4", getConnectionColor(connectionStatus))} />
              ) : (
                <WifiOff className={cn("h-4 w-4", getConnectionColor(connectionStatus))} />
              )}
            </div>

            {/* Collaborator Count */}
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {onlineCount}/{totalCount}
              </span>
            </div>

            {/* Online Indicators */}
            <div className="flex -space-x-1">
              {activeCollaborators
                .filter(c => c.isOnline)
                .slice(0, 3)
                .map((collaborator) => {
                  const RoleIcon = getRoleIcon(collaborator.role);

                  return (
                    <div
                      key={collaborator.id}
                      className="relative"
                    >
                      <div
                        className="w-6 h-6 rounded-full border-2 border-background flex items-center justify-center text-xs font-semibold text-white shadow-sm"
                        style={{ backgroundColor: collaborator.color }}
                        title={`${collaborator.name} (${collaborator.role})`}
                      >
                        {collaborator.avatar}
                      </div>

                      {/* Role indicator */}
                      {collaborator.role !== 'student' && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center">
                          <RoleIcon className="h-2 w-2 text-white" />
                        </div>
                      )}

                      {/* Online status */}
                      <div className="absolute -bottom-0.5 -right-0.5">
                        <Circle className="h-2.5 w-2.5 fill-green-500 text-green-500" />
                      </div>
                    </div>
                  );
                })}

              {/* Overflow indicator */}
              {onlineCount > 3 && (
                <div className="w-6 h-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-semibold shadow-sm">
                  +{onlineCount - 3}
                </div>
              )}
            </div>

            {/* Session Status */}
            <Badge variant="outline" className="text-xs">
              Live
            </Badge>
          </div>

          {/* Detailed View */}
          {showDetails && (
            <div className="mt-3 pt-3 border-t space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                Session: {sessionId.slice(0, 8)}...
              </div>

              {/* Collaborator List */}
              <div className="space-y-1">
                {activeCollaborators.map((collaborator) => {
                  const RoleIcon = getRoleIcon(collaborator.role);

                  return (
                    <div
                      key={collaborator.id}
                      className="flex items-center gap-2 text-xs"
                    >
                      {/* Avatar */}
                      <div
                        className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                        style={{ backgroundColor: collaborator.color }}
                      >
                        {collaborator.avatar}
                      </div>

                      {/* Name and Role */}
                      <div className="flex-1 flex items-center gap-1">
                        <span className="font-medium">{collaborator.name}</span>
                        {collaborator.role !== 'student' && (
                          <RoleIcon className="h-3 w-3 text-yellow-500" />
                        )}
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-1">
                        <Circle
                          className={cn(
                            "h-2 w-2",
                            collaborator.isOnline
                              ? "fill-green-500 text-green-500"
                              : "fill-gray-400 text-gray-400"
                          )}
                        />
                        <span className="text-muted-foreground">
                          {collaborator.isOnline ? 'Online' : formatLastSeen(collaborator.lastSeen)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Connection Info */}
              <div className="pt-2 border-t text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Connection:</span>
                  <span className={cn("font-medium", getConnectionColor(connectionStatus))}>
                    {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}