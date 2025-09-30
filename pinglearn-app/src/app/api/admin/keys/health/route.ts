/**
 * API Key Health Check Endpoint
 * GET /api/admin/keys/health - Monitor key health and rotation alerts
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkKeyHealth, getRotationAlerts } from '@/lib/security/api-key-manager'

/**
 * Requires admin authentication
 */
async function requireAdmin(request: NextRequest): Promise<{ userId: string }> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) throw new Error('Unauthorized')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    throw new Error('Admin access required')
  }

  return { userId: user.id }
}

/**
 * GET /api/admin/keys/health
 * Returns comprehensive health status for all API keys
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await requireAdmin(request)

    const health = await checkKeyHealth()
    const alerts = await getRotationAlerts()

    // Calculate summary statistics
    const summary = {
      totalKeys: health.length,
      activeKeys: health.filter(h => h.status === 'active').length,
      deprecatingKeys: health.filter(h => h.status === 'deprecating').length,
      keysNeedingRotation: alerts.length,
      criticalAlerts: health.filter(h =>
        h.alerts.some(a => a.severity === 'critical')
      ).length,
      errorAlerts: health.filter(h =>
        h.alerts.some(a => a.severity === 'error')
      ).length,
      warningAlerts: health.filter(h =>
        h.alerts.some(a => a.severity === 'warning')
      ).length
    }

    // Group by service
    const byService = health.reduce((acc, key) => {
      if (!acc[key.service]) {
        acc[key.service] = []
      }
      acc[key.service].push(key)
      return acc
    }, {} as Record<string, typeof health>)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
      byService,
      rotationAlerts: alerts,
      allKeys: health
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Health check failed'

    if (message.includes('Unauthorized') || message.includes('Admin')) {
      return NextResponse.json({ error: message }, { status: 403 })
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}