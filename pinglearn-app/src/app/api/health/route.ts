/**
 * Simple health check endpoint for integration tests
 * GET /api/health
 */
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  }, { status: 200 });
}
