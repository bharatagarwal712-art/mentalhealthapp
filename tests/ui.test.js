// tests/ui.test.js
const { test, expect } = require('@playwright/test');

test.describe('Onboarding Flow', () => {
  test('can complete onboarding from scratch', async ({ page }) => {
    // Navigate to the local server
    await page.goto('http://localhost:8080');

    // Step 1 should be visible
    await expect(page.locator('#onboarding')).toBeVisible();
    await expect(page.locator('.ob-step[data-step="1"]')).toBeVisible();

    // Click Continue
    await page.locator('.ob-step[data-step="1"] button.ob-btn').click();

    // Step 2 should be visible
    await expect(page.locator('.ob-step[data-step="2"]')).toBeVisible();

    // Enter name
    await page.locator('#ob-name').fill('Test Student');
    
    // Click Next
    await page.locator('.ob-step[data-step="2"] button.ob-btn').click();

    // Step 3 should be visible
    await expect(page.locator('.ob-step[data-step="3"]')).toBeVisible();

    // Select an exam (JEE)
    await page.locator('#ob-exams >> text=JEE').click();

    // Click Start Journey
    await page.locator('#ob-btn-start').click();

    // Onboarding should be hidden and app should be visible
    await expect(page.locator('#onboarding')).toBeHidden();
    await expect(page.locator('#app')).toBeVisible();

    // Greeting should show user's name
    await expect(page.locator('#greeting')).toContainText('Test Student');
  });
});

test.describe('Check‑in screen', () => {
  test.beforeEach(async ({ page }) => {
    // Bypass onboarding by writing to localStorage before page loads
    await page.addInitScript(() => {
      window.localStorage.setItem('kivi_data', JSON.stringify({
        profile: { name: "Test User", primaryExam: "JEE" },
        sessions: []
      }));
      window.localStorage.setItem('kivi_api_key', 'mock_api_key_value');
    });
  });

  test('has correct copy, mood selection, note input and navigation flow', async ({ page }) => {
    await page.goto('http://localhost:8080');

    // Verify the heading text
    await expect(page.locator('h2.checkin-subtitle')).toHaveText('How is your prep going today?');

    // Verify placeholder on textarea
    const note = page.locator('#checkin-note');
    await expect(note).toHaveAttribute('placeholder', 'Anything on your mind? (optional)');

    // Select a mood (e.g., Mood 4 – Feeling Good)
    await page.locator('button.mood-btn[data-val="4"]').click();
    await expect(page.locator('#mood-label')).toHaveText('Feeling Good');

    // Enter a note and ensure Summon button becomes enabled
    await note.fill('Need a quick revision on organic chemistry');
    await expect(page.locator('#summon-btn')).toBeEnabled();

    // Click Summon and verify Chat screen becomes active
    await page.locator('#summon-btn').click();
    await expect(page.locator('#screen-chat')).toHaveClass(/active/);
  });
});

