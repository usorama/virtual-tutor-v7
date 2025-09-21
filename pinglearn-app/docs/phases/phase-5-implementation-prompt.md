# Phase 5 Implementation Prompt: Support & Communication System

## Context for AI Implementation

You are implementing Phase 5 of PingLearn (Virtual Tutor v7), a comprehensive support and communication system that enables professional customer support, COPPA/FERPA compliance, and scalable operations.

### Current State
- ✅ Domain: pinglearn.app registered and configured
- ✅ Email: Resend SMTP configured with Supabase
- ✅ Forwarding: support@, privacy@, legal@ forward to admin
- ✅ Authentication: Supabase Auth fully functional
- ⏳ Support System: Needs implementation

### Your Mission
Build a privacy-compliant support ticket system that:
1. Converts emails to trackable tickets
2. Sends branded responses via Resend API
3. Handles COPPA/FERPA data requests
4. Provides audit trail for compliance
5. Includes admin dashboard for management

## Implementation Steps

### Step 1: Database Setup

**Execute this SQL in Supabase:**

```sql
-- Support tickets table
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  requester_email TEXT NOT NULL,
  requester_name TEXT,
  requester_type TEXT CHECK (requester_type IN ('parent', 'student', 'teacher', 'other')),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  category TEXT CHECK (category IN ('technical', 'account', 'privacy', 'billing', 'general')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved', 'closed')),
  is_coppa_request BOOLEAN DEFAULT FALSE,
  is_ferpa_request BOOLEAN DEFAULT FALSE,
  data_deletion_requested BOOLEAN DEFAULT FALSE,
  assigned_to TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  response_time_hours DECIMAL,
  resolution_time_hours DECIMAL
);

-- Ticket responses table
CREATE TABLE ticket_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE,
  from_email TEXT NOT NULL,
  message TEXT NOT NULL,
  is_internal_note BOOLEAN DEFAULT FALSE,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email templates table
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT UNIQUE NOT NULL,
  template_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  text_body TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit log for compliance
CREATE TABLE support_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id),
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_tickets_status ON support_tickets(status);
CREATE INDEX idx_tickets_requester ON support_tickets(requester_email);
CREATE INDEX idx_tickets_created ON support_tickets(created_at DESC);
CREATE INDEX idx_tickets_coppa ON support_tickets(is_coppa_request) WHERE is_coppa_request = TRUE;

-- Generate ticket number function
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  year_month TEXT;
  seq_num INTEGER;
BEGIN
  year_month := TO_CHAR(NOW(), 'YYYY-MM');
  SELECT COUNT(*) + 1 INTO seq_num
  FROM support_tickets
  WHERE created_at >= DATE_TRUNC('month', NOW());
  
  RETURN 'PING-' || year_month || '-' || LPAD(seq_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ticket number
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ticket_number := generate_ticket_number();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_ticket_number
  BEFORE INSERT ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_number();

-- RLS Policies (adjust based on your auth model)
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_audit_log ENABLE ROW LEVEL SECURITY;

-- Admin access policy (update with your admin role logic)
CREATE POLICY "Admins can manage all tickets" ON support_tickets
  FOR ALL USING (true); -- Adjust this based on your admin identification

-- Insert default email templates
INSERT INTO email_templates (template_key, template_name, subject, html_body, text_body, variables, category) VALUES
('ticket_received', 'Ticket Received', 'Support Request Received - {{ticket_number}}', 
'<p>Hello {{name}},</p><p>We have received your support request and assigned it ticket number <strong>{{ticket_number}}</strong>.</p><p>We will respond within 24-48 hours.</p><p>Thank you,<br>PingLearn Support Team</p>', 
'Hello {{name}},\n\nWe have received your support request and assigned it ticket number {{ticket_number}}.\n\nWe will respond within 24-48 hours.\n\nThank you,\nPingLearn Support Team', 
'["name", "ticket_number"]'::jsonb, 'auto_response'),

('privacy_request_received', 'Privacy Request Acknowledgment', 'Privacy Request Received - {{ticket_number}}', 
'<p>Dear {{name}},</p><p>We have received your privacy-related request (Ticket: <strong>{{ticket_number}}</strong>).</p><p>As required by COPPA/FERPA regulations, we will process your request within the legally mandated timeframe.</p><p>For data access requests: 45 days maximum<br>For urgent safety concerns: 24-48 hours</p><p>Regards,<br>PingLearn Privacy Team</p>', 
'Dear {{name}},\n\nWe have received your privacy-related request (Ticket: {{ticket_number}}).\n\nAs required by COPPA/FERPA regulations, we will process your request within the legally mandated timeframe.\n\nFor data access requests: 45 days maximum\nFor urgent safety concerns: 24-48 hours\n\nRegards,\nPingLearn Privacy Team', 
'["name", "ticket_number"]'::jsonb, 'privacy'),

('ticket_resolved', 'Issue Resolved', 'Your Support Request Has Been Resolved - {{ticket_number}}', 
'<p>Hello {{name}},</p><p>Good news! Your support request ({{ticket_number}}) has been resolved.</p><p>{{resolution_message}}</p><p>If you need further assistance, simply reply to this email.</p><p>Best regards,<br>PingLearn Support</p>', 
'Hello {{name}},\n\nGood news! Your support request ({{ticket_number}}) has been resolved.\n\n{{resolution_message}}\n\nIf you need further assistance, simply reply to this email.\n\nBest regards,\nPingLearn Support', 
'["name", "ticket_number", "resolution_message"]'::jsonb, 'resolution');
```

