import { test, expect } from '@playwright/test';

// Creates a new work (mocking backend), then verifies it on the detail page
test('create work submits and navigates to detail', async ({ page }) => {
  // Auth stubs so Navbar renders as signed-in and protected actions work
  await page.route('**/auth/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 'u1',
          email: 'test@example.com',
          created_at: new Date('2024-01-01').toISOString(),
          user_metadata: { full_name: 'Test User' },
        },
      }),
    });
  });

  // Tag suggestion API used while typing tags
  await page.route('**/works/meta/tags**', async (route) => {
    const url = new URL(route.request().url());
    const q = url.searchParams.get('q') || '';
    const matches = ['React', 'Web', 'UI']
      .filter((t) => t.toLowerCase().includes(q.toLowerCase()))
      .map((name, i) => ({ tagId: `t${i + 1}`, name }));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(matches) });
  });

  // Submission endpoint returns a new work id
  await page.route('**/works', async (route) => {
    const req = route.request();
    if (req.method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ workId: 'new-001', title: 'My Test Work' }),
      });
      return;
    }
    // For GET /works on the homepage, return empty list to keep UI quiet
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  // Mock detail response that the UI loads after redirect
  await page.route('**/works/new-001', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        workId: 'new-001',
        title: 'My Test Work',
        description: 'Created from test',
        status: 'published',
        tags: [{ tagId: 't1', name: 'React' }],
        thumbnail: '',
        media: [],
      }),
    });
  });

  // First, open home and wait for session to be reflected in the UI
  await page.goto('/');
  await page.waitForResponse((res) => res.request().method() === 'GET' && res.url().endsWith('/auth/me'));
  await expect(page.getByRole('button', { name: 'Open profile menu' })).toBeVisible();

  // Navigate to create page via the visible UI to avoid race with ProtectedRoute
  await page.getByRole('button', { name: 'Open profile menu' }).click();
  await page.getByRole('menuitem', { name: 'Create new post' }).click();

  // Ensure we are on the create page and the form is ready
  await expect(page).toHaveURL(/\/works\/new$/);
  await page.locator('#title').waitFor({ state: 'visible', timeout: 15000 });

  // Fill required fields
  await page.locator('#title').fill('My Test Work');
  await page.locator('#desc').fill('Created from test');
  await page.locator('select.cw-select').selectOption('published');

  // Optionally add a tag via suggestions
  await page.locator('.cw-taginput .cw-input').fill('Rea');
  await page.getByRole('button', { name: 'React' }).click();

  // Submit (button text can vary due to locale; target by form primary button)
  await page.locator('.cw-actions button.cw-btn').click();

  // Redirect to detail page and verify title
  await expect(page).toHaveURL(/\/works\/new-001$/);
  await expect(page.getByRole('heading', { name: 'My Test Work' })).toBeVisible();
});
