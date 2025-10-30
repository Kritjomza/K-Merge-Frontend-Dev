import { test, expect } from '@playwright/test';

// Simulates email/password login and verifies Profile page renders with user data
test('login redirects to profile and shows user info', async ({ page }) => {
  let loggedIn = false;

  // Stub the login endpoint and flip session state
  await page.route('**/auth/login/email', async (route) => {
    loggedIn = true;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
      headers: { 'Set-Cookie': 'sid=dummy; Path=/;' },
    });
  });

  // Stub user session fetch used by AuthContext.refetchUser
  await page.route('**/auth/me', async (route) => {
    if (!loggedIn) {
      return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({}) });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 'u1',
          email: 'test@example.com',
          created_at: new Date('2024-01-01').toISOString(),
          user_metadata: { full_name: 'Test User', location: 'Bangkok' },
        },
      }),
    });
  });

  // Additional calls on profile page
  await page.route('**/auth/profile', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ displayName: 'Test User', bio: 'Hello!' }),
    });
  });

  await page.route('**/works/my', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  // Go directly to the login page to avoid navbar timing
  await page.goto('/login');

  // Fill email and password by stable placeholders/selectors
  await page.getByPlaceholder('name@student.kmutt.ac.th').fill('test@example.com');
  await page.locator('form input[autocomplete="current-password"]').fill('password123');

  // Submit the form
  await page.locator('form button[type="submit"]').click();

  // Expect redirect to profile and user name visible
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole('heading', { name: 'Test User' })).toBeVisible();
  await expect(page.getByText('test@example.com')).toBeVisible();
});
