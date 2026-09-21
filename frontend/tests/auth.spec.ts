// tests/auth.spec.ts
import { test, expect } from '@playwright/test';

function uniqueEmail() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `testuser_${timestamp}_${random}@example.com`;
}

const validPassword = 'TestPass123!';

test.describe('Authentication Flow', () => {
  test.describe.configure({ mode: 'serial' });
  let email: string;

  test.beforeAll(async () => {
    email = uniqueEmail();
  });

  test('Register a new user and land on the dashboard', async ({ page }) => {
    await page.goto('/register');
    await expect(page).toHaveURL(/\/register/);

    await page.fill('#register-fullname', 'Test User');
    await page.fill('#register-email', email);
    await page.fill('#register-password', validPassword);
    await page.fill('#register-confirm', validPassword);
    await page.click('button:has-text("Create Account")');

    // Firebase signs the new user in, so sending them to /login would ask an
    // already-authenticated user to log in again.
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });

    // The URL changes before the lazily-loaded Dashboard chunk has compiled, and
    // the banner auto-dismisses 6s after it mounts. Wait for the page to be up
    // first so the assertion isn't racing a cold dev-server compile.
    await expect(page.getByRole('heading', { name: /Total Tasks/ })).toBeVisible({ timeout: 40000 });
    await expect(page.getByRole('status')).toContainText('Registration Successful');
  });

  test('Register rejects a short password before calling Firebase', async ({ page }) => {
    await page.goto('/register');
    await page.fill('#register-fullname', 'Short Pass');
    await page.fill('#register-email', uniqueEmail());
    await page.fill('#register-password', 'abc');
    await page.fill('#register-confirm', 'abc');
    await page.click('button:has-text("Create Account")');

    await expect(page.getByRole('alert')).toContainText('at least 6 characters');
    await expect(page).toHaveURL(/\/register/);
  });

  test('Register shows a live mismatch hint while typing', async ({ page }) => {
    await page.goto('/register');
    await page.fill('#register-password', validPassword);
    await page.fill('#register-confirm', 'something-else');

    await expect(page.locator('#confirm-mismatch')).toHaveText('Passwords do not match.');

    await page.fill('#register-confirm', validPassword);
    await expect(page.locator('#confirm-mismatch')).toHaveCount(0);
  });

  test('Login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#login-email', email);
    await page.fill('#login-password', validPassword);
    await page.click('button:has-text("Login")');

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    await expect(page.getByRole('heading', { name: /Total Tasks/ })).toBeVisible({ timeout: 40000 });
    await expect(page.getByRole('status')).toContainText('Login Successful');
  });

  test('Login with a wrong password shows a friendly message, not a Firebase code', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#login-email', email);
    await page.fill('#login-password', 'WrongPassword!');
    await page.click('button:has-text("Login")');

    const alert = page.getByRole('alert');
    await expect(alert).toContainText('Email or password is incorrect.');
    // The raw provider code must never reach the user.
    await expect(alert).not.toContainText('auth/');
  });

  test('Login with empty fields shows validation', async ({ page }) => {
    await page.goto('/login');
    await page.click('button:has-text("Login")');

    await expect(page.getByRole('alert')).toContainText(
      'Please enter both your email and password.'
    );
  });

  test('Login with an invalid email format shows a friendly message', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#login-email', 'invalid-email');
    await page.fill('#login-password', validPassword);
    await page.click('button:has-text("Login")');

    const alert = page.getByRole('alert');
    await expect(alert).toContainText("That email address doesn't look right.");
    await expect(alert).not.toContainText('auth/');
  });

  test('Submit button locks while the request is in flight', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#login-email', email);
    await page.fill('#login-password', validPassword);

    const button = page.locator('button[type="submit"]');
    await button.click();
    await expect(button).toBeDisabled();
  });

  test('Every auth field is labelled and autocompletable', async ({ page }) => {
    await page.goto('/register');

    for (const id of ['#register-fullname', '#register-email', '#register-password', '#register-confirm']) {
      const field = page.locator(id);
      await expect(field).toHaveAttribute('autocomplete', /.+/);
      // A connected <label> is what makes the field usable with a screen reader.
      const labelCount = await page.locator(`label[for="${id.slice(1)}"]`).count();
      expect(labelCount, `${id} should have a connected label`).toBe(1);
    }
  });

  test('A signed-in user cannot go back to the login page', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#login-email', email);
    await page.fill('#login-password', validPassword);
    await page.click('button:has-text("Login")');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });

    await page.goto('/login');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
  });

  test('Logout clears the session and protects the dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('#login-email', email);
    await page.fill('#login-password', validPassword);
    await page.click('button:has-text("Login")');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });

    await page.click('[data-testid="logout-btn"]');
    await expect(page).toHaveURL(/\/login/, { timeout: 20000 });

    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 20000 });
  });
});