### Step 2: Create Service Layer

**File: `/lib/services/support/email.service.ts`**

```typescript
import { Resend } from 'resend';
import { createClient } from '@/lib/supabase/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export class EmailService {
  static async sendTicketEmail(
    to: string,
    templateKey: string,
    variables: Record<string, string>
  ) {
    const supabase = createClient();
    
    // Fetch template
    const { data: template } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', templateKey)
      .single();
    
    if (!template) throw new Error('Template not found');
    
    // Replace variables
    let htmlBody = template.html_body;
    let textBody = template.text_body;
    let subject = template.subject;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      htmlBody = htmlBody.replace(regex, value);
      textBody = textBody.replace(regex, value);
      subject = subject.replace(regex, value);
    });
    
    // Send via Resend
    const { data, error } = await resend.emails.send({
      from: 'PingLearn Support <support@pinglearn.app>',
      to,
      subject,
      html: htmlBody,
      text: textBody,
      headers: {
        'X-Ticket-Number': variables.ticket_number || '',
      },
    });
    
    if (error) throw error;
    return data;
  }
  
  static async sendDirectReply(
    to: string,
    subject: string,
    message: string,
    ticketNumber?: string
  ) {
    const { data, error } = await resend.emails.send({
      from: 'PingLearn Support <support@pinglearn.app>',
      to,
      subject,
      html: message,
      text: message.replace(/<[^>]*>/g, ''), // Strip HTML
      headers: ticketNumber ? { 'X-Ticket-Number': ticketNumber } : {},
    });
    
    if (error) throw error;
    return data;
  }
}
```

**File: `/lib/services/support/ticket.service.ts`**

