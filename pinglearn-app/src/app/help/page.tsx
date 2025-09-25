import { AuthenticatedLayout } from '@/components/layout/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, BookOpen, Headphones, Mail } from 'lucide-react';

export default function HelpPage() {
  return (
    <AuthenticatedLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Help & Support</h1>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Live Chat
              </CardTitle>
              <CardDescription>
                Get instant help from our support team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Available Monday-Friday, 9 AM - 6 PM IST
              </p>
              <button className="text-primary hover:underline">
                Start Chat →
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                User Guide
              </CardTitle>
              <CardDescription>
                Learn how to use PingLearn effectively
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Step-by-step tutorials and tips
              </p>
              <button className="text-primary hover:underline">
                View Guide →
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Headphones className="h-5 w-5" />
                Voice Issues?
              </CardTitle>
              <CardDescription>
                Troubleshoot audio and voice problems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm space-y-2">
                <li>• Check microphone permissions</li>
                <li>• Test your audio settings</li>
                <li>• Try a different browser</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Us
              </CardTitle>
              <CardDescription>
                Send us an email for detailed support
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                support@pinglearn.com
              </p>
              <p className="text-xs text-muted-foreground">
                We typically respond within 24 hours
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h2 className="font-semibold mb-2">Quick Tips</h2>
          <ul className="text-sm space-y-1">
            <li>• Speak clearly and at a moderate pace for best recognition</li>
            <li>• Use a quiet environment for voice sessions</li>
            <li>• Chrome or Edge browsers work best for voice features</li>
            <li>• Your progress is automatically saved after each session</li>
          </ul>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}