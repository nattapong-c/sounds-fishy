import { test, expect } from '@playwright/test';

test.describe('Lobby Flow - Phase 1 E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Go to landing page before each test
    await page.goto('/');
  });

  test.describe('Landing Page', () => {
    test('should display landing page with create and join options', async ({ page }) => {
      // Check title
      await expect(page).toHaveTitle(/Sounds Fishy/);

      // Check main heading
      await expect(page.getByText('Sounds Fishy')).toBeVisible();

      // Check fish animations
      const fishEmojis = page.locator('text=🐟');
      await expect(fishEmojis.first()).toBeVisible();

      // Check buttons exist
      await expect(page.getByRole('button', { name: /create room/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /join room/i })).toBeVisible();

      // Check instructions
      await expect(page.getByText(/Guesser/i)).toBeVisible();
      await expect(page.getByText(/Big Fish/i)).toBeVisible();
      await expect(page.getByText(/Red Herring/i)).toBeVisible();
    });

    test('should show input form when Create Room is selected', async ({ page }) => {
      // Create room form should be visible by default
      await expect(page.getByPlaceholder('Your name')).toBeVisible();
      await expect(page.getByRole('button', { name: /create & host/i })).toBeVisible();
    });

    test('should show join form when Join Room is clicked', async ({ page }) => {
      // Click join room button
      await page.getByRole('button', { name: /join room/i }).click();

      // Check join form appears
      await expect(page.getByPlaceholder('Room code')).toBeVisible();
      await expect(page.getByPlaceholder('Your name')).toHaveCount(2); // One in join form
      await expect(page.getByRole('button', { name: /join/i })).toBeVisible();
    });

    test('should show error when creating room without name', async ({ page }) => {
      // Try to create room without name
      await page.getByRole('button', { name: /create & host/i }).click();

      // Should show error
      await expect(page.getByText(/please enter your name/i)).toBeVisible();
    });

    test('should show error when joining room without code or name', async ({ page }) => {
      // Switch to join form
      await page.getByRole('button', { name: /join room/i }).click();

      // Try to join without filling fields
      await page.getByRole('button', { name: /join/i }).click();

      // Should show error
      await expect(page.getByText(/please enter room code and your name/i)).toBeVisible();
    });
  });

  test.describe('Create Room Flow', () => {
    test('should create a new room successfully', async ({ page }) => {
      const testName = `TestHost-${Date.now()}`;

      // Enter host name
      await page.getByPlaceholder('Your name').fill(testName);

      // Click create button
      await page.getByRole('button', { name: /create & host/i }).click();

      // Should navigate to lobby
      await expect(page).toHaveURL(/\/room\/[A-Z0-9]{6}\/lobby/);

      // Should show room code
      const roomCodeElement = page.locator('span.font-mono');
      await expect(roomCodeElement).toBeVisible();

      // Room code should be 6 characters
      const roomCode = await roomCodeElement.textContent();
      expect(roomCode?.trim()).toHaveLength(6);
    });

    test('should display host badge in lobby', async ({ page }) => {
      const testName = `Host-${Date.now()}`;

      // Create room
      await page.getByPlaceholder('Your name').fill(testName);
      await page.getByRole('button', { name: /create & host/i }).click();

      // Wait for lobby to load
      await page.waitForURL(/\/room\/[A-Z0-9]{6}\/lobby/);

      // Should show host badge
      await expect(page.getByText('👑 Host')).toBeVisible();
    });

    test('should show ready button in lobby', async ({ page }) => {
      const testName = `Host-${Date.now()}`;

      // Create room
      await page.getByPlaceholder('Your name').fill(testName);
      await page.getByRole('button', { name: /create & host/i }).click();

      // Wait for lobby
      await page.waitForURL(/\/room\/[A-Z0-9]{6}\/lobby/);

      // Should show ready button
      await expect(page.getByRole('button', { name: /ready/i })).toBeVisible();
    });

    test('should show start game button for host (disabled until min players)', async ({ page }) => {
      const testName = `Host-${Date.now()}`;

      // Create room
      await page.getByPlaceholder('Your name').fill(testName);
      await page.getByRole('button', { name: /create & host/i }).click();

      // Wait for lobby
      await page.waitForURL(/\/room\/[A-Z0-9]{6}\/lobby/);

      // Host should see start game button (or waiting message)
      const startButton = page.getByRole('button', { name: /start game/i });
      const waitingText = page.getByText(/waiting for players/i);

      // Either button exists (disabled) or waiting message shows
      if (await startButton.isVisible()) {
        await expect(startButton).toBeDisabled();
      } else {
        await expect(waitingText).toBeVisible();
      }
    });
  });

  test.describe('Join Room Flow', () => {
    test('should join existing room with valid code', async ({ page, context }) => {
      // Create room first
      const hostPage = await context.newPage();
      await hostPage.goto('/');
      const hostName = `Host-${Date.now()}`;
      await hostPage.getByPlaceholder('Your name').fill(hostName);
      await hostPage.getByRole('button', { name: /create & host/i }).click();
      await hostPage.waitForURL(/\/room\/[A-Z0-9]{6}\/lobby/);

      // Get room code
      const roomCodeElement = hostPage.locator('span.font-mono');
      const roomCode = await roomCodeElement.textContent();

      // Join with second player
      const playerName = `Player-${Date.now()}`;
      await page.getByRole('button', { name: /join room/i }).click();
      await page.getByPlaceholder('Room code').fill(roomCode?.trim() || '');
      await page.getByPlaceholder('Your name').fill(playerName);
      await page.getByRole('button', { name: /join/i }).click();

      // Should navigate to lobby
      await expect(page).toHaveURL(`/room/${roomCode?.trim()}/lobby`);

      // Should see both players
      await expect(page.getByText(hostName)).toBeVisible();
      await expect(page.getByText(playerName)).toBeVisible();
    });

    test('should show error when joining invalid room code', async ({ page }) => {
      // Switch to join form
      await page.getByRole('button', { name: /join room/i }).click();

      // Enter invalid room code
      await page.getByPlaceholder('Room code').fill('INVALID');
      await page.getByPlaceholder('Your name').fill('TestPlayer');
      await page.getByRole('button', { name: /join/i }).click();

      // Should show error
      await expect(page.getByText(/room not found|failed to join/i)).toBeVisible();
    });

    test('should auto-uppercase room code input', async ({ page }) => {
      // Switch to join form
      await page.getByRole('button', { name: /join room/i }).click();

      // Enter lowercase room code
      const lowercaseCode = 'abc123';
      await page.getByPlaceholder('Room code').fill(lowercaseCode);

      // Value should be uppercased
      const inputValue = await page.getByPlaceholder('Room code').inputValue();
      expect(inputValue).toBe(lowercaseCode.toUpperCase());
    });
  });

  test.describe('Lobby Features', () => {
    test('should copy room code to clipboard', async ({ page, context }) => {
      // Create room
      await page.getByPlaceholder('Your name').fill('TestHost');
      await page.getByRole('button', { name: /create & host/i }).click();
      await page.waitForURL(/\/room\/[A-Z0-9]{6}\/lobby/);

      // Grant clipboard permissions
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);

      // Click copy button
      await page.getByRole('button', { name: /copy/i }).click();

      // Check clipboard (note: this may not work in all test environments)
      const handle = await page.evaluateHandle(() => navigator.clipboard.readText());
      const clipboardContent = await handle.jsonValue();

      // Get room code from page
      const roomCodeElement = page.locator('span.font-mono');
      const roomCode = await roomCodeElement.textContent();

      expect(clipboardContent.trim()).toBe(roomCode?.trim());
    });

    test('should leave room and return to home', async ({ page }) => {
      // Create room
      await page.getByPlaceholder('Your name').fill('TestHost');
      await page.getByRole('button', { name: /create & host/i }).click();
      await page.waitForURL(/\/room\/[A-Z0-9]{6}\/lobby/);

      // Click leave button
      await page.getByRole('button', { name: /leave/i }).click();

      // Should return to home
      await expect(page).toHaveURL('/');
    });

    test('should toggle ready status', async ({ page }) => {
      // Create room
      await page.getByPlaceholder('Your name').fill('TestHost');
      await page.getByRole('button', { name: /create & host/i }).click();
      await page.waitForURL(/\/room\/[A-Z0-9]{6}\/lobby/);

      // Click ready button
      await page.getByRole('button', { name: /ready/i }).click();

      // Button should change to show ready state
      await expect(page.getByRole('button', { name: /✓ ready/i })).toBeVisible();
    });

    test('should show player count', async ({ page }) => {
      // Create room
      await page.getByPlaceholder('Your name').fill('TestHost');
      await page.getByRole('button', { name: /create & host/i }).click();
      await page.waitForURL(/\/room\/[A-Z0-9]{6}\/lobby/);

      // Should show player count (1/8 or similar)
      await expect(page.getByText(/players?\s*\(\d+\/8\)/i)).toBeVisible();
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Check landing page
      await expect(page.getByText('Sounds Fishy')).toBeVisible();
      await expect(page.getByRole('button', { name: /create room/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /join room/i })).toBeVisible();

      // Create room
      await page.getByPlaceholder('Your name').fill('TestHost');
      await page.getByRole('button', { name: /create & host/i }).click();
      await page.waitForURL(/\/room\/[A-Z0-9]{6}\/lobby/);

      // Check lobby on mobile
      await expect(page.getByText('Lobby')).toBeVisible();
      await expect(page.getByRole('button')).toBeVisible();
    });

    test('should have minimum 44px touch targets', async ({ page }) => {
      // Create room
      await page.getByPlaceholder('Your name').fill('TestHost');
      await page.getByRole('button', { name: /create & host/i }).click();
      await page.waitForURL(/\/room\/[A-Z0-9]{6}\/lobby/);

      // Check button sizes
      const buttons = page.locator('button');
      const count = await buttons.count();

      for (let i = 0; i < count; i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          const box = await button.boundingBox();
          if (box) {
            // Minimum 44px height for touch targets
            expect(box.height).toBeGreaterThanOrEqual(44);
          }
        }
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate offline mode
      await page.context().setOffline(true);

      // Try to create room
      await page.getByPlaceholder('Your name').fill('TestHost');
      await page.getByRole('button', { name: /create & host/i }).click();

      // Should show error or loading state (not crash)
      await expect(page.getByText(/failed|error|offline/i)).toBeVisible({ timeout: 5000 });
    });

    test('should handle invalid host name', async ({ page }) => {
      // Enter only spaces
      await page.getByPlaceholder('Your name').fill('   ');
      await page.getByRole('button', { name: /create & host/i }).click();

      // Should show error
      await expect(page.getByText(/please enter your name/i)).toBeVisible();
    });
  });

  test.describe('Animations & Visual Effects', () => {
    test('should have fish swim animation', async ({ page }) => {
      await page.goto('/');

      // Check for fish emoji with animation class
      const fish = page.locator('.fish-swim').first();
      await expect(fish).toBeVisible();

      // Check animation is applied (check computed style)
      const animation = await fish.evaluate((el) =>
        window.getComputedStyle(el).animationName
      );
      expect(animation).toBeTruthy();
    });

    test('should have button hover effects', async ({ page }) => {
      await page.goto('/');

      const button = page.getByRole('button', { name: /create room/i }).first();

      // Get initial state
      const initialScale = await button.evaluate((el) =>
        window.getComputedStyle(el).transform
      );

      // Hover over button
      await button.hover();

      // Scale should change (hover effect)
      await expect(button).toHaveClass(/hover:scale-105|scale-105/);
    });
  });
});
