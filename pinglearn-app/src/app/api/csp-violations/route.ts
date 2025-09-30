/**
 * CSP Violation Reporting Endpoint (SEC-012)
 *
 * Receives Content-Security-Policy violation reports from browsers
 * and logs them for security monitoring and CSP policy refinement.
 *
 * Browsers send CSP violation reports when they block content that
 * violates the Content-Security-Policy header. This endpoint captures
 * those reports for analysis.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP#violation_report_syntax
 * @see https://www.w3.org/TR/CSP3/#reporting
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * CSP Violation Report structure (as sent by browsers)
 * @see https://www.w3.org/TR/CSP3/#violation-reports
 */
interface CSPViolationReport {
  'csp-report': {
    'document-uri': string;
    'referrer'?: string;
    'violated-directive': string;
    'effective-directive': string;
    'original-policy': string;
    'blocked-uri': string;
    'status-code': number;
    'script-sample'?: string;
  };
}

/**
 * POST /api/csp-violations
 *
 * Receives CSP violation reports from browsers.
 * Logs violation details for security analysis and policy refinement.
 *
 * Response: 204 No Content (success)
 * Error Response: 400 Bad Request (invalid JSON)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse violation report from request body
    const report: CSPViolationReport = await request.json();

    // Extract violation details for logging
    const cspReport = report['csp-report'];

    // Log violation with contextual information
    console.warn('[CSP VIOLATION]', {
      timestamp: new Date().toISOString(),
      documentUri: cspReport['document-uri'],
      violatedDirective: cspReport['violated-directive'],
      effectiveDirective: cspReport['effective-directive'],
      blockedUri: cspReport['blocked-uri'],
      statusCode: cspReport['status-code'],
      scriptSample: cspReport['script-sample'],
      referrer: cspReport.referrer,
      userAgent: request.headers.get('user-agent'),
      clientIP: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    });

    // In production, you may want to:
    // 1. Send to monitoring service (Sentry, DataDog, etc.)
    // 2. Store in database for analysis
    // 3. Alert security team for critical violations
    // 4. Track violation patterns over time
    //
    // Example Sentry integration:
    // await Sentry.captureMessage('CSP Violation', {
    //   level: 'warning',
    //   extra: { violation: cspReport }
    // });

    // Return 204 No Content (standard response for CSP reports)
    return new NextResponse(null, { status: 204 });

  } catch (error) {
    // Log error processing violation report
    console.error('[CSP VIOLATION ENDPOINT ERROR]', {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      userAgent: request.headers.get('user-agent')
    });

    // Return 400 Bad Request for invalid reports
    return NextResponse.json(
      { error: 'Invalid CSP violation report' },
      { status: 400 }
    );
  }
}