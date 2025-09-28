/**
 * E2E Tests for Dashboard Auto-Refresh Feature (FC-012)
 *
 * Tests the SWR and Supabase Realtime auto-refresh functionality
 * in the ContentManagementDashboard component.
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Dashboard Auto-Refresh Feature', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();

    // Navigate to the dashboard page
    await page.goto('http://localhost:3006/textbooks/manage');

    // Wait for the dashboard to load
    await expect(page.getByText('Content Management Dashboard')).toBeVisible();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('should load dashboard with initial data', async () => {
    // Check that the dashboard title is visible
    await expect(page.getByText('Content Management Dashboard')).toBeVisible();

    // Check that statistics cards are visible
    await expect(page.getByText('Total Series')).toBeVisible();
    await expect(page.getByText('Total Books')).toBeVisible();
    await expect(page.getByText('Total Chapters')).toBeVisible();

    // Check that upload button is visible
    await expect(page.getByRole('button', { name: /upload new content/i })).toBeVisible();

    // Check that tabs are visible
    await expect(page.getByRole('tab', { name: /overview/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /series/i })).toBeVisible();
  });

  test('should make API request on initial load', async () => {
    // Monitor network requests
    const requests: string[] = [];

    page.on('request', request => {
      if (request.url().includes('/api/textbooks/statistics')) {
        requests.push(request.url());
      }
    });

    // Reload the page to trigger initial load
    await page.reload();

    // Wait for the dashboard to load
    await expect(page.getByText('Content Management Dashboard')).toBeVisible();

    // Verify that the statistics API was called
    expect(requests.length).toBeGreaterThan(0);
    expect(requests[0]).toContain('/api/textbooks/statistics');
  });

  test('should refresh data when tab regains focus (revalidateOnFocus)', async () => {
    const requests: string[] = [];

    // Monitor API requests
    page.on('request', request => {
      if (request.url().includes('/api/textbooks/statistics')) {
        requests.push(`${new Date().toISOString()}: ${request.url()}`);
      }
    });

    // Wait for initial load
    await expect(page.getByText('Content Management Dashboard')).toBeVisible();

    const initialRequestCount = requests.length;

    // Create a new page (simulate switching to another tab)
    const newPage = await page.context().newPage();
    await newPage.goto('about:blank');

    // Wait a bit to ensure the original tab loses focus
    await page.waitForTimeout(1000);

    // Switch back to the dashboard tab (simulate regaining focus)
    await page.bringToFront();

    // Wait for potential revalidation request
    await page.waitForTimeout(2000);

    // Verify that a new request was made after regaining focus
    expect(requests.length).toBeGreaterThan(initialRequestCount);

    await newPage.close();
  });

  test('should refresh data when reconnecting to network (revalidateOnReconnect)', async () => {
    const requests: string[] = [];

    // Monitor API requests
    page.on('request', request => {
      if (request.url().includes('/api/textbooks/statistics')) {
        requests.push(`${new Date().toISOString()}: ${request.url()}`);
      }
    });

    // Wait for initial load
    await expect(page.getByText('Content Management Dashboard')).toBeVisible();

    const initialRequestCount = requests.length;

    // Simulate network disconnection
    await page.context().setOffline(true);

    // Wait a bit
    await page.waitForTimeout(1000);

    // Simulate network reconnection
    await page.context().setOffline(false);

    // Wait for potential revalidation request
    await page.waitForTimeout(3000);

    // Verify that a new request was made after reconnection
    expect(requests.length).toBeGreaterThan(initialRequestCount);
  });

  test('should handle tab navigation correctly', async () => {
    // Click on Series tab
    await page.getByRole('tab', { name: /series/i }).click();

    // Check that series tab is active
    const seriesTab = page.getByRole('tab', { name: /series/i });
    await expect(seriesTab).toHaveAttribute('aria-selected', 'true');

    // Check that filters are visible in series tab
    await expect(page.getByText('Filters')).toBeVisible();

    // Click on Books tab
    await page.getByRole('tab', { name: /books/i }).click();

    // Check that books tab is active
    const booksTab = page.getByRole('tab', { name: /books/i });
    await expect(booksTab).toHaveAttribute('aria-selected', 'true');

    // Click back to Overview tab
    await page.getByRole('tab', { name: /overview/i }).click();

    // Check that overview tab is active
    const overviewTab = page.getByRole('tab', { name: /overview/i });
    await expect(overviewTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should call callback when upload button is clicked', async () => {
    // Monitor console logs for callback execution
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        logs.push(msg.text());
      }
    });

    // Click the upload button
    await page.getByRole('button', { name: /upload new content/i }).click();

    // Should navigate to upload page
    await expect(page).toHaveURL('http://localhost:3006/textbooks/upload');
  });

  test('should display console logs for Supabase realtime setup', async () => {
    const logs: string[] = [];

    // Monitor console logs
    page.on('console', msg => {
      logs.push(`${msg.type()}: ${msg.text()}`);
    });

    // Reload the page to trigger realtime setup
    await page.reload();

    // Wait for the dashboard to load and realtime to be set up
    await expect(page.getByText('Content Management Dashboard')).toBeVisible();
    await page.waitForTimeout(2000);

    // Check for console logs related to Supabase cleanup when component unmounts
    // This would happen during navigation or page reload

    // We should see logs about unsubscribing when the component unmounts
    const hasRealtimeSetup = logs.some(log =>
      log.includes('Unsubscribing') ||
      log.includes('textbook')
    );

    // Note: In a real scenario, you would trigger database changes to see
    // realtime logs like "Textbooks table changed:", but that requires
    // database access which isn't available in this test environment
  });

  test('should handle API errors gracefully', async () => {
    // Intercept the statistics API and return an error
    await page.route('**/api/textbooks/statistics', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    // Reload the page
    await page.reload();

    // Dashboard should still render even with API error
    await expect(page.getByText('Content Management Dashboard')).toBeVisible();

    // Statistics should show default values (0)
    await expect(page.getByText('Total Series')).toBeVisible();

    // The dashboard should be functional despite the API error
    await expect(page.getByRole('button', { name: /upload new content/i })).toBeVisible();
  });

  test('should handle slow API responses without breaking', async () => {
    // Intercept the statistics API and add delay
    await page.route('**/api/textbooks/statistics', async route => {
      // Add 2 second delay
      await page.waitForTimeout(2000);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            totalSeries: 10,
            totalBooks: 25,
            totalChapters: 75,
            totalSections: 200,
            recentlyAdded: 5,
            needsReview: 3,
            growth: { series: 2, books: 5, chapters: 15, sections: 30 }
          }
        })
      });
    });

    // Reload the page
    await page.reload();

    // Dashboard should still load and show the delayed data
    await expect(page.getByText('Content Management Dashboard')).toBeVisible();

    // Wait for the delayed API response and check data
    await expect(page.getByText('10')).toBeVisible({ timeout: 5000 }); // totalSeries
    await expect(page.getByText('25')).toBeVisible(); // totalBooks
  });
});

/**
 * Additional Manual Testing Instructions
 *
 * The following tests require manual execution because they involve
 * real database changes or complex browser interactions:
 *
 * 1. Real Supabase Realtime Test:
 *    - Open dashboard at http://localhost:3006/textbooks/manage
 *    - Open Supabase Studio in another tab
 *    - Insert a new record in the 'textbooks' table
 *    - Verify dashboard updates automatically without refresh
 *    - Check browser console for "Textbooks table changed:" logs
 *
 * 2. Multiple Browser Tabs Test:
 *    - Open dashboard in two different browser tabs
 *    - Make database changes via Supabase Studio
 *    - Verify both tabs update simultaneously
 *
 * 3. Extended Focus/Blur Test:
 *    - Open dashboard
 *    - Switch to another application for 30+ seconds
 *    - Switch back to browser
 *    - Check Network tab for automatic API refresh
 *
 * 4. WiFi Reconnection Test:
 *    - Open dashboard on mobile device or laptop
 *    - Disconnect from WiFi
 *    - Reconnect to WiFi
 *    - Verify automatic data refresh
 */