import { test, expect } from '@playwright/test';

// Renders the home page with mocked works and navigates to a detail view
test('home shows works and opens a work detail', async ({ page }) => {
  // Mock list of works for the homepage grid
  await page.route('**/works', async (route) => {
    // If this is a detail route, let other handler catch it
    const url = new URL(route.request().url());
    if (/\/works\/[A-Za-z0-9-]+$/.test(url.pathname)) return route.fallback();

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          workId: 'abc123',
          title: 'Student Works Online Gallery',
          description: 'A portal for student projects',
          status: 'published',
          tags: [{ tagId: 't1', name: 'React' }, { tagId: 't2', name: 'Web' }],
          thumbnail: null,
        },
      ]),
    });
  });

  // Mock detail endpoint for the selected work
  await page.route('**/works/abc123', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        workId: 'abc123',
        title: 'Student Works Online Gallery',
        description: 'Detailed description here',
        status: 'published',
        tags: [{ tagId: 't1', name: 'React' }],
        thumbnail: '',
        media: [],
      }),
    });
  });

  await page.goto('/');

  // Card should appear with the mocked title
  await expect(page.getByRole('heading', { name: 'Student Works Online Gallery' })).toBeVisible();

  // Click the card to open detail page
  await page.getByRole('heading', { name: 'Student Works Online Gallery' }).click();

  // Expect to land on work view with title visible
  await expect(page.getByRole('heading', { name: 'Student Works Online Gallery' })).toBeVisible();
});

