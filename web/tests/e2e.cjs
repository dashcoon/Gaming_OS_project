/*
 * End-to-end smoke test for the GamingOS web desktop.
 * Builds nothing itself: run `npm run build` first, then `npm run test:e2e`.
 * Serves dist/ with `vite preview` and drives it with Playwright (Chromium).
 */
const { spawn } = require('node:child_process');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const PORT = 4173;
const BASE = `http://localhost:${PORT}`;

async function waitForServer(url, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Server did not start at ${url}`);
}

const results = [];
async function test(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  ✓ ${name}`);
  } catch (err) {
    results.push({ name, ok: false });
    console.log(`  ✗ ${name}\n    ${String(err && err.stack ? err.stack : err).split("\n").slice(0, 14).join('\n    ')}`);
  }
}

(async () => {
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: `${__dirname}/..`,
    stdio: 'ignore',
    detached: true,
  });
  const browser = await chromium.launch();
  try {
    await waitForServer(BASE);
    const errors = [];

    const newPage = async (query = '?session=desktop') => {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(`${BASE}/${query}`);
      // Wait for the shell to render so its keyboard listeners are attached.
      if (query.includes('session=desktop')) await page.getByRole('navigation', { name: 'Dock' }).waitFor();
      return page;
    };
    const windowEl = (page, title) => page.locator(`section[aria-label="${title}"]`);
    const styleOf = (loc) => loc.evaluate((e) => ({ left: e.style.left, top: e.style.top, width: e.style.width, height: e.style.height }));
    /** Polls a window's geometry until it matches (state updates render asynchronously). */
    const expectBounds = async (loc, expected, timeoutMs = 2000) => {
      const start = Date.now();
      let actual;
      while (Date.now() - start < timeoutMs) {
        actual = await styleOf(loc);
        if (JSON.stringify(actual) === JSON.stringify(expected)) return;
        await new Promise((r) => setTimeout(r, 50));
      }
      assert.deepEqual(actual, expected);
    };

    console.log('GamingOS e2e');

    await test('boots, shows the lock screen and signs in', async () => {
      const page = await newPage('');
      await page.getByText('Press any key to skip').waitFor();
      await page.keyboard.press('Space');
      const lock = page.getByRole('dialog', { name: 'Lock screen' });
      await lock.waitFor();
      await page.keyboard.press('Enter'); // reveals the password field without signing in
      await page.getByLabel('Password').waitFor();
      assert.equal(await lock.count(), 1, 'the revealing key press must not sign in');
      await page.getByLabel('Password').fill('hunter2');
      await page.getByLabel('Password').press('Enter');
      await lock.waitFor({ state: 'detached' });
      await page.getByRole('navigation', { name: 'Dock' }).waitFor();
      await page.close();
    });

    await test('desktop icon opens Steam and a game can be launched', async () => {
      const page = await newPage();
      await page.getByRole('list', { name: 'Desktop' }).getByRole('button', { name: 'Steam' }).dblclick();
      await windowEl(page, 'Steam').waitFor();
      await page.getByRole('button', { name: /^Play$/ }).first().click();
      await page.getByRole('navigation', { name: 'Dock' }).getByRole('button', { name: /^Playing / }).waitFor({ timeout: 6000 });
      await page.close();
    });

    await test('spotlight finds and opens the terminal', async () => {
      const page = await newPage();
      await page.keyboard.press('Control+k');
      const search = page.getByRole('dialog', { name: 'Search' });
      await search.waitFor();
      await search.getByRole('textbox', { name: 'Search' }).fill('term');
      await page.keyboard.press('Enter');
      await windowEl(page, 'Terminal').waitFor();
      assert.equal(await search.count(), 0);
      await page.close();
    });

    await test('terminal runs commands and controls apps', async () => {
      const page = await newPage();
      await page.keyboard.press('Control+Alt+t');
      const input = page.getByLabel('Terminal input');
      await input.fill('neofetch');
      await input.press('Enter');
      await page.getByText('GamingOS 2.0 "Overdrive"').waitFor();
      await input.fill('launch about');
      await input.press('Enter');
      await windowEl(page, 'About This PC').waitFor();
      await input.fill('kill about');
      await input.press('Enter');
      await windowEl(page, 'About This PC').waitFor({ state: 'detached' });
      await input.fill('frobnicate');
      await input.press('Enter');
      await page.getByText('frobnicate: command not found').waitFor();
      await page.close();
    });

    await test('windows snap to half, quarter and maximize', async () => {
      const page = await newPage();
      await page.keyboard.press('Control+Alt+t');
      const win = windowEl(page, 'Terminal');
      await win.waitFor();
      const header = win.locator('header').first();
      const box = await header.boundingBox();
      // Drag to the left edge (middle height) -> left half.
      await page.mouse.move(box.x + box.width / 2, box.y + 15);
      await page.mouse.down();
      await page.mouse.move(400, 450, { steps: 5 });
      await page.mouse.move(1, 450, { steps: 5 });
      await page.mouse.up();
      await expectBounds(win, { left: '0px', top: '0px', width: '720px', height: '776px' });
      // Snap layout flyout -> top-right quarter.
      await win.getByRole('button', { name: 'Maximize' }).hover();
      await page.getByRole('menu', { name: 'Snap layouts' }).waitFor();
      await page.getByRole('menuitem', { name: 'Top right' }).click();
      await expectBounds(win, { left: '720px', top: '0px', width: '720px', height: '388px' });
      // Double-click title -> maximize.
      await header.dblclick({ position: { x: 300, y: 20 } });
      await expectBounds(win, { left: '0px', top: '0px', width: '1440px', height: '776px' });
      await page.close();
    });

    await test('dock minimizes and restores the focused window', async () => {
      const page = await newPage();
      const dock = page.getByRole('navigation', { name: 'Dock' });
      await dock.getByRole('button', { name: 'Settings' }).click();
      const win = windowEl(page, 'Settings');
      await win.waitFor();
      await dock.getByRole('button', { name: 'Settings' }).click();
      await page.locator('section[aria-label="Settings"][aria-hidden="true"]').waitFor({ state: 'attached' });
      await dock.getByRole('button', { name: 'Settings' }).click();
      await page.locator('section[aria-label="Settings"][aria-hidden="false"]').waitFor({ state: 'attached' });
      await page.close();
    });

    await test('control center toggles quick settings and logs notifications', async () => {
      const page = await newPage();
      await page.getByRole('button', { name: 'Control Center' }).click();
      const dnd = page.getByRole('button', { name: /Do Not Disturb/ });
      assert.equal(await dnd.getAttribute('aria-pressed'), 'false');
      await dnd.click();
      assert.equal(await dnd.getAttribute('aria-pressed'), 'true');
      await page.getByRole('button', { name: /Turbo/ }).click();
      assert.equal(await page.getByRole('button', { name: /Turbo/ }).getAttribute('aria-pressed'), 'true');
      await page.getByRole('button', { name: 'Neon Cyan' }).click();
      const accent = await page.evaluate(() => document.documentElement.style.getPropertyValue('--accent'));
      assert.equal(accent.trim(), '34 211 238');
      await page.close();
    });

    await test('desktop right-click menu changes the wallpaper', async () => {
      const page = await newPage();
      await page.mouse.click(700, 500, { button: 'right' });
      const menu = page.getByRole('menu', { name: 'Desktop menu' });
      await menu.waitFor();
      await menu.getByRole('button', { name: 'Wallpaper Aurora' }).click();
      assert.equal(await menu.count(), 0);
      const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('gamingos.settings.v1')).wallpaper);
      assert.equal(saved, 'aurora');
      await page.close();
    });

    await test('firefox shows a fallback card for sites that block embedding', async () => {
      const page = await newPage();
      await page.getByRole('navigation', { name: 'Dock' }).getByRole('button', { name: 'Firefox' }).click();
      const win = windowEl(page, 'Firefox');
      await win.getByLabel('Address bar').fill('github.com');
      await win.getByLabel('Address bar').press('Enter');
      await win.getByText('does not allow itself to be displayed').waitFor();
      await page.close();
    });

    await test('no uncaught page errors', async () => {
      assert.deepEqual(errors, []);
    });
  } finally {
    await browser.close();
    try {
      process.kill(-server.pid);
    } catch {
      // already gone
    }
  }

  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})();
