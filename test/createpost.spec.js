import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

// รองรับ ES Modules เพื่อให้มี __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('create post', async ({ page }) => {
  await page.goto('http://localhost:5173/');
  await page.getByRole('link', { name: 'Sign In' }).click();
  await page.getByRole('textbox', { name: 'อีเมลหรือชื่อผู้ใช้' }).fill('hollandt523@gmail.com');
  await page.getByRole('textbox', { name: 'รหัสผ่าน' }).fill('123456');
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();

  await page.getByRole('button', { name: 'Open profile menu' }).click();
  await page.getByRole('menuitem', { name: 'Create new post' }).click();

  await page.getByRole('textbox', { name: 'ชื่อโพส' }).fill('Test');
  await page.getByRole('textbox', { name: 'รายละเอียด' }).fill('detail of test');
  await page.getByRole('combobox').selectOption('published');

  const filePath = path.resolve(__dirname, '../test/picture/unnamed.jpg');
  await page.locator('input[type="file"]').first().setInputFiles(filePath);
  await page.getByRole('button', { name: 'สร้างโพส' }).click();

  await page.waitForURL(/\/works\/[a-z0-9-]+$/);
  await expect(page).toHaveURL(/\/works\/[a-z0-9-]+$/);
  await expect(page.locator('h1')).toContainText('Test');
});