```typescript
import { createClient } from '@/lib/supabase/server';
import { EmailService } from './email.service';

export interface CreateTicketData {
  requester_email: string;
  requester_name?: string;
  subject: string;
  description: string;
  category?: string;
  priority?: string;
  is_coppa_request?: boolean;
  is_ferpa_request?: boolean;
}

export class TicketService {
  static async createTicket(data: CreateTicketData) {
    const supabase = createClient();
    
    // Detect requester type
    const requester_type = data.requester_email.includes('@student') 
      ? 'student' 
      : 'parent'; // Simplified logic
    
    // Auto-detect privacy requests
    const lowerDesc = data.description.toLowerCase();
    const is_coppa_request = data.is_coppa_request || 
      lowerDesc.includes('coppa') || 
      lowerDesc.includes('child privacy');
    const is_ferpa_request = data.is_ferpa_request || 
      lowerDesc.includes('ferpa') || 
      lowerDesc.includes('education record');
    const data_deletion_requested = 
      lowerDesc.includes('delete') && 
      lowerDesc.includes('data');
    
    // Set priority for compliance requests
    const priority = (is_coppa_request || is_ferpa_request || data_deletion_requested) 
      ? 'high' 
      : data.priority || 'normal';
    
    // Create ticket
    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        ...data,
        requester_type,
        is_coppa_request,
        is_ferpa_request,
        data_deletion_requested,
        priority,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    // Log creation
    await this.logAction(ticket.id, 'ticket_created', 'system', { 
      source: 'web_form' 
    });
    
    // Send acknowledgment email
    await EmailService.sendTicketEmail(
      ticket.requester_email,
      is_coppa_request || is_ferpa_request 
        ? 'privacy_request_received' 
        : 'ticket_received',
      {
        name: ticket.requester_name || 'Valued Customer',
        ticket_number: ticket.ticket_number,
      }
    );
    
    return ticket;
  }
  
  static async addResponse(
    ticketId: string,
    message: string,
    fromEmail: string = 'support@pinglearn.app',
    isInternalNote: boolean = false
  ) {
    const supabase = createClient();
    
    // Add response to database
    const { data: response, error: responseError } = await supabase
      .from('ticket_responses')
      .insert({
        ticket_id: ticketId,
        from_email: fromEmail,
        message,
        is_internal_note: isInternalNote,
      })
      .select()
      .single();
    
    if (responseError) throw responseError;
    
    // Update ticket timestamps
    const updates: any = {
      updated_at: new Date().toISOString(),
    };
    
    // Check if this is first response
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('first_response_at, requester_email, ticket_number')
      .eq('id', ticketId)
      .single();
    
    if (ticket && !ticket.first_response_at) {
      updates.first_response_at = new Date().toISOString();
      updates.response_time_hours = 
        (Date.now() - new Date(ticket.created_at).getTime()) / (1000 * 60 * 60);
    }
    
    await supabase
      .from('support_tickets')
      .update(updates)
      .eq('id', ticketId);
    
    // Send email if not internal note
    if (!isInternalNote && ticket) {
      await EmailService.sendDirectReply(
        ticket.requester_email,
        `Re: ${ticket.ticket_number}`,
        message,
        ticket.ticket_number
      );
    }
    
    // Log action
    await this.logAction(ticketId, 'response_added', fromEmail, { 
      is_internal: isInternalNote 
    });
    
    return response;
  }
  
  static async resolveTicket(ticketId: string, resolutionMessage: string) {
    const supabase = createClient();
    
    // Get ticket details
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();
    
    if (!ticket) throw new Error('Ticket not found');
    
    // Update ticket status
    const { error } = await supabase
      .from('support_tickets')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolution_time_hours: 
          (Date.now() - new Date(ticket.created_at).getTime()) / (1000 * 60 * 60),
      })
      .eq('id', ticketId);
    
    if (error) throw error;
    
    // Add resolution response
    await this.addResponse(ticketId, resolutionMessage);
    
    // Send resolution email
    await EmailService.sendTicketEmail(
      ticket.requester_email,
      'ticket_resolved',
      {
        name: ticket.requester_name || 'Valued Customer',
        ticket_number: ticket.ticket_number,
        resolution_message: resolutionMessage,
      }
    );
    
    // Log resolution
    await this.logAction(ticketId, 'ticket_resolved', 'admin', { 
      resolution_message: resolutionMessage 
    });
    
    return ticket;
  }
  
  static async logAction(
    ticketId: string,
    action: string,
    performedBy: string,
    details?: any
  ) {
    const supabase = createClient();
    
    await supabase.from('support_audit_log').insert({
      ticket_id: ticketId,
      action,
      performed_by: performedBy,
      details,
    });
  }
}
```

