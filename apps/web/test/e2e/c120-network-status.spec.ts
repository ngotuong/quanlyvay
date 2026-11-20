import { test, expect, type Page } from "@playwright/test";

const probe = "**/api/connectivity";
const success = { status: 204, headers: { "x-qlv-connectivity": "1", "cache-control": "no-store" } };

async function falseOffline(page: Page) {
  await page.addInitScript(() => Object.defineProperty(navigator, "onLine", { get: () => false }));
}

test("C120 public probe is uncached, empty and does not refresh Auth cookies", async ({ request }) => {
  const response = await request.get("/api/connectivity", { headers: { cookie: "unrelated=synthetic" } });
  expect(response.status()).toBe(204);
  expect(response.headers()["x-qlv-connectivity"]).toBe("1");
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(response.headers()["set-cookie"]).toBeUndefined();
  expect(await response.body()).toHaveLength(0);
});

test("C120 false-offline verifies the real server, retries and recovers without online event", async ({ page }, info) => {
  await falseOffline(page);
  let failing = false;
  let count = 0;
  await page.route(probe, async route => {
    count += 1;
    expect(route.request().headers()["cookie"]).toBeUndefined();
    if (failing) await route.abort("internetdisconnected");
    else await route.continue();
  });
  await page.context().addCookies([{ name: "synthetic", value: "private", url: "http://127.0.0.1:3101" }]);
  const initial = page.waitForResponse(r => r.url().endsWith("/api/connectivity"));
  await page.goto("/login");
  expect((await initial).status()).toBe(204);
  await expect(page.locator(".network-notice")).toHaveCount(0);
  await expect(page.locator(".application-boot-loading")).toHaveCount(0);
  await page.clock.install();
  // Focus is another verification trigger, even while the browser still reports offline.
  failing = true;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.locator(".network-notice")).toBeVisible();
  const before = count;
  failing = false;
  await page.clock.fastForward(15001);
  await expect(page.locator(".network-notice")).toHaveCount(0);
  expect(count).toBeGreaterThan(before);
  expect(await page.evaluate(() => navigator.onLine)).toBe(false);
  await page.screenshot({ path: info.outputPath("c120-false-offline-recovered.png"), fullPage: true });
});

test("C120 real offline warns and reconnect clears the warning", async ({ page, context }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Đăng nhập", exact: true })).toBeVisible();
  await context.setOffline(true);
  await expect(page.locator(".network-notice")).toBeVisible();
  await context.setOffline(false);
  await expect(page.locator(".network-notice")).toHaveCount(0);
});

for (const failure of ["html", "server", "redirect"] as const) {
  test(`C120 ${failure} response is not mistaken for a successful probe`, async ({ page }) => {
    await falseOffline(page);
    await page.route(probe, route => route.fulfill(failure === "redirect"
      ? { status: 302, headers: { location: "/login" } }
      : { status: failure === "server" ? 503 : 200, contentType: "text/html", body: "<html>offline fallback</html>" }));
    await page.goto("/login");
    await expect(page.locator(".network-notice")).toBeVisible();
  });
}

test("C120 timeout is bounded; hidden tabs cancel checks and stale responses cannot overwrite recovery", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Đăng nhập", exact: true })).toBeVisible();
  await page.clock.install();
  let count = 0;
  let release: (() => void) | undefined;
  let stalled = true;
  await page.route(probe, async route => {
    count += 1;
    if (stalled) {
      await new Promise<void>(resolve => { release = resolve; });
      await route.fulfill({ status: 503 }).catch(() => {});
    } else await route.fulfill(success);
  });
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await expect.poll(() => count).toBe(1);
  await page.clock.fastForward(5001);
  await expect(page.locator(".network-notice")).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.fastForward(60000);
  expect(count).toBe(1);
  stalled = false;
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator(".network-notice")).toHaveCount(0);
  expect(count).toBe(2);
  release?.();
  await page.clock.fastForward(30000);
  await expect(page.locator(".network-notice")).toHaveCount(0);
  expect(count).toBe(2);
});

test("C120 hiding during a pending check cancels it without a false warning", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Đăng nhập", exact: true })).toBeVisible();
  await page.clock.install();
  let count = 0;
  let release: (() => void) | undefined;
  await page.route(probe, async route => {
    count += 1;
    if (count === 1) {
      await new Promise<void>(resolve => { release = resolve; });
      await route.fulfill({ status: 503 }).catch(() => {});
    } else await route.fulfill(success);
  });
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await expect.poll(() => count).toBe(1);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.fastForward(60000);
  await expect(page.locator(".network-notice")).toHaveCount(0);
  expect(count).toBe(1);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect.poll(() => count).toBe(2);
  release?.();
  await page.clock.fastForward(30000);
  await expect(page.locator(".network-notice")).toHaveCount(0);
  expect(count).toBe(2);
});
