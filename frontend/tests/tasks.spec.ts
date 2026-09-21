// tests/tasks.spec.ts
import { test, expect, Page } from '@playwright/test';

function uniqueEmail() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `testuser_tasks_${timestamp}_${random}@example.com`;
}

const validPassword = 'TestPass123!';

// AddTaskModal still uses a native alert for its own title validation, so its
// dialogs are accepted rather than left to block the run.
function acceptDialogs(page: Page) {
  page.on('dialog', (dialog) => dialog.accept());
}

async function registerAndSignIn(page: Page) {
  const email = uniqueEmail();

  await page.goto('/register');
  await page.fill('#register-fullname', 'QA Tester');
  await page.fill('#register-email', email);
  await page.fill('#register-password', validPassword);
  await page.fill('#register-confirm', validPassword);
  await page.click('button:has-text("Create Account")');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });

  return email;
}

async function addTask(
  page: Page,
  opts: { title: string; description: string; priority: string; category: string; dueDate: string }
) {
  await page.click('button:has-text("+ Add Task")');
  await page.fill('input[placeholder="Example: Complete Internship Report"]', opts.title);
  await page.fill('textarea[placeholder="Describe the task..."]', opts.description);
  await page.selectOption('div:has(> label:has-text("Priority")) select', opts.priority);
  await page.selectOption('div:has(> label:has-text("Category")) select', opts.category);
  await page.fill('input[type="date"]', opts.dueDate);
  await page.click('button:has-text("Save Task")');
  await expect(page.locator(`h3:has-text("${opts.title}")`).first()).toBeVisible({ timeout: 15000 });
}

const dayOffset = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
};

test.describe('Tasks page', () => {
  test.describe.configure({ mode: 'serial' });

  test('create, filter, search, sort, complete and delete tasks', async ({ page }) => {
    acceptDialogs(page);
    await registerAndSignIn(page);

    await page.goto('/tasks');
    await expect(page).toHaveURL(/\/tasks/);

    // Empty state only appears once loading finishes — it must not flash first.
    await expect(page.getByText('No Tasks Yet')).toBeVisible({ timeout: 15000 });

    await addTask(page, {
      title: 'College High Task',
      description: 'High priority college assignment',
      priority: 'High',
      category: 'College',
      dueDate: dayOffset(0),
    });

    await addTask(page, {
      title: 'Personal Medium Task',
      description: 'Medium priority personal chore',
      priority: 'Medium',
      category: 'Personal',
      dueDate: dayOffset(1),
    });

    await addTask(page, {
      title: 'Internship Low Task',
      description: 'Low priority internship task',
      priority: 'Low',
      category: 'Internship',
      dueDate: dayOffset(5),
    });

    // --- category filter ---
    await page.click('button:has-text("College")');
    await expect(page.locator('h3:has-text("College High Task")')).toBeVisible();
    await expect(page.locator('h3:has-text("Personal Medium Task")')).toHaveCount(0);

    await page.click('button:has-text("All")');
    await expect(page.locator('h3:has-text("Personal Medium Task")')).toBeVisible();

    // --- search ---
    await page.fill('#task-search', 'College');
    await expect(page.locator('h3:has-text("College High Task")')).toBeVisible();
    await expect(page.locator('h3:has-text("Internship Low Task")')).toHaveCount(0);
    await page.fill('#task-search', '');
    await expect(page.locator('h3:has-text("Internship Low Task")')).toBeVisible();

    // --- sorting ---
    await page.selectOption('#task-sort', 'highPriority');
    let cards = page.locator('h3');
    await expect(cards.nth(0)).toHaveText('College High Task');
    await expect(cards.nth(2)).toHaveText('Internship Low Task');

    await page.selectOption('#task-sort', 'lowPriority');
    cards = page.locator('h3');
    await expect(cards.nth(0)).toHaveText('Internship Low Task');
    await expect(cards.nth(2)).toHaveText('College High Task');

    await page.selectOption('#task-sort', 'created');

    // --- complete a task ---
    const collegeCard = page.locator('div.group:has-text("College High Task")');
    await collegeCard.hover();
    await collegeCard.locator('button[title="Complete Task"]').click();

    await expect(page.locator('h2:has-text("Completed Tasks")')).toBeVisible({ timeout: 15000 });
    const completed = page.locator('h2:has-text("Completed Tasks") + div h3');
    await expect(completed).toHaveText('College High Task');

    // --- delete via the confirmation dialog (no longer window.confirm) ---
    const personalCard = page.locator('div.group:has-text("Personal Medium Task")');
    await personalCard.hover();
    await personalCard.locator('button[title="Delete Task"]').click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Delete this task?');

    // Cancelling must leave the task alone.
    await dialog.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('h3:has-text("Personal Medium Task")')).toBeVisible();

    await personalCard.hover();
    await personalCard.locator('button[title="Delete Task"]').click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(page.locator('h3:has-text("Personal Medium Task")')).toHaveCount(0, { timeout: 15000 });

    // --- calendar still renders ---
    await expect(page.locator('h2:has-text("Task Calendar")')).toBeVisible();
  });

  test('completed tasks respect the "Newest First" sort', async ({ page }) => {
    // Regression guard: the completed list used to silently ignore this option
    // because its sort function was a copy that never got the 'created' branch.
    acceptDialogs(page);
    await registerAndSignIn(page);
    await page.goto('/tasks');
    await expect(page.getByText('No Tasks Yet')).toBeVisible({ timeout: 15000 });

    await addTask(page, {
      title: 'Older Completed',
      description: 'first',
      priority: 'Low',
      category: 'Other',
      dueDate: dayOffset(3),
    });
    await addTask(page, {
      title: 'Newer Completed',
      description: 'second',
      priority: 'High',
      category: 'Other',
      dueDate: dayOffset(1),
    });

    for (const title of ['Older Completed', 'Newer Completed']) {
      const card = page.locator(`div.group:has-text("${title}")`);
      await card.hover();
      await card.locator('button[title="Complete Task"]').click();
      await expect(page.locator('h2:has-text("Completed Tasks")')).toBeVisible({ timeout: 15000 });
    }

    await page.selectOption('#task-sort', 'created');
    const completed = page.locator('h2:has-text("Completed Tasks") + div h3');
    await expect(completed.nth(0)).toHaveText('Newer Completed');
    await expect(completed.nth(1)).toHaveText('Older Completed');
  });

  test('search and sort controls are labelled', async ({ page }) => {
    acceptDialogs(page);
    await registerAndSignIn(page);
    await page.goto('/tasks');

    await expect(page.locator('label[for="task-search"]')).toHaveCount(1);
    await expect(page.locator('label[for="task-sort"]')).toHaveCount(1);
  });
});
