'use client';

import { useState } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';
import { TeacherWhiteboard } from '@/components/whiteboard-fabric/TeacherWhiteboard';
import { StudentWhiteboard } from '@/components/whiteboard-fabric/StudentWhiteboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  Users,
  Info,
  CheckCircle2,
  DollarSign,
  Zap,
  Shield
} from 'lucide-react';

export default function WhiteboardDemoPage() {
  const [role, setRole] = useState<'teacher' | 'student' | null>(null);
  const [roomToken, setRoomToken] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Demo LiveKit URL (you'll need to replace with actual URL)
  const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://your-livekit-server.com';

  /**
   * Start demo session
   */
  const startDemo = async (selectedRole: 'teacher' | 'student') => {
    setIsConnecting(true);
    setError(null);

    try {
      // In a real app, you'd get these tokens from your backend
      // For demo purposes, we'll simulate getting a token
      const response = await fetch('/api/livekit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create-room',
          role: selectedRole,
          roomName: 'whiteboard-demo',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get room token');
      }

      const data = await response.json();
      setRoomToken(data.token);
      setRole(selectedRole);
    } catch (err) {
      console.error('Error starting demo:', err);
      setError('Failed to start demo. Please check your LiveKit configuration.');
      // For demo purposes, set a mock token
      setRole(selectedRole);
      setRoomToken('mock-token');
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Reset demo
   */
  const resetDemo = () => {
    setRole(null);
    setRoomToken(null);
    setError(null);
  };

  // If role is selected and we have a token, show the whiteboard
  if (role && roomToken) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted p-4">
        <div className="max-w-7xl mx-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Fabric.js Whiteboard Demo</h1>
              <p className="text-muted-foreground">
                Role: <Badge variant="outline">{role === 'teacher' ? 'Teacher' : 'Student'}</Badge>
              </p>
            </div>
            <Button onClick={resetDemo} variant="outline">
              Exit Demo
            </Button>
          </div>

          {/* LiveKit Room */}
          <LiveKitRoom
            token={roomToken}
            serverUrl={LIVEKIT_URL}
            connect={true}
            audio={true}
            video={false}
          >
            {role === 'teacher' ? (
              <TeacherWhiteboard />
            ) : (
              <StudentWhiteboard />
            )}
          </LiveKitRoom>
        </div>
      </div>
    );
  }

  // Show selection screen
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="max-w-6xl w-full space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Fabric.js Whiteboard Prototype
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A cost-effective alternative to tldraw using Fabric.js + LiveKit streaming
          </p>
        </div>

        {/* Comparison Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cost Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* tldraw Cost */}
              <div className="space-y-2">
                <h3 className="font-semibold text-red-600">tldraw (Current)</h3>
                <ul className="space-y-1 text-sm">
                  <li>• $6,000/year for 10+ users</li>
                  <li>• Watermark on free tier</li>
                  <li>• User limits apply</li>
                  <li>• Collaboration features (not needed)</li>
                </ul>
              </div>

              {/* Fabric.js Cost */}
              <div className="space-y-2">
                <h3 className="font-semibold text-green-600">Fabric.js (This Demo)</h3>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    $0/year (MIT License)
                  </li>
                  <li className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    No watermarks
                  </li>
                  <li className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Unlimited users
                  </li>
                  <li className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Perfect for one-way broadcast
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-yellow-500 mb-2" />
              <CardTitle>LiveKit Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Seamlessly streams canvas content using existing LiveKit infrastructure
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle>Teacher-Only Control</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Perfect for classroom scenarios where only teachers need drawing access
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-green-500 mb-2" />
              <CardTitle>Unlimited Students</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                No user limits - support as many students as your infrastructure allows
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Role Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Your Role</CardTitle>
            <CardDescription>
              Choose whether to demo as a teacher (can draw) or student (view only)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="teacher" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="teacher">Teacher</TabsTrigger>
                <TabsTrigger value="student">Student</TabsTrigger>
              </TabsList>

              <TabsContent value="teacher" className="space-y-4">
                <Alert>
                  <GraduationCap className="h-4 w-4" />
                  <AlertTitle>Teacher Mode</AlertTitle>
                  <AlertDescription>
                    As a teacher, you can:
                    <ul className="mt-2 list-disc list-inside space-y-1">
                      <li>Draw with pen, shapes, and text tools</li>
                      <li>Load Class X Math Chapter 1 content</li>
                      <li>Stream your whiteboard to students</li>
                      <li>Clear and manage the canvas</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={() => startDemo('teacher')}
                  disabled={isConnecting}
                  size="lg"
                  className="w-full"
                >
                  {isConnecting ? 'Connecting...' : 'Start as Teacher'}
                </Button>
              </TabsContent>

              <TabsContent value="student" className="space-y-4">
                <Alert>
                  <Users className="h-4 w-4" />
                  <AlertTitle>Student Mode</AlertTitle>
                  <AlertDescription>
                    As a student, you can:
                    <ul className="mt-2 list-disc list-inside space-y-1">
                      <li>View the teacher's whiteboard in real-time</li>
                      <li>See all drawings and annotations</li>
                      <li>Follow along with the lesson</li>
                      <li>No drawing permissions (view-only)</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={() => startDemo('student')}
                  disabled={isConnecting}
                  size="lg"
                  className="w-full"
                >
                  {isConnecting ? 'Connecting...' : 'Start as Student'}
                </Button>
              </TabsContent>
            </Tabs>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Success Criteria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Success Criteria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p className="font-semibold">✅ This demo is successful if:</p>
              <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                <li>Teacher can draw and annotate freely</li>
                <li>Students receive the video stream in real-time</li>
                <li>Class X Math Chapter 1 content displays correctly</li>
                <li>No watermarks or user limitations</li>
                <li>Works with existing LiveKit infrastructure</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}