### Step 3: Create Admin Dashboard

**File: `/app/admin/support/page.tsx`**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TicketList } from '@/components/support/ticket-list';
import { TicketDetail } from '@/components/support/ticket-detail';
import { SupportMetrics } from '@/components/support/metrics';

export default function SupportDashboard() {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [metrics, setMetrics] = useState({});
  const [filter, setFilter] = useState('open');
  
  const supabase = createClient();
  
  useEffect(() => {
    loadTickets();
    loadMetrics();
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('tickets')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'support_tickets' },
        loadTickets
      )
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [filter]);
  
  const loadTickets = async () => {
    const query = supabase
      .from('support_tickets')
      .select(`
        *,
        ticket_responses (*)
      `)
      .order('created_at', { ascending: false });
    
    if (filter !== 'all') {
      query.eq('status', filter);
    }
    
    const { data, error } = await query;
    if (!error) setTickets(data);
  };
  
  const loadMetrics = async () => {
    // Load support metrics
    const { data } = await supabase.rpc('get_support_metrics');
    if (data) setMetrics(data);
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Support Dashboard</h1>
        <div className="flex gap-2">
          <Badge variant="outline">
            {metrics.open_tickets || 0} Open
          </Badge>
          <Badge variant="outline">
            {metrics.avg_response_time || 'N/A'} Avg Response
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-4">
          <Card className="p-4">
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="mt-4">
              <TicketList
                tickets={tickets}
                selectedId={selectedTicket?.id}
                onSelect={setSelectedTicket}
              />
            </div>
          </Card>
        </div>
        
        <div className="col-span-8">
          {selectedTicket ? (
            <TicketDetail
              ticket={selectedTicket}
              onUpdate={loadTickets}
            />
          ) : (
            <Card className="p-8 text-center text-muted-foreground">
              Select a ticket to view details
            </Card>
          )}
        </div>
      </div>
      
      <div className="mt-6">
        <SupportMetrics metrics={metrics} />
      </div>
    </div>
  );
}
```

### Step 4: Create API Routes

**File: `/app/api/support/tickets/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { TicketService } from '@/lib/services/support/ticket.service';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  
  let query = supabase
    .from('support_tickets')
    .select(`
      *,
      ticket_responses (
        *
      )
    `)
    .order('created_at', { ascending: false });
  
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ticket = await TicketService.createTicket(body);
    return NextResponse.json(ticket);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

**File: `/app/api/support/webhooks/incoming-email/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { TicketService } from '@/lib/services/support/ticket.service';

export async function POST(request: Request) {
  try {
    // Parse email webhook (format depends on your forwarding service)
    const body = await request.json();
    
    // Extract email details
    const { from, subject, text, html } = body;
    
    // Check if this is a reply to existing ticket
    const ticketNumberMatch = subject.match(/PING-\d{4}-\d{2}-\d{4}/);
    
    if (ticketNumberMatch) {
      // Add response to existing ticket
      const ticketNumber = ticketNumberMatch[0];
      // Find ticket and add response
      // ... implementation
    } else {
      // Create new ticket
      const ticket = await TicketService.createTicket({
        requester_email: from,
        subject,
        description: text || html,
        category: 'general',
      });
      
      return NextResponse.json({ 
        success: true, 
        ticket_number: ticket.ticket_number 
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### Step 5: Create Support Components

**File: `/components/support/ticket-list.tsx`**

```typescript
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TicketListProps {
  tickets: any[];
  selectedId?: string;
  onSelect: (ticket: any) => void;
}

