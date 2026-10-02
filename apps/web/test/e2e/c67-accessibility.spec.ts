import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { localSupabaseEnvironment } from "./helpers";

const local = localSupabaseEnvironment();
const credentials = { username: "c6_owner_e2e", password: "OwnerE2eTemp123" };

test.beforeAll(async () => {
  const owner = createClient(local.API_URL, local.PUBLISHABLE_KEY || local.ANON_KEY, { auth: { persistSession: false } });
  let signIn = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password: credentials.password });
  if (signIn.error) {
    credentials.password = "123456";
    signIn = await owner.auth.signInWithPassword({ email: "c6_owner_e2e@auth.local", password: credentials.password });
  }
  if (signIn.error || !signIn.data.user) throw signIn.error || new Error("C67 owner session was not created.");
  const admin = createClient(local.API_URL, local.SECRET_KEY || local.SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const { error } = await admin.from("profiles").update({ must_change_password: false }).eq("user_id", signIn.data.user.id);
  if (error) throw error;
});

async function login(page: Page) {
  await page.context().addCookies([{ name: "qlv_privacy_mode", value: "false", url: "http://127.0.0.1:3101" }]);
  await page.goto("/login");
  await page.getByLabel("Tên đăng nhập").fill(credentials.username);
  await page.getByLabel("Mật khẩu", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test("privacy mode removes money from accessible names and titles", async ({ page }) => {
  await login(page);
  const comparison = page.locator(".metric-comparison").first();
  await expect(comparison).toHaveAttribute("aria-label", /₫/);
  await expect(comparison).toHaveAttribute("title", /₫/);

  await page.getByRole("button", { name: "Ẩn số tiền (Chế độ riêng tư)" }).first().click();
  await expect(page.getByRole("button", { name: "Hiển thị số tiền" }).first()).toBeVisible();
  await expect(page.locator('#main-content [aria-label*="₫"], #main-content [title*="₫"]')).toHaveCount(0);
  await expect(comparison).toHaveAttribute("aria-label", /số tiền đang ẩn/);
  await expect(comparison).toHaveAttribute("title", /số tiền đang ẩn/);

  await page.getByRole("button", { name: "Hiển thị số tiền" }).first().click();
  await expect(comparison).toHaveAttribute("aria-label", /₫/);
  await expect(comparison).toHaveAttribute("title", /₫/);
});

test("mobile more sheet exposes state, traps focus and restores its trigger", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await login(page);
  const trigger = page.getByRole("button", { name: "Thêm", exact: true });
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  const dialogId = await trigger.getAttribute("aria-controls");
  expect(dialogId).toBeTruthy();

  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Tiện ích khác" });
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute("id", dialogId!);
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  const close = dialog.getByRole("button", { name: "Đóng tiện ích khác" });
  await expect(close).toBeFocused();

  const links = dialog.getByRole("link");
  const lastLink = links.last();
  await lastLink.focus();
  await expect(lastLink).toBeFocused();
  await page.keyboard.press("Tab");
  try {
    await expect(close).toBeFocused();
  } catch (error) {
    const state = await dialog.evaluate(element => {
      const describe = (node: Element | null) => node instanceof HTMLElement ? {
        tag: node.tagName, close: node.hasAttribute("data-bottom-sheet-close"), href: node.getAttribute("href"),
        tabIndex: node.tabIndex, rects: node.getClientRects().length,
        display: getComputedStyle(node).display, visibility: getComputedStyle(node).visibility,
      } : null;
      return { active: describe(document.activeElement), open: (element as HTMLDialogElement).open,
        controls: [...element.querySelectorAll('a[href],button,[tabindex]')].map(describe) };
    });
    await testInfo.attach("more-focus-failure-state", { body: JSON.stringify(state), contentType: "application/json" });
    throw error;
  }
  await page.keyboard.press("Shift+Tab");
  await expect(lastLink).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
});

test("bottom navigation reflows without clipping at narrow zoom-equivalent widths", async ({ page }) => {
  await login(page);
  for (const width of [500, 390, 320]) {
    await page.setViewportSize({ width, height: 760 });
    await page.goto("/dashboard");
    const result = await page.locator(".mobile-nav-wrap:visible .app-nav").evaluate((nav) => {
      const items = [...nav.querySelectorAll<HTMLElement>(":scope > .nav-link, :scope > .mobile-more-nav > .nav-link")]
        .filter((item) => item.getClientRects().length > 0);
      const labels = items.map((item) => item.querySelector<HTMLElement>("span:not(.nav-badge)")!);
      return {
        pageOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        itemCount: items.length,
        clipped: labels.some((label, index) => {
          const labelBox = label.getBoundingClientRect();
          const itemBox = items[index].getBoundingClientRect();
          return label.scrollWidth > label.clientWidth || label.scrollHeight > label.clientHeight ||
            labelBox.left < itemBox.left - 0.5 || labelBox.right > itemBox.right + 0.5;
        }),
      };
    });
    expect(result, `bottom navigation at ${width}px`).toEqual({ pageOverflow: false, itemCount: 5, clipped: false });
  }
});

test("dashboard action banner keeps a continuous heading outline", async ({ page }) => {
  await login(page);
  await expect(page.locator(".action-hero-banner h2")).toHaveCount(1);
  await expect(page.locator(".action-hero-banner h3")).toHaveCount(0);
  const outline = await page.locator("#main-content h1, #main-content h2, #main-content h3").evaluateAll((headings) => headings.map((heading) => heading.tagName));
  expect(outline[0]).toBe("H1");
  expect(outline[1]).toBe("H2");
});
