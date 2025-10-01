/**
 * Admin API for API Key Management
 * Routes:
 * - GET /api/admin/keys/[service] - List all keys for service
 * - POST /api/admin/keys/[service] - Create new key
 * - PATCH /api/admin/keys/[service] - Update key status (activate/deprecate/revoke)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getActiveKeys,
  generateNewKey,
  activateKey,
  deprecateKey,
  revokeKey,
  type ServiceType,
  type RotationReason
} from '@/lib/security/api-key-manager'

// ============================================================================
// ADMIN AUTHENTICATION
// ============================================================================

async function requireAdmin(request: NextRequest): Promise<{ userId: string; isAdmin: boolean }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  // Check admin role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || profile?.role !== 'admin') {
    throw new Error('Admin access required')
  }

  return { userId: user.id, isAdmin: true }
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

function validateService(service: string): service is ServiceType {
  const validServices: ServiceType[] = ['gemini', 'livekit', 'supabase', 'openai']
  return validServices.includes(service as ServiceType)
}

function validateRotationReason(reason: string): reason is RotationReason {
  const validReasons: RotationReason[] = ['scheduled', 'security_incident', 'compliance', 'manual']
  return validReasons.includes(reason as RotationReason)
}

// ============================================================================
// GET /api/admin/keys/[service] - List all keys for service
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
): Promise<NextResponse> {
  try {
    // Authenticate admin
    await requireAdmin(request)

    const { service } = await params

    // Validate service type
    if (!validateService(service)) {
      return NextResponse.json(
        { error: 'Invalid service type. Must be: gemini, livekit, supabase, or openai' },
        { status: 400 }
      )
    }

    // Get all keys (active + inactive) for audit trail
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('api_key_versions')
      .select('id, service, key_id, status, role, created_at, activated_at, deprecated_at, revoked_at, expires_at, metadata')
      .eq('service', service)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // DO NOT return decrypted keys in list (security)
    const keys = data.map((k: Record<string, unknown>) => {
      const createdAt = new Date(k.created_at as string)
      const now = Date.now()
      const ageInDays = Math.floor((now - createdAt.getTime()) / (1000 * 60 * 60 * 24))

      return {
        id: k.id,
        keyId: k.key_id,
        status: k.status,
        role: k.role,
        createdAt: k.created_at,
        activatedAt: k.activated_at,
        deprecatedAt: k.deprecated_at,
        revokedAt: k.revoked_at,
        expiresAt: k.expires_at,
        ageInDays,
        metadata: k.metadata
      }
    })

    return NextResponse.json({
      success: true,
      service,
      count: keys.length,
      keys
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch keys'

    if (message === 'Unauthorized' || message === 'Admin access required') {
      return NextResponse.json({ error: message }, { status: 403 })
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/admin/keys/[service] - Generate new key
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
): Promise<NextResponse> {
  try {
    const { userId } = await requireAdmin(request)
    const { service } = await params

    // Validate service
    if (!validateService(service)) {
      return NextResponse.json(
        { error: 'Invalid service type. Must be: gemini, livekit, supabase, or openai' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { keyValue, keyId, reason, notes } = body

    if (!keyValue || typeof keyValue !== 'string') {
      return NextResponse.json(
        { error: 'keyValue is required (the actual API key from service provider)' },
        { status: 400 }
      )
    }

    if (!reason || !validateRotationReason(reason)) {
      return NextResponse.json(
        { error: 'Invalid rotation reason. Must be: scheduled, security_incident, compliance, or manual' },
        { status: 400 }
      )
    }

    // Generate new key (status: pending)
    const newKey = await generateNewKey(service, keyValue, reason, userId, keyId)

    return NextResponse.json({
      success: true,
      message: 'Key created successfully (status: pending). Use PATCH to activate.',
      key: {
        id: newKey.id,
        service: newKey.service,
        status: newKey.status,
        expiresAt: newKey.expiresAt.toISOString()
      }
    }, { status: 201 })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create key'

    if (message.includes('Unauthorized') || message.includes('Admin')) {
      return NextResponse.json({ error: message }, { status: 403 })
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}

// ============================================================================
// PATCH /api/admin/keys/[service] - Update key status
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ service: string }> }
): Promise<NextResponse> {
  try {
    const { userId } = await requireAdmin(request)
    const { service } = await params

    // Validate service
    if (!validateService(service)) {
      return NextResponse.json(
        { error: 'Invalid service type' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { keyId, action } = body

    if (!keyId || typeof keyId !== 'string') {
      return NextResponse.json(
        { error: 'keyId is required' },
        { status: 400 }
      )
    }

    if (!action || typeof action !== 'string') {
      return NextResponse.json(
        { error: 'action is required' },
        { status: 400 }
      )
    }

    // Execute action
    switch (action) {
      case 'activate':
        await activateKey(keyId, userId)
        return NextResponse.json({
          success: true,
          message: 'Key activated successfully (status: active, role: primary). Old primary demoted to secondary.'
        })

      case 'deprecate':
        await deprecateKey(keyId, userId)
        return NextResponse.json({
          success: true,
          message: 'Key deprecated successfully (status: deprecating). Key remains valid during grace period.'
        })

      case 'revoke':
        await revokeKey(keyId, userId)
        return NextResponse.json({
          success: true,
          message: 'Key revoked successfully (status: revoked). Key is now immediately invalid.'
        })

      default:
        return NextResponse.json(
          { error: `Invalid action: ${action}. Must be: activate, deprecate, or revoke` },
          { status: 400 }
        )
    }

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update key'

    if (message.includes('Unauthorized') || message.includes('Admin')) {
      return NextResponse.json({ error: message }, { status: 403 })
    }

    if (message.includes('must be in pending status') || message.includes('not found')) {
      return NextResponse.json({ error: message }, { status: 400 })
    }

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}