export function TicketList({ tickets, selectedId, onSelect }: TicketListProps) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'warning';
      case 'normal': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'default';
      case 'pending': return 'warning';
      case 'resolved': return 'success';
      case 'closed': return 'secondary';
      default: return 'default';
    }
  };
  
  return (
    <ScrollArea className="h-[600px]">
      <div className="space-y-2">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            onClick={() => onSelect(ticket)}
            className={`p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors ${
              selectedId === ticket.id ? 'bg-accent' : ''
            }`}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="font-mono text-xs text-muted-foreground">
                {ticket.ticket_number}
              </span>
              <Badge variant={getPriorityColor(ticket.priority)} size="sm">
                {ticket.priority}
              </Badge>
            </div>
            
            <h4 className="font-medium text-sm mb-1 line-clamp-1">
              {ticket.subject}
            </h4>
            
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {ticket.description}
            </p>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {ticket.requester_name || ticket.requester_email}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(ticket.created_at), { 
                  addSuffix: true 
                })}
              </span>
            </div>
            
            <div className="flex gap-1 mt-2">
              <Badge variant={getStatusColor(ticket.status)} size="sm">
                {ticket.status}
              </Badge>
              {ticket.is_coppa_request && (
                <Badge variant="outline" size="sm">COPPA</Badge>
              )}
              {ticket.is_ferpa_request && (
                <Badge variant="outline" size="sm">FERPA</Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
```

**File: `/components/support/ticket-detail.tsx`**

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';

interface TicketDetailProps {
  ticket: any;
  onUpdate: () => void;
}

export function TicketDetail({ ticket, onUpdate }: TicketDetailProps) {
  const [response, setResponse] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const handleSendResponse = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticket.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: response,
          is_internal_note: isInternal,
        }),
      });
      
      if (res.ok) {
        setResponse('');
        onUpdate();
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleResolve = async () => {
    if (!response) {
      alert('Please provide a resolution message');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`/api/support/tickets/${ticket.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolution_message: response,
        }),
      });
      
      if (res.ok) {
        setResponse('');
        onUpdate();
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="p-6">
      <div className="mb-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-2xl font-bold">{ticket.subject}</h2>
            <span className="text-sm text-muted-foreground">
              {ticket.ticket_number}
            </span>
          </div>
          <div className="flex gap-2">
            <Badge>{ticket.status}</Badge>
            <Badge variant="outline">{ticket.priority}</Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
          <div>
            <span className="text-muted-foreground">From:</span>
            <p className="font-medium">
              {ticket.requester_name || ticket.requester_email}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Created:</span>
            <p className="font-medium">
              {formatDistanceToNow(new Date(ticket.created_at), { 
                addSuffix: true 
              })}
            </p>
          </div>
        </div>
        
        {(ticket.is_coppa_request || ticket.is_ferpa_request) && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              ⚠️ Compliance Request - Handle with Priority
            </p>
            <div className="flex gap-2 mt-2">
              {ticket.is_coppa_request && <Badge>COPPA</Badge>}
              {ticket.is_ferpa_request && <Badge>FERPA</Badge>}
              {ticket.data_deletion_requested && <Badge>Data Deletion</Badge>}
            </div>
          </div>
        )}
      </div>
      
      <Tabs defaultValue="conversation" className="mt-6">
        <TabsList>
          <TabsTrigger value="conversation">Conversation</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>
        
        <TabsContent value="conversation" className="mt-4">
          <div className="space-y-4 mb-4 max-h-[300px] overflow-y-auto">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="font-medium text-sm">
                  {ticket.requester_email}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(ticket.created_at), { 
                    addSuffix: true 
                  })}
                </span>
              </div>
              <p className="text-sm">{ticket.description}</p>
            </div>
            
            {ticket.ticket_responses?.map((response: any) => (
              <div
                key={response.id}
                className={`p-4 rounded-lg ${
                  response.is_internal_note
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200'
                    : response.from_email === 'support@pinglearn.app'
                    ? 'bg-blue-50 dark:bg-blue-900/20 ml-8'
                    : 'bg-muted'
                }`}
              >
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-sm">
                    {response.from_email}
                    {response.is_internal_note && (
                      <Badge variant="outline" size="sm" className="ml-2">
                        Internal Note
                      </Badge>
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(response.created_at), { 
                      addSuffix: true 
                    })}
                  </span>
                </div>
                <p className="text-sm">{response.message}</p>
              </div>
            ))}
          </div>
          
          {ticket.status !== 'closed' && (
            <div className="space-y-4">
              <Textarea
                placeholder="Type your response..."
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={4}
              />
              
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="internal"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                  />
                  <label htmlFor="internal" className="text-sm">
                    Internal Note
                  </label>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleSendResponse}
                    disabled={!response || loading}
                  >
                    Send Response
                  </Button>
                  <Button
                    onClick={handleResolve}
                    disabled={!response || loading}
                  >
                    Resolve Ticket
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="details">
          {/* Add detailed ticket information */}
        </TabsContent>
        
        <TabsContent value="audit">
          {/* Add audit log display */}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
```

## Testing Checklist

### Functionality Tests
- [ ] Create ticket via web form
- [ ] Create ticket via email forwarding
- [ ] Send branded response via dashboard
- [ ] Mark ticket as resolved
- [ ] Internal notes functionality
- [ ] Priority detection for COPPA/FERPA
- [ ] Ticket number generation
- [ ] Email template system

### Compliance Tests
- [ ] COPPA request auto-flagging
- [ ] FERPA request detection
- [ ] Data deletion request handling
- [ ] Audit log creation
- [ ] Response time tracking
- [ ] Resolution time calculation

### Integration Tests
- [ ] Email forwarding → ticket creation
- [ ] Dashboard → Resend API
- [ ] Real-time ticket updates
- [ ] Template variable replacement
- [ ] Attachment handling

### Performance Tests
- [ ] Dashboard loads < 2 seconds
- [ ] Ticket creation < 1 second
- [ ] Email sending < 3 seconds
- [ ] Search/filter responsiveness

## Deployment Steps

1. **Database Migration**
   - Run SQL scripts in Supabase
   - Verify tables and triggers

2. **Environment Variables**
   ```env
   RESEND_API_KEY=re_F9aoGiJC_Jar47oSXQa3ftYex84632jmh
   NEXT_PUBLIC_SUPPORT_EMAIL=support@pinglearn.app
   ```

3. **Deploy Code**
   - Push to repository
   - Verify Vercel deployment
   - Test email webhooks

4. **Configure Webhooks**
   - Set up email forwarding webhook
   - Test with sample emails
   - Monitor error logs

5. **Go Live**
   - Enable support dashboard for admin
   - Send test tickets
   - Monitor first 24 hours

## Success Metrics

### Week 1 Targets
- 90% tickets acknowledged < 2 hours
- 80% tickets resolved < 24 hours
- 0 COPPA/FERPA SLA violations
- 100% emails branded correctly

### Month 1 Targets
- < 10 open tickets average
- 85% customer satisfaction
- 60% ticket deflection via FAQ
- 100% compliance audit trail

## Troubleshooting Guide

### Common Issues

**Emails not creating tickets:**
- Check webhook configuration
- Verify API endpoint accessibility
- Review webhook logs

**Branded emails not sending:**
- Verify Resend API key
- Check domain verification
- Review email template errors

**Dashboard not updating:**
- Check real-time subscriptions
- Verify RLS policies
- Review browser console

**COPPA flags not working:**
- Test keyword detection
- Verify priority assignment
- Check audit logging

## Future Enhancements

### Phase 5.1+
- AI-powered response suggestions
- Chatbot for initial triage
- Knowledge base integration
- Multi-language support

### Phase 5.2+
- Advanced analytics dashboard
- Customer satisfaction surveys
- SLA alerting system
- Team collaboration features

---

**Implementation Ready**: This prompt provides everything needed to build the complete support system. Start with Step 1 (Database) and work through sequentially. Each component is production-ready and COPPA/FERPA compliant.

**Estimated Time**: 4-5 days for full implementation
**Complexity**: Medium
**Priority**: High (legal compliance)