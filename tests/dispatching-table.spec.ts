import { test, expect } from "@playwright/test";

/**
 * ppka-demo is visual-first — every test below checks both behavior and
 * appearance. toHaveScreenshot baselines are stored under
 * tests/dispatching-table.spec.ts-snapshots/ and committed; run
 * `bun run test:e2e:update` to refresh them deliberately after a real visual
 * change.
 */

test.describe("dispatching table", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?start=00:00&controls=1");
    // first build/serve of the page can be slow
    await expect(
      page.locator('svg[aria-label^="Meja pengatur perjalanan kereta"]')
    ).toBeVisible({ timeout: 30_000 });
  });

  test("renders the table and settings button; no persistent status line", async ({ page }) => {
    await expect(
      page.locator('svg[aria-label^="Meja pengatur perjalanan kereta"]')
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Pengaturan" })).toBeVisible();
    // renamed block signals on the approach lines; two sets share display codes
    await expect(page.getByRole("button", { name: /B101 ·/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /B106 ·/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /B109 ·/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /B201 ·/ })).toHaveCount(2);
    await expect(page.getByRole("button", { name: /B204 ·/ })).toHaveCount(2);
    // the verbose status paragraph is hidden to save vertical space
    await expect(page.locator("text=All points normal.")).toHaveCount(0);
  });

  test("settings popover opens, control toggle defaults off, Escape closes", async ({ page }) => {
    // fresh reload: control buttons start hidden (the beforeEach shows them)
    await page.goto("/?start=00:00");
    await page.getByRole("button", { name: "Pengaturan" }).click();
    const toggle = page.getByRole("switch", { name: "Tampilkan tombol kontrol" });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    await page.keyboard.press("Escape");
    await expect(toggle).toBeHidden();
  });

  test("control buttons are hidden by default and shown via settings", async ({ page }) => {
    // fresh reload: the row is not rendered
    await page.goto("/?start=00:00");
    const p3 = page.getByRole("button", { name: /P3 ·/ });
    await expect(p3).toHaveCount(0);
    await page.getByRole("button", { name: "Pengaturan" }).click();
    await page.getByRole("switch", { name: "Tampilkan tombol kontrol" }).click();
    await expect(p3).toBeVisible();
    await page.getByRole("switch", { name: "Tampilkan tombol kontrol" }).click();
    await expect(p3).toHaveCount(0);
  });

  test("throwing a point reverses it", async ({ page }) => {
    await page.getByRole("button", { name: /P3 ·/ }).click();
    await expect(page.getByRole("button", { name: /P3 · BELOK/ })).toBeVisible();
  });

  test("clearing a signal shows green and draws the reserved route", async ({ page }) => {
    // J2's next signal (B13 block chain) is clear, so J2 shows green;
    // J1 would only show amber because its next signal J2 is red.
    await page.getByRole("button", { name: /J2 ·/ }).click();
    await expect(page.getByRole("button", { name: /J2 · HIJAU/ })).toBeVisible();
    // the reserved route overlay (amber) is drawn for the cleared signal
    await expect(page.locator('path[stroke="#f59e0b"]')).toHaveCount(1);
  });

  test("clearing a signal auto-sets the points its route needs", async ({ page }) => {
    // J6 leaves the upper loop at P3 — policy (a): clearing J6 throws P3
    // itself and lights the signal
    await page.getByRole("button", { name: /J6 ·/ }).click();
    await expect(page.getByRole("button", { name: /P3 · BELOK/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /J6 ·/ })).not.toHaveText(/J6 · MERAH/);
  });

  test("opposite-direction overlap is refused with a conflict note", async ({ page }) => {
    // Reverse the right crossover: J2 (right) diverts up through P7/P8 onto
    // the top line, while J4 (left) diverts down the same way — the two
    // reserved routes overlap, so J4 must be refused. Run it after 14:00 when
    // the lines are empty (a route into occupied track is refused first).
    await page.clock.install();
    await page.goto("/?start=00:00&controls=1");
    await expect(page.locator('svg[aria-label^="Meja pengatur perjalanan kereta"]')).toBeVisible();
    // let the eastbound trains run through and exit first (a route into the
    // occupied line is refused), then test the pure route overlap
    for (const re of [/J1 ·/, /J2 ·/, /J4 ·/, /J5 ·/]) {
      await page.getByRole("button", { name: re }).click();
    }
    await page.clock.fastForward("00:09:50");
    await page.getByRole("button", { name: /J4 ·/ }).click(); // re-clear for 2523
    await page.getByRole("button", { name: /J5 ·/ }).click();
    await page.clock.fastForward("00:02:50"); // → t=760 (12:40) — 6082B has left J1/J2
    await page.getByRole("button", { name: /J1 ·/ }).click(); // re-clear for 30A
    await page.getByRole("button", { name: /J2 ·/ }).click();
    await page.clock.fastForward("00:04:20"); // → t=1020 (17:00)
    await page.getByRole("button", { name: /P7\+P8 ·/ }).click();
    await expect(page.getByRole("button", { name: /P7\+P8 · BELOK/ })).toBeVisible();
    await page.getByRole("button", { name: /J2 ·/ }).click();
    await expect(page.getByRole("button", { name: /J2 · HIJAU/ })).toBeVisible();
    await page.getByRole("button", { name: /J4 ·/ }).click();
    await expect(
      page.locator("text=J4 tidak bisa dibuka — rutenya berimpit dengan reservasi J2.")
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /J4 · MERAH/ })).toBeVisible();
  });

  test("points under a cleared route are approach-locked", async ({ page }) => {
    await page.getByRole("button", { name: /J1 ·/ }).click();
    await expect(page.getByRole("button", { name: /J1 · KUNING/ })).toBeVisible();
    // J1's route passes through P2 and P5; the coupled P1+P2 control reports
    // the pair by its full name in the conflict toast.
    const p2 = page.getByRole("button", { name: /P2 ·/ });
    await expect(p2).toHaveAttribute("aria-disabled", "true");
    await p2.click({ force: true });
    await expect(page.locator("text=P1+P2 terkunci oleh reservasi J1")).toBeVisible();
  });

  test("wrong-way reservation holds the opposite chain at red", async ({ page }) => {
    // J4 with the right crossover reversed drops onto the bottom line running
    // against normal traffic → J1 and the B101–B104 approach chain must be held
    // at red (the section is reserved by the wrong-way move). The exit chain
    // east of the map is beyond the reserved stretch, so it stays green. Run
    // after 14:00 when the bottom line is empty (a route into occupied track is
    // refused first).
    await page.clock.install();
    await page.goto("/?start=00:00&controls=1");
    await expect(page.locator('svg[aria-label^="Meja pengatur perjalanan kereta"]')).toBeVisible();
    // let the trains run out (cleared signals), move 2523 past J4 with a
    // re-clear at 9:50, then set the wrong-way route at 17:00 on the empty line
    // (a route into occupied track is refused first)
    for (const re of [/J1 ·/, /J2 ·/, /J4 ·/, /J5 ·/]) {
      await page.getByRole("button", { name: re }).click();
    }
    await page.clock.fastForward("00:09:50");
    await page.getByRole("button", { name: /J4 ·/ }).click(); // re-clear for 2523
    await page.getByRole("button", { name: /J5 ·/ }).click();
    await page.clock.fastForward("00:02:50"); // → t=760 (12:40) — 6082B has left J1/J2
    await page.getByRole("button", { name: /J1 ·/ }).click(); // re-clear for 30A
    await page.getByRole("button", { name: /J2 ·/ }).click();
    await page.clock.fastForward("00:04:20"); // → t=1020 (17:00)
    await page.getByRole("button", { name: /P7\+P8 ·/ }).click();
    await expect(page.getByRole("button", { name: /P7\+P8 · BELOK/ })).toBeVisible();
    await page.getByRole("button", { name: /J4 ·/ }).click();
    await expect(page.getByRole("button", { name: /J4 · HIJAU/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /J1 · MERAH/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /B101 · MERAH/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /B104 · MERAH/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /B109 · HIJAU/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /B106 · HIJAU/ })).toBeVisible();
  });

  test("both crossovers reversed: bounded wrong-way diversion reds only what it covers", async ({ page }) => {
    // With BOTH crossovers reversed the train loops through them and returns to
    // the top line — the wrong-way stretch is bounded between the crossovers, so
    // the approach chain west of it (B101–B104) is NOT force-red; only the exit
    // chain stays untouched too.
    await page.getByRole("button", { name: /P7\+P8 ·/ }).click();
    await page.getByRole("button", { name: /P1\+P2 ·/ }).click();
    await expect(page.getByRole("button", { name: /P7\+P8 · BELOK/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /P1\+P2 · BELOK/ })).toBeVisible();
    await page.getByRole("button", { name: /J4 ·/ }).click();
    await expect(page.getByRole("button", { name: /J4 · HIJAU/ })).toBeVisible();
    // B103's section (D4, west of the left crossover) is not covered by the
    // bounded wrong-way span → stays green (B104 itself is red because 6082B,
    // eastbound on the bottom line, spawns at BKST inside its section)
    await expect(page.getByRole("button", { name: /B103 · HIJAU/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /B109 · HIJAU/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /B106 · HIJAU/ })).toBeVisible();
  });

  test("station platform cells are tinted; nameplates remain", async ({ page }) => {
    await expect(page.locator('rect[fill="#fef3c7"]')).toHaveCount(16); // 4+8+4 cells
    await expect(page.locator("svg text").filter({ hasText: /^Bekasi Timur$/ })).toBeVisible();
    await expect(page.locator("svg text").filter({ hasText: /^Tambun$/ })).toBeVisible();
    await expect(page.locator("svg text").filter({ hasText: /^Cibitung$/ })).toBeVisible();
    // station codes are hidden — no BKST/TB/CIT labels on the map
    await expect(page.locator("svg text").filter({ hasText: /^BKST$/ })).toHaveCount(0);
    await expect(page.locator("svg text").filter({ hasText: /^CIT$/ })).toHaveCount(0);
  });

  test("station cells align with their grid columns", async ({ page }) => {
    // Pre-shift tint origins: E=-348 F=-290 U=580 V=638 AM=1624 AN=1682
    const tintXs = await page
      .locator('rect[fill="#fef3c7"]')
      .evaluateAll((rects) => rects.map((r) => r.getAttribute("x")));
    for (const x of ["-348", "-290", "580", "638", "1624", "1682"]) {
      expect(tintXs).toContain(x);
    }
    // guard: no tint may sit 10 cells too far right (column O = x 812 screen / 232 pre-shift)
    expect(tintXs).not.toContain("232");
  });

  test("time controls show the clock and speed scales; x1 is default", async ({ page }) => {
    await expect(page.getByRole("timer")).toHaveText(/^\d{2}:\d{2}:\d{2}\.\d{2}$/);
    await expect(page.getByRole("group", { name: "Skala waktu" })).toBeVisible();
    await expect(page.getByRole("button", { name: "×1", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "×10", exact: true }).click();
    await expect(page.getByRole("button", { name: "×10", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "×1", exact: true })).toHaveAttribute("aria-pressed", "false");
  });

  test("x10 advances the simulation clock ten times faster than x1", async ({ page }) => {
    const clock = page.getByRole("timer");
    const secs = async () => {
      const s = await clock.textContent();
      const [h, m, sec] = (s ?? "00:00:00").split(":").map(Number);
      return h * 3600 + m * 60 + sec;
    };
    await page.getByRole("button", { name: "×1", exact: true }).click();
    const t1 = await secs();
    await page.waitForTimeout(1100);
    const d1 = (await secs()) - t1;
    expect(d1).toBeGreaterThanOrEqual(0);
    expect(d1).toBeLessThan(4); // ×1: ~1–2 sim seconds per real second
    await page.getByRole("button", { name: "×10", exact: true }).click();
    const t3 = await secs();
    await page.waitForTimeout(1100);
    const d2 = (await secs()) - t3;
    expect(d2).toBeGreaterThanOrEqual(8); // ×10: ~11 sim seconds in 1.1s
    expect(d2).toBeLessThan(20);
  });

  test("the speed scales include ×20, ×50 and ×100", async ({ page }) => {
    for (const n of ["×20", "×50", "×100"]) {
      await page.getByRole("button", { name: n, exact: true }).click();
      await expect(page.getByRole("button", { name: n, exact: true })).toHaveAttribute("aria-pressed", "true");
    }
  });

  test("×100 advances the clock about ten times faster than ×10", async ({ page }) => {
    const clock = page.getByRole("timer");
    const secs = async () => {
      const s = await clock.textContent();
      const [h, m, sec] = (s ?? "00:00:00").split(":").map(Number);
      return h * 3600 + m * 60 + sec;
    };
    await page.getByRole("button", { name: "×10", exact: true }).click();
    const t1 = await secs();
    await page.waitForTimeout(1100);
    const d10 = (await secs()) - t1;
    await page.getByRole("button", { name: "×100", exact: true }).click();
    const t2 = await secs();
    await page.waitForTimeout(1100);
    const d100 = (await secs()) - t2;
    expect(d100).toBeGreaterThan(d10 * 3);
  });

  test("pause freezes the clock; resume continues from the same time", async ({ page }) => {
    const clock = page.getByRole("timer");
    const secs = async () => {
      const s = await clock.textContent();
      const [h, m, sec] = (s ?? "00:00:00").split(":").map(Number);
      return h * 3600 + m * 60 + sec;
    };
    await page.getByRole("button", { name: "×10", exact: true }).click();
    await page.waitForTimeout(1100);
    expect(await secs()).toBeGreaterThan(5);
    await page.getByRole("button", { name: "Jeda simulasi" }).click();
    await expect(page.getByRole("button", { name: "Lanjutkan simulasi" })).toHaveAttribute("aria-pressed", "true");
    await page.waitForTimeout(800);
    const t2 = await secs();
    await page.waitForTimeout(800);
    expect(await secs()).toBe(t2); // frozen while paused
    await page.getByRole("button", { name: "Lanjutkan simulasi" }).click();
    await page.waitForTimeout(800);
    expect(await secs()).toBeGreaterThan(t2 + 2); // resumes
  });

  test("trains 30A and 2523 run per their schedules", async ({ page }) => {
    await page.clock.install();
    await page.goto("/?start=00:00&controls=1");
    await expect(page.locator('svg[aria-label^="Meja pengatur perjalanan kereta"]')).toBeVisible();
    await expect(page.locator('[data-train="30A"]')).toHaveCount(1);
    await expect(page.locator('[data-train="2523"]')).toHaveCount(1);
    // clear both lines so they can move
    for (const re of [/J5 ·/, /J4 ·/, /J1 ·/, /J2 ·/]) {
      await page.getByRole("button", { name: re }).click();
    }
    const x = async (no: string) =>
      parseFloat((await page.locator('[data-train="' + no + '"]').getAttribute("data-x")) ?? "NaN");
    // 30A (eastbound): reaches BKST ~5:00 and heads east (it may be held at J1
    // behind 6082B's TB dwell, but is past BKST by then)
    await page.clock.fastForward("00:05:40");
    await expect.poll(async () => await x("30A")).toBeGreaterThan(-290);
    // 2523 (westbound): reaches CIT ~10:00 and heads west; re-clear its
    // signals (107B consumed J4/J5 earlier on its own run)
    await page.clock.fastForward("00:04:30"); // → t≈610 (10:10)
    await expect.poll(async () => await x("2523")).toBeLessThan(1682);
    await page.getByRole("button", { name: /J4 ·/ }).click();
    await page.getByRole("button", { name: /J5 ·/ }).click();
    // 2523 passes TB (a pass — no stop) and continues toward BKST
    await page.clock.fastForward("00:04:30"); // → t≈880 (14:40)
    await expect.poll(async () => await x("2523")).toBeLessThan(500);
  });

  test("every train marker carries a hidden conflict badge", async ({ page }) => {
    await page.clock.install();
    await page.goto("/?start=00:00&controls=1");
    await expect(page.locator('svg[aria-label^="Meja pengatur perjalanan kereta"]')).toBeVisible();
    // all four enabled trains are running — each marker must have a badge that
    // stays hidden while there is no live conflict (it only shows on the trains
    // in an overlapping pair, toggled by the same condition as the failsafe)
    await page.clock.fastForward("00:00:05");
    for (const t of ["107B", "6082B", "30A", "2523"]) {
      await expect(page.locator(`[data-train="${t}"]`)).toBeVisible();
      await expect(page.locator(`[data-train="${t}"] > g`)).toHaveAttribute("visibility", "hidden");
    }
  });

  test("the conflict failsafe does not false-positive on queued trains", async ({ page }) => {
    await page.clock.install();
    await page.goto("/?start=00:00&controls=1");
    await expect(page.locator('svg[aria-label^="Meja pengatur perjalanan kereta"]')).toBeVisible();
    // with nothing cleared, every train is held at a red signal — queues form,
    // but the block cascade spaces them (30A stops at B101 behind 6082B at J1,
    // 107B/2523 at J4). No conflict may fire: no marker may turn the conflict
    // color, all stay the signal-held red.
    for (let i = 0; i < 4; i++) await page.clock.fastForward("00:05:00"); // → t=20:00
    for (const t of ["107B", "6082B", "30A", "2523"]) {
      await expect
        .poll(async () => await page.locator('[data-train="' + t + '"] rect').getAttribute("fill"))
        .toBe("#fecaca");
    }
  });

  test("train 107B follows its schedule (CIT 0:00 → TB 3:30 → BKST, held by 6082B)", async ({ page }) => {
    // faked clock: drive the sim deterministically instead of waiting real time
    await page.clock.install();
    await page.goto("/?start=00:00&controls=1");
    await expect(page.locator('svg[aria-label^="Meja pengatur perjalanan kereta"]')).toBeVisible();
    // the train must pass the player-controlled signals — clear them so it can run
    await page.getByRole("button", { name: /J5 ·/ }).click();
    await page.getByRole("button", { name: /J4 ·/ }).click();
    const marker = page.locator('[data-train="107B"]');
    const x = async () => await marker.evaluate((el) => parseFloat(el.getAttribute("data-x") ?? "NaN"));
    // t≈0: 107B departs CIT platform (center ≈ 1682) at 00:00
    await expect(marker).toBeVisible();
    await expect.poll(async () => Math.abs((await x()) - 1682)).toBeLessThan(40);
    // t≈2:30 — 107B PASSES TB at ~2:29: the schedule has arr == dep (a passing
    // train), so it does not stop — running at 80 km/h it arrives early and
    // rolls straight through (marker not station-green)
    await page.clock.fastForward("00:02:30");
    await expect.poll(async () => Math.abs((await x()) - 638)).toBeLessThan(40);
    await expect.poll(async () => (await x()) % 58).toBe(0);
    await expect.poll(async () => await marker.locator("rect").getAttribute("fill")).not.toBe("#bbf7d0");
    // 6082B dwells at TB on the opposite line, so 107B is not held — it reaches
    // BKST (~-290) early (~5:47) and rolls to the exit. Step in minute chunks
    // so both trains advance together, and assert completion by ~11:40.
    for (let i = 0; i < 10; i++) await page.clock.fastForward("00:01:00"); // → t≈813
    await expect.poll(async () => (await x())).toBeLessThanOrEqual(-290);
  });

  test("train 6082B stops at TB per its schedule (BKST 0:00 → TB 6:00–11:00 → CIT 14:00)", async ({ page }) => {
    await page.clock.install();
    await page.goto("/?start=00:00&controls=1");
    await expect(page.locator('svg[aria-label^="Meja pengatur perjalanan kereta"]')).toBeVisible();
    const marker = page.locator('[data-train="6082B"]');
    const x = async () => await marker.evaluate((el) => parseFloat(el.getAttribute("data-x") ?? "NaN"));
    // 6082B runs eastbound on the bottom line — clear its signals so it can run
    await page.getByRole("button", { name: /J1 ·/ }).click();
    await page.getByRole("button", { name: /J2 ·/ }).click();
    // t≈0: at BKST platform (≈ -290); origin dwell 0:00→0:30
    await expect(marker).toBeVisible();
    await expect.poll(async () => Math.abs((await x()) - -290)).toBeLessThan(20);
    // 0:20 — still at BKST (hasn't departed)
    await page.clock.fastForward("00:00:20");
    await expect.poll(async () => Math.abs((await x()) - -290)).toBeLessThan(20);
    // just after 6:00 — at TB (arrived early at ~3:48 at 80 km/h; dwelling
    // until the scheduled 11:00 departure)
    await page.clock.fastForward("00:05:43");
    await expect.poll(async () => Math.abs((await x()) - 638)).toBeLessThan(20);
    // 9:00 — still stopped at TB (scheduled dwell 6:00 → 11:00)
    await page.clock.fastForward("00:03:00");
    await expect.poll(async () => Math.abs((await x()) - 638)).toBeLessThan(20);
    // ~13:30 — arrived at CIT early (scheduled 14:00; 80 km/h recovers the
    // reserve), then it rolls to the exit. Arrival ≈ t 808.5; land at t=810.
    await page.clock.fastForward("00:04:27"); // 543 → 810 (13:30)
    await expect.poll(async () => Math.abs((await x()) - 1682)).toBeLessThan(20);
  });

  test("train marker color clues the stop state (station vs signal)", async ({ page }) => {
    await page.clock.install();
    await page.goto("/?start=00:00&controls=1");
    await expect(page.locator('svg[aria-label^="Meja pengatur perjalanan kereta"]')).toBeVisible();
    const fill = async (no: string) =>
      await page.locator('[data-train="' + no + '"] rect').getAttribute("fill");
    // clear both trains' routes so they can run on time
    for (const re of [/J5 ·/, /J4 ·/, /J1 ·/, /J2 ·/]) {
      await page.getByRole("button", { name: re }).click();
    }
    // t≈6:00 — 6082B arrived at TB (6:00) and dwells until 11:00 → green
    await page.clock.fastForward("00:06:00");
    await expect.poll(async () => await fill("6082B")).toBe("#bbf7d0");
    // t=11:00 — dwell ends and it departs (blue); then J2 goes red ahead of it
    await page.clock.fastForward("00:05:00");
    await expect.poll(async () => await fill("6082B")).toBe("#bfdbfe"); // departing TB
    await page.getByRole("button", { name: /J2 ·/ }).click();
    await page.clock.fastForward("00:00:30");
    await expect.poll(async () => await fill("6082B")).toBe("#fecaca"); // held at red J2
  });

  test("a train held at a red signal snaps one cell behind it, never over it", async ({ page }) => {
    await page.clock.install();
    await page.goto("/?start=00:00&controls=1");
    await expect(page.locator('svg[aria-label^="Meja pengatur perjalanan kereta"]')).toBeVisible();
    const marker = page.locator('[data-train="6082B"]');
    // leave J1 red: 6082B (eastbound) stops with its leading edge at J1 (x 322,
    // cell M4). The 2-cell marker must snap BEHIND the signal — box 174..290
    // (K4–L4) — not protrude into/over M4.
    await page.clock.fastForward("00:04:15");
    const x = async () => parseFloat((await marker.getAttribute("data-x")) ?? "NaN");
    await expect.poll(async () => await x()).toBe(232);
    expect((await x()) + 58).toBeLessThanOrEqual(322); // leading edge at/behind J1
    await expect.poll(async () => await marker.locator("rect").getAttribute("fill")).toBe("#fecaca");
  });

  // Every player signal: a train held at the (red) signal resumes when it is
  // cleared, passes, and the clear is consumed — the signal must go red and
  // STAY red (never re-light like an automatic block signal). Each case sets up
  // the route that puts a train at that signal (points BEFORE signals so the
  // approach lock doesn't refuse the throw).
  const SIGNAL_CONSUMPTION_CASES: {
    sig: string;
    setup: [string, number][];
    // optional mid-flight step: fast-forward to a time (seconds), perform clicks
    mid?: { at: number; clicks: string[] };
    wait: string;
    after: string;
  }[] = [
    { sig: "J1", setup: [], wait: "00:05:00", after: "00:00:40" }, // 6082B eastbound, bottom line
    { sig: "J2", setup: [["J1", 1]], wait: "00:11:30", after: "00:00:30" }, // 6082B after its TB dwell
    // 6082B on the TB loop; re-click J1 at 5:30 so 30A (following on the bottom
    // line, also diverted by P5) is held at J1 and doesn't stack at J3
    {
      sig: "J3",
      setup: [["P5", 1], ["P6", 1], ["J1", 1]],
      mid: { at: 330, clicks: ["J1", "J1"] }, // re-clear then re-red, so 30A is held at J1
      wait: "00:06:10", // 11:40 minus the 5:30 mid-step
      after: "00:01:00",
    },
    { sig: "J4", setup: [], wait: "00:02:00", after: "00:00:40" }, // 107B westbound, top line
    { sig: "J5", setup: [["J4", 1]], wait: "00:02:30", after: "00:00:40" }, // 107B past J4
    { sig: "J6", setup: [["P4", 1], ["J4", 1]], wait: "00:03:00", after: "00:00:40" }, // 107B on the upper loop
    { sig: "J7", setup: [["P7+P8", 1], ["P6", 1], ["J4", 1], ["J5", 1]], wait: "00:03:00", after: "00:00:40" }, // 107B on the lower loop, west
  ];
  for (const c of SIGNAL_CONSUMPTION_CASES) {
    test(`signal ${c.sig} is consumed when a train stopped at it resumes after the clear`, async ({ page }) => {
      await page.clock.install();
      await page.goto("/?start=00:00&controls=1");
      await expect(page.locator('svg[aria-label^="Meja pengatur perjalanan kereta"]')).toBeVisible();
      const chip = async (id: string) => {
        const l = page.locator("button", { hasText: id + " ·" });
        return (await l.count()) ? (await l.first().textContent())!.trim().replace(/\s+/g, " ") : "?";
      };
      const clickLabel = async (label: string) => {
        const re = new RegExp("^" + label.replace(/[+.()]/g, "\\$&") + " ·");
        await page.getByRole("button", { name: re }).click({ timeout: 5000 });
      };
      for (const [label, n] of c.setup) {
        for (let i = 0; i < n; i++) await clickLabel(label);
      }
      if (c.mid) {
        const m = Math.floor(c.mid.at / 60);
        const s = c.mid.at % 60;
        await page.clock.fastForward("00:" + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0"));
        for (const label of c.mid.clicks) await clickLabel(label);
      }
      // let the train run up to and stop at the (red) signal
      await page.clock.fastForward(c.wait);
      await expect.poll(async () => await chip(c.sig)).toBe(c.sig + " · MERAH");
      // clear while it stands there → it resumes, passes, and the clear is consumed
      await page.getByRole("button", { name: new RegExp("^" + c.sig + " ·") }).click();
      await page.clock.fastForward(c.after);
      await expect.poll(async () => await chip(c.sig)).toBe(c.sig + " · MERAH");
      // must STAY red — never re-light like a block signal
      await page.clock.fastForward("00:01:00");
      await expect.poll(async () => await chip(c.sig)).toBe(c.sig + " · MERAH");
    });
  }

  test("a train diverted onto the TB loop still stops at TB per its schedule", async ({ page }) => {
    await page.clock.install();
    await page.goto("/?start=00:00&controls=1");
    await expect(page.locator('svg[aria-label^="Meja pengatur perjalanan kereta"]')).toBeVisible();
    const marker = page.locator('[data-train="6082B"]');
    const xy = async () => ({
      x: parseFloat((await marker.getAttribute("data-x")) ?? "NaN"),
      y: parseFloat((await marker.getAttribute("data-y")) ?? "NaN"),
    });
    // divert the eastbound train onto the lower loop (row 5) at TB: reverse P5,
    // and clear J1 so it can reach the junction at all
    await page.getByRole("button", { name: /P5 ·/ }).click();
    await page.getByRole("button", { name: /J1 ·/ }).click();
    // ~7:00 — it should be stopped at TB ON THE LOOP (x≈638, y≈264) and dwelling
    await page.clock.fastForward("00:07:00");
    await expect.poll(async () => Math.abs((await xy()).x - 638)).toBeLessThan(10);
    await expect.poll(async () => Math.abs((await xy()).y - 264)).toBeLessThan(10);
    await expect.poll(async () => await marker.locator("rect").getAttribute("fill")).toBe("#bbf7d0");
    // still there at 10:00 (dwell runs until 11:00)
    await page.clock.fastForward("00:03:00");
    await expect.poll(async () => Math.abs((await xy()).x - 638)).toBeLessThan(10);
    // 11:30 — dwell over; it departed east and is now held at the red loop
    // signal J3 (snapped one cell behind it, back at the TB column)
    await page.clock.fastForward("00:01:30");
    await expect.poll(async () => await marker.locator("rect").getAttribute("fill")).toBe("#fecaca");
  });

  test("train stops at a player-red signal and resumes when cleared", async ({ page }) => {
    await page.clock.install();
    await page.goto("/?start=00:00&controls=1");
    await expect(page.locator('svg[aria-label^="Meja pengatur perjalanan kereta"]')).toBeVisible();
    const marker = page.locator('[data-train="107B"]');
    const x = async () => await marker.evaluate((el) => parseFloat(el.getAttribute("data-x") ?? "NaN"));
    // J4 left red: the train stops with its LEADING edge at the signal — the
    // center holds at 1076+58, the snapped span is [29,30] → box center 1160
    await page.clock.fastForward("00:02:30"); // t=150
    await expect(marker).toBeVisible();
    await expect.poll(async () => Math.abs((await x()) - 1160)).toBeLessThan(20);
    // still stopped a while later
    await page.clock.fastForward("00:01:00");
    await expect.poll(async () => Math.abs((await x()) - 1160)).toBeLessThan(20);
    // clear J4 BEFORE 6082B reaches TB (it would hold J4's section red) → resumes west
    await page.getByRole("button", { name: /J4 ·/ }).click();
    await page.clock.fastForward("00:00:40");
    await expect.poll(async () => (await x())).toBeLessThan(1160 - 100);
  });

  test("train diverts when the right crossover is reversed", async ({ page }) => {
    await page.clock.install();
    await page.goto("/?start=00:00&controls=1");
    await expect(page.locator('svg[aria-label^="Meja pengatur perjalanan kereta"]')).toBeVisible();
    const marker = page.locator('[data-train="107B"]');
    const y = async () => await marker.evaluate((el) => parseFloat(el.getAttribute("data-y") ?? "NaN"));
    // Throw the crossovers FIRST — clearing J4 would lock P8 via its route.
    // P1+P2 keeps the far-west line clear of J4's route so J4 is not refused
    // for occupancy. J5 is NOT cleared here: with the wrong-way route gone
    // (it used to run east over P1 while signalled west), J5's remaining route
    // is straight down the top line, and auto route setting would put P1 back
    // to normal — re-blocking J4.
    await page.getByRole("button", { name: /P7\+P8 ·/ }).click();
    await expect(page.getByRole("button", { name: /P7\+P8 · BELOK/ })).toBeVisible();
    await page.getByRole("button", { name: /P1\+P2 ·/ }).click();
    await expect(page.getByRole("button", { name: /P1\+P2 · BELOK/ })).toBeVisible();
    // then clear J4 so the train can run to the crossover
    await page.getByRole("button", { name: /J4 ·/ }).click();
    await expect(page.getByRole("button", { name: /J4 · HIJAU/ })).toBeVisible();
    // ~2:30 — the train is down the crossover, running west on the bottom line
    // (before the left crossover brings it back up)
    await page.clock.fastForward("00:02:30");
    await expect(marker).toBeVisible();
    await expect.poll(async () => (await y())).toBeGreaterThan(100); // left the top line (y=89)
  });

  test("train stays on the top line with points normal", async ({ page }) => {
    await page.clock.install();
    await page.goto("/?start=00:00&controls=1");
    await expect(page.locator('svg[aria-label^="Meja pengatur perjalanan kereta"]')).toBeVisible();
    await page.getByRole("button", { name: /J5 ·/ }).click();
    await page.getByRole("button", { name: /J4 ·/ }).click();
    await page.clock.fastForward("00:04:00"); // west of p8, still on the top line
    const y = await page
      .locator('[data-train="107B"]')
      .evaluate((el) => parseFloat(el.getAttribute("data-y") ?? "NaN"));
    expect(Math.abs(y - 89)).toBeLessThan(1);
  });

  test("train passage holds a section red and cascades the blocks", async ({ page }) => {
    await page.clock.install();
    await page.goto("/?start=00:00&controls=1");
    await expect(page.locator('svg[aria-label^="Meja pengatur perjalanan kereta"]')).toBeVisible();
    // clear J4 + J5 so the train can run through to TB
    await page.getByRole("button", { name: /J5 ·/ }).click();
    await page.getByRole("button", { name: /J4 ·/ }).click();
    await expect(page.getByRole("button", { name: /J4 · HIJAU/ })).toBeVisible();
    // the exit B201 is green (mirroring the cleared J4); the approach B201 is
    // amber (mirroring the red A2 entry signal west of it)
    await expect(page.getByRole("button", { name: /B201 · HIJAU/ })).toHaveCount(1);
    await expect(page.getByRole("button", { name: /B201 · KUNING/ })).toHaveCount(1);
    // t≈150: 107B has passed J4 (clear consumed) and its body is still inside
    // J4's protected section — J4 reads red, both B201 sets mirror red → amber
    await page.clock.fastForward("00:02:30");
    await expect(page.getByRole("button", { name: /J4 · MERAH/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /B201 · HIJAU/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /B201 · KUNING/ })).toHaveCount(2);
    // the pass consumed the clear: J4 stays red even after the train leaves
    // its section (re-cleared only by the player)
    await page.clock.fastForward("00:05:30");
    await expect(page.getByRole("button", { name: /J4 · MERAH/ })).toBeVisible();
  });

  test("player signal stays red after the train passes until re-cleared", async ({ page }) => {
    await page.clock.install();
    await page.goto("/?start=00:00&controls=1");
    await expect(page.locator('svg[aria-label^="Meja pengatur perjalanan kereta"]')).toBeVisible();
    await page.getByRole("button", { name: /J5 ·/ }).click();
    await page.getByRole("button", { name: /J4 ·/ }).click();
    await expect(page.getByRole("button", { name: /J4 · HIJAU/ })).toBeVisible();
    // the train passes J4 (~1:50); from then on J4 must stay red
    await page.clock.fastForward("00:04:00");
    await expect(page.getByRole("button", { name: /J4 · MERAH/ })).toBeVisible();
    await page.clock.fastForward("00:03:00");
    await expect(page.getByRole("button", { name: /J4 · MERAH/ })).toBeVisible();
    // 6082B dwells at TB (inside J4's section) until 11:00 — wait until it has
    // passed J4, then the player re-clears → J4 lights again (amber: J5 was also
    // consumed by 107B's pass)
    await page.clock.fastForward("00:06:00"); // → t≈780, 6082B is east of J4
    // freeze the sim (its Pause sets the scale to 0) so 2523 — waiting right at
    // J4 — can't pass through and consume the re-clear mid-assertion; the
    // re-clear must then read AMBER (J5 was consumed by 107B's pass)
    await page.getByRole("button", { name: /Jeda simulasi/ }).click();
    await page.getByRole("button", { name: /J4 ·/ }).click();
    await expect(page.getByRole("button", { name: /J4 · KUNING/ })).toBeVisible();
    await page.getByRole("button", { name: /Lanjutkan simulasi/ }).click();
  });

  test("reservation highlight shrinks to the unpassed cells as the train advances", async ({ page }) => {
    await page.clock.install();
    await page.goto("/?start=00:00&controls=1");
    await expect(page.locator('svg[aria-label^="Meja pengatur perjalanan kereta"]')).toBeVisible();
    // clear ONLY J4: its reservation runs from J4 (x 1076) west to J5 (x 558)
    await page.getByRole("button", { name: /J4 ·/ }).click();
    await expect(page.getByRole("button", { name: /J4 · KUNING/ })).toBeVisible();
    // before the train reaches it: the full reservation is highlighted (starts at J4)
    await page.clock.fastForward("00:01:00");
    const earlyD = (await page.locator('path[stroke="#f59e0b"]').first().getAttribute("d")) ?? "";
    expect(earlyD).toContain("1076");
    // t≈120: train midway (front ≈ 780) — the passed cells un-highlight, the
    // far end (J5 at 558) stays lit
    await page.clock.fastForward("00:01:00");
    const paths = page.locator('path[stroke="#f59e0b"]');
    const ds: string[] = [];
    for (let i = 0; i < (await paths.count()); i++) ds.push((await paths.nth(i).getAttribute("d")) ?? "");
    const joined = ds.join(" ");
    expect(joined).not.toContain("1076");
    expect(joined).toContain("558");
  });

  test("route unlocks behind the train and auto-releases after it despawns", async ({ page }) => {
    await page.clock.install();
    await page.goto("/?start=00:00&controls=1");
    await expect(page.locator('svg[aria-label^="Meja pengatur perjalanan kereta"]')).toBeVisible();
    // wrong-way diversion: 107B goes down the reversed right crossover onto the
    // bottom line and runs west through J4's route. The left crossover is also
    // reversed so J4's route is bounded (a route into the occupied far-west
    // line is refused) — 107B loops back up to the top line and carries on.
    await page.getByRole("button", { name: /P7\+P8 ·/ }).click();
    await expect(page.getByRole("button", { name: /P7\+P8 · BELOK/ })).toBeVisible();
    await page.getByRole("button", { name: /P1\+P2 ·/ }).click();
    await page.getByRole("button", { name: /J4 ·/ }).click();
    await expect(page.getByRole("button", { name: /J4 · HIJAU/ })).toBeVisible();
    // t≈6:00 — the train has passed the crossover, so the points are free again
    // (only the UNPASSED portion of J4's route still locks them)
    await page.clock.fastForward("00:06:00");
    await expect(page.getByRole("button", { name: /P7\+P8 · BELOK/ })).toBeVisible();
    await page.getByRole("button", { name: /P7\+P8 ·/ }).click();
    await expect(page.getByRole("button", { name: /P7\+P8 · LURUS/ })).toBeVisible();
    // J2 can clear while J4's route is still reserved behind the train
    await page.getByRole("button", { name: /J2 ·/ }).click();
    await expect(page.getByRole("button", { name: /J2 · HIJAU/ })).toBeVisible();
    await page.getByRole("button", { name: /J2 ·/ }).click();
    await expect(page.getByRole("button", { name: /J2 · MERAH/ })).toBeVisible();
    // t≈15:00 — 107B has exited the map; J4's reservation auto-releases, so J2
    // clears again instead of refusing with an overlap
    await page.clock.fastForward("00:08:00");
    await page.getByRole("button", { name: /J2 ·/ }).click();
    await expect(page.getByRole("button", { name: /J2 · HIJAU/ })).toBeVisible();
  });

  test("train position never jumps backward while passing signals", async ({ page }) => {
    await page.clock.install();
    await page.goto("/?start=00:00&controls=1");
    await expect(page.locator('svg[aria-label^="Meja pengatur perjalanan kereta"]')).toBeVisible();
    await page.getByRole("button", { name: /J5 ·/ }).click();
    await page.getByRole("button", { name: /J4 ·/ }).click();
    const x = async () =>
      await page
        .locator('[data-train="107B"]')
        .evaluate((el) => parseFloat(el.getAttribute("data-x") ?? "NaN"));
    // step through the train passing B9/J4/J5 — the marker must move strictly
    // west (never flicker back and forth at a signal boundary)
    let prev = Infinity;
    for (let t = 0; t < 240; t += 10) {
      await page.clock.fastForward("00:00:10");
      const v = await x();
      if (Number.isNaN(v)) continue;
      expect(v).toBeLessThanOrEqual(prev);
      prev = v;
    }
  });

  test("block signal behind stays red until the train's tail clears the section", async ({ page }) => {
    await page.clock.install();
    await page.goto("/?start=00:00&controls=1");
    await expect(page.locator('svg[aria-label^="Meja pengatur perjalanan kereta"]')).toBeVisible();
    await page.getByRole("button", { name: /J5 ·/ }).click();
    await page.getByRole("button", { name: /J4 ·/ }).click();
    // t≈70: 107B's body still overlaps the exit section [1076,1247] (it runs
    // at 80 km/h now, so it reaches this band much sooner) — B201 stays red;
    // B202-exit mirrors it → amber
    await page.clock.fastForward("00:01:10");
    await expect(page.getByRole("button", { name: /B201 · MERAH/ })).toHaveCount(1);
    await expect(page.getByRole("button", { name: /B202 · KUNING/ })).toHaveCount(1);
    // t≈110: the tail has cleared — the block now mirrors the consumed J4 →
    // amber; the approach B201 is also amber (mirrors the red A2 entry), so 2
    await page.clock.fastForward("00:00:40");
    await expect(page.getByRole("button", { name: /B201 · MERAH/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /B201 · KUNING/ })).toHaveCount(2);
  });

  test("diverted route: J4 stays player-controlled and the highlight follows the train", async ({ page }) => {
    await page.clock.install();
    await page.goto("/?start=00:00&controls=1");
    await expect(page.locator('svg[aria-label^="Meja pengatur perjalanan kereta"]')).toBeVisible();
    // reverse both crossovers: J4's route diverts down through P7+P8, west on
    // the bottom line, and back up through P1+P2
    await page.getByRole("button", { name: /P7\+P8 ·/ }).click();
    await page.getByRole("button", { name: /P1\+P2 ·/ }).click();
    await page.getByRole("button", { name: /J4 ·/ }).click();
    await expect(page.getByRole("button", { name: /J4 · HIJAU/ })).toBeVisible();
    // t≈60: the train is still east of J4 — J4 stays green (player-controlled)
    // and the full reservation is highlighted
    await page.clock.fastForward("00:01:00");
    await expect(page.getByRole("button", { name: /J4 · HIJAU/ })).toBeVisible();
    const earlyD = (await page.locator('path[stroke="#f59e0b"]').first().getAttribute("d")) ?? "";
    expect(earlyD).toContain("1076");
    // t≈150: the train has passed J4 (consumed → red) and is heading to the
    // crossover — the highlight must follow it, not revert to the full route
    await page.clock.fastForward("00:01:30");
    await expect(page.getByRole("button", { name: /J4 · MERAH/ })).toBeVisible();
    const paths = page.locator('path[stroke="#f59e0b"]');
    const ds: string[] = [];
    for (let i = 0; i < (await paths.count()); i++) ds.push((await paths.nth(i).getAttribute("d")) ?? "");
    expect(ds.join(" ")).not.toContain("1076");
  });

  test("visual — default layout", async ({ page }) => {
    await expect(page).toHaveScreenshot("dispatching-default.png", {
      fullPage: true,
      // the running clock and the moving train change every frame — exclude them
      mask: [page.getByRole("timer"), page.locator("[data-train]"), page.getByRole("button", { name: "Log klik" }), page.locator("[data-board=notifications]")],
    });
  });

  test("visual — settings popover open", async ({ page }) => {
    await page.getByRole("button", { name: "Pengaturan" }).click();
    await expect(page.getByRole("switch", { name: "Tampilkan tombol kontrol" })).toBeVisible();
    await expect(page).toHaveScreenshot("settings-open.png", {
      fullPage: true,
      mask: [page.getByRole("timer"), page.locator("[data-train]"), page.getByRole("button", { name: "Log klik" }), page.locator("[data-board=notifications]")],
    });
  });

  test("visual — control buttons hidden by default", async ({ page }) => {
    // fresh reload: the row is not rendered at all — the table is not flooded
    await page.goto("/?start=00:00");
    await page.getByRole("button", { name: "Pengaturan" }).click();
    await expect(page.getByRole("button", { name: /P3 ·/ })).toHaveCount(0);
    await expect(page).toHaveScreenshot("controls-hidden.png", {
      fullPage: true,
      mask: [page.getByRole("timer"), page.locator("[data-train]"), page.getByRole("button", { name: "Log klik" }), page.locator("[data-board=notifications]")],
    });
  });

  test("visual — cleared route and reversed point", async ({ page }) => {
    await page.getByRole("button", { name: /P3 ·/ }).click();
    await page.getByRole("button", { name: /J2 ·/ }).click();
    await expect(page.getByRole("button", { name: /J2 · HIJAU/ })).toBeVisible();
    await expect(page).toHaveScreenshot("interacted.png", {
      fullPage: true,
      mask: [page.getByRole("timer"), page.locator("[data-train]"), page.getByRole("button", { name: "Log klik" }), page.locator("[data-board=notifications]")],
    });
  });

  test("visual — conflict toast", async ({ page }) => {
    // run on the empty lines (a route into occupied track is refused first)
    await page.clock.install();
    await page.goto("/?start=00:00&controls=1");
    await expect(page.locator('svg[aria-label^="Meja pengatur perjalanan kereta"]')).toBeVisible();
    for (const re of [/J1 ·/, /J2 ·/, /J4 ·/, /J5 ·/]) {
      await page.getByRole("button", { name: re }).click();
    }
    await page.clock.fastForward("00:09:50");
    await page.getByRole("button", { name: /J4 ·/ }).click();
    await page.getByRole("button", { name: /J5 ·/ }).click();
    await page.clock.fastForward("00:02:50");
    await page.getByRole("button", { name: /J1 ·/ }).click();
    await page.getByRole("button", { name: /J2 ·/ }).click();
    await page.clock.fastForward("00:04:20"); // → t=1020 (17:00)
    await page.getByRole("button", { name: /P7\+P8 ·/ }).click();
    await page.getByRole("button", { name: /J2 ·/ }).click();
    await expect(page.getByRole("button", { name: /J2 · HIJAU/ })).toBeVisible();
    await page.getByRole("button", { name: /J4 ·/ }).click();
    await expect(page.locator("text=J4 tidak bisa dibuka")).toBeVisible();
    await expect(page).toHaveScreenshot("conflict-toast.png", {
      fullPage: true,
      mask: [page.getByRole("timer"), page.locator("[data-train]"), page.getByRole("button", { name: "Log klik" }), page.locator("[data-board=notifications]")],
    });
  });
});

  test("shift-click routes the last signal to the clicked one and auto-sets points", async ({ page }) => {
    await page.goto("/?start=00:00&controls=1");
    await page.getByRole("button", { name: /J4 ·/ }).click();
    await page.getByRole("button", { name: /J7 ·/ }).click({ modifiers: ["Shift"] });
    await expect(page.getByRole("button", { name: /J4 · KUNING/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /P6 · BELOK/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /P7\+P8 · BELOK/ })).toBeVisible();
  });

  test("schematic mode renders without grid chrome, with platforms and the bridge glyph", async ({ page }) => {
    await page.goto("/schematic");
    // stations render from authored shapes (not grid cells)
    await expect(page.getByText("Alpha")).toBeVisible();
    await expect(page.getByText("Beta")).toBeVisible();
    // no grid chrome — no lone column letter / row number
    await expect(page.getByText("A", { exact: true })).toHaveCount(0);
    await expect(page.getByText("8", { exact: true })).toHaveCount(0);
    // the bridge glyph: gap pane + upper-track re-draw + two piers = 3 lines
    await expect(page.locator("svg line")).toHaveCount(3);
    // continuous train markers at their true schematic positions
    await expect(page.getByLabel(/Train F2 at 820,141/)).toBeVisible();
    await expect(page.getByLabel(/Train F1 at 1300,89/)).toBeVisible();
  });

  test("jatinegara train markers snap to its 16-unit grid lines", async ({ page }) => {
    await page.clock.install();
    await page.goto("/jng?start=06:04&controls=1");
    // 5024C is an eastbound KRL on t1 (boundary 06:00:15, JNG arr 06:04).
    // At start=06:04 it has just arrived at the platform.
    const marker = page.locator('[data-train="5024C"]');
    await expect(marker).toBeVisible();

    // The engine still moves at its continuous physical position, but every
    // visible marker centre sits ON a JNG vertical grid line (x = 8 mod 16),
    // so the 4-cell train body fills cells rather than straddling them.
    const visible = async () => ({
      x: Number(await marker.getAttribute("data-x")),
      y: Number(await marker.getAttribute("data-y")),
    });
    const start = await visible();
    // the train may still be west of the map edge (line entry), where the
    // snapped column centre is negative — modulo flips sign there
    expect(Math.abs(start.x % 16)).toBe(8);
    expect(start.y % 16).toBe(0); // tracks remain at row centres
    // Signals start red: set NW1's road (map signal click) so 5024C runs.
    await page.getByRole("button", { name: /Signal NW1 \(NW1\), aspect red/ }).click();
    await page.clock.fastForward("00:00:20");
    const moving = await visible();
    expect(moving.x % 16).toBe(8);
    expect(moving.y % 16).toBe(0);
    expect(Math.abs(moving.x - start.x)).toBeGreaterThan(0);
    expect(Math.abs(moving.x - start.x) % 16).toBe(0);
  });

  test("jatinegara platform dwell centres before the red exit signal", async ({ page }) => {
    await page.clock.install();
    await page.goto("/jng?start=06:00");
    // 5024C is an eastbound KRL on t1 (boundary 06:01:15, JNG arr 06:04, dep 06:05).
    const marker = page.locator('[data-train="5024C"]');
    const entry = page.locator('[role="button"][aria-label^="Signal NW1 ("]');
    const entryA = page.locator('[role="button"][aria-label^="Signal NW1A ("]');
    const exit = page.locator('[role="button"][aria-label^="Signal XE1 ("]');
    await entry.dispatchEvent("click");
    await page.clock.fastForward("00:00:01");
    await entryA.dispatchEvent("click");
    await page.clock.fastForward("00:00:01");
    await expect(entry).toHaveAttribute("aria-label", /aspect (amber|green)/);
    await expect(entryA).toHaveAttribute("aria-label", /aspect (amber|green)/);

    // Advance to platform arrival at 06:04 (t=112s in the sim clock from 06:00)
    for (let s = 0; s < 75; s++) {
      await page.clock.fastForward("00:00:02");
      if ((await marker.getAttribute("data-x")) === "360") break;
    }
    await expect(marker).toHaveAttribute("data-x", "360");
    await expect(entry).toHaveAttribute("aria-label", /aspect red/);
    await expect(exit).toHaveAttribute("aria-label", /aspect red/);

    // Crossing the arrival tick into the scheduled dwell must not overrun one
    // grid cell and teleport back. The train remains at U–X while XE1 stays
    // red; clearing NW1 earlier does not consume the station exit signal.
    for (let second = 0; second < 20; second++) {
      await page.clock.fastForward("00:00:01");
      await expect(marker).toHaveAttribute("data-x", "360");
    }
    await expect(marker).toHaveAttribute("data-x", "360");
    await expect(exit).toHaveAttribute("aria-label", /aspect red/);

    // After the scheduled dwell, XE1 is still the governing signal. The train
    // must remain centred at JNG rather than be moved to an approach hold in
    // front of the platform.
    await page.clock.fastForward("00:09:30");
    await expect(marker).toHaveAttribute("data-x", "360");
    await expect(exit).toHaveAttribute("aria-label", /aspect red/);
  });

  test("jatinegara marker never steps backward at a pass-through boundary", async ({ page }) => {
    await page.clock.install();
    await page.goto("/jng?start=06:00");
    // 5024C runs JNG-W -> JNG -> JNG-E. The two boundaries are PASS-THROUGH
    // stops (schedule arr == dep), so their dwell anchor equals the expected
    // arrival and the engine runs straight through. Presentation code that
    // compared those times instead of testing the pass-through flag treated
    // the boundary as a platform dwell, dropped the front compensation, and
    // snapped the marker back by one visual half-body (-32) before pushing it
    // forward again — a visible one-cell glitch with no engine movement.
    const marker = page.locator('[data-train="5024C"]');
    for (const name of ["NW1 (", "NW1A (", "XE1 ("]) {
      await page.locator(`[role="button"][aria-label^="Signal ${name}"]`).dispatchEvent("click");
      await page.clock.fastForward("00:00:01");
    }

    let prev: number | null = null;
    let backward: string | null = null;
    for (let step = 0; step < 180 && backward === null; step++) {
      await page.clock.fastForward("00:00:02");
      const raw = await marker.getAttribute("data-x").catch(() => null);
      if (raw === null) {
        if (prev !== null && prev > 360) break; // train finished its journey and despawned
        continue;
      }
      const x = Number(raw);
      // Eastbound: the drawn x must never decrease. Any decrease is the glitch.
      if (prev !== null && x < prev) backward = `x went ${prev} -> ${x} at step ${step}`;
      prev = x;
    }
    expect(backward).toBeNull();
    // Sanity: the train really did traverse the station, so the sweep above
    // actually covered the arrival, the dwell, and the exit boundary.
    expect(prev === null ? -Infinity : prev).toBeGreaterThan(360);
  });

  test.skip("jatinegara J410 enters on t6 and crosses onto t5 through xov10", async ({ page }) => {
    // SKIPPED: this test exercised the entryLine feature with a stub train
    // (J410) that has no equivalent in the real 168Railway timetable. The
    // entryLine mechanism is still exercised by the unit verifier.
    await page.clock.install();
    await page.goto("/jng?start=06:00&controls=1");
    const marker = page.locator('[data-train="J410"]');
    const nw5 = page.locator('[role="button"][aria-label^="Signal NW5"]');
    await expect(marker).toBeVisible();

    // The entryLine (t6) stop puts the approach on row 336: J410 slides in
    // from the west border on t6 — never materialising on the t5 stub.
    await page.clock.fastForward("00:00:05");
    await expect(marker).toHaveAttribute("data-y", "336");

    // All signals red: the approach holds at NW5, short of the xov10
    // junction — a realistic arrival waiting for its road.
    await page.clock.fastForward("00:00:20");
    await expect(marker).toHaveAttribute("data-y", "336");
    const held = Number(await marker.getAttribute("data-x"));
    expect(held).toBeGreaterThan(32); // past the west border
    expect(held).toBeLessThan(256); // short of the sw 43 junction

    // Throw sw 43 so the road bends through xov10, then clear NW5: the
    // train crosses onto t5 and dwells at the JNG island before red XE5.
    await page.locator('[role="button"][aria-label*="(sw 43)"]').first().click();
    await nw5.click();
    await expect
      .poll(
        async () => {
          await page.clock.fastForward("00:00:01");
          return marker.getAttribute("data-x");
        },
        { intervals: [10], timeout: 60000 }
      )
      .toBe("360");
    await expect(marker).toHaveAttribute("data-y", "368");
    await expect(marker).toHaveAttribute("data-x", "360");
  });

  test("jatinegara visual marker stops behind NE2 at AU, not AV", async ({ page }) => {
    await page.clock.install();
    await page.goto("/jng?start=06:04");
    // 5509B is a westbound KRL on t2 (boundary 05:55:15, JNG arr 06:03/dep 06:04).
    // At start=06:04 it is departing JNG westbound on t2 toward NE2.
    const marker = page.locator('[data-train="5509B"]');
    await expect(marker).toBeVisible();

    // NE2 is at AT14. The engine stops 5509B safely behind it using its
    // operational footprint; the shorter, 4-cell drawn marker is then placed
    // with its west end at AU's left grid line, so it reads as occupying AU–AX
    // rather than needlessly starting at AV.
    await page.clock.fastForward("00:02:00");
    await expect(marker).toHaveAttribute("data-x", "776");
    const transform = await marker.getAttribute("transform");
    expect(transform).toContain("translate(776, 464)");

    // Releasing NE2 must carry the same visual-front compensation into the
    // running state. It may stay in AU for a moment or progress west, but it
    // must never jump backward (east) into AV as the stopped flag flips off.
    await page.getByRole("button", { name: /Signal NE2 \(NE2\), aspect red/ }).click();
    await page.clock.fastForward("00:00:01");
    expect(Number(await marker.getAttribute("data-x"))).toBeLessThanOrEqual(776);
  });

  test("jatinegara body bends as soon as the NOSE reaches a thrown point", async ({ page }) => {
    await page.clock.install();
    await page.goto("/jng?start=06:04");
    // 5509B is a westbound KRL on t2 (y=464), departing JNG at 06:04.
    const marker = page.locator('[data-train="5509B"]');
    await expect(marker).toBeVisible();

    // The engine only records nodes its CENTRE has passed, so a naive spine
    // bends half a body late — visibly "turning" only once the tail nears the
    // point. Looking ahead down the set route must bend it while the marker is
    // still centred well east of PC16's junction at AM12.
    await page.locator('[role="button"][aria-label*="(PC16)"]').first().click();
    await page.locator('[role="button"][aria-label^="Signal NE2"]').click();
    // Step the fake clock 1s at a time until the nose reaches the thrown
    // point — robust against leg-speed changes.
    await expect
      .poll(
        async () => {
          await page.clock.fastForward("00:00:01");
          return marker.getAttribute("data-bendy");
        },
        { intervals: [10], timeout: 60000 }
      )
      .toBe("true");
    await expect(marker).toHaveAttribute("data-bendy", "true");
    // still centred on the straight, east of the junction it is bending into
    await expect(marker).toHaveAttribute("data-y", "464");
    expect(Number(await marker.getAttribute("data-x"))).toBeGreaterThan(640);
  });

  test("jatinegara train body bends through a thrown crossover", async ({ page }) => {
    await page.clock.install();
    await page.goto("/jng?start=06:04");
    // 5509B is a westbound KRL on t2 (y=464), departing JNG at 06:04.
    const marker = page.locator('[data-train="5509B"]');
    await expect(marker).toBeVisible();
    const body = marker.locator('path[data-train-body="articulated"]');

    // On plain track the marker is the historical rigid box: the articulated
    // path stays hidden and the group carries the rotation.
    await expect(marker).toHaveAttribute("data-bendy", "false");
    await expect(body).toBeHidden();

    // PC13 sends 5509B down the 45° crossover. While it straddles the junction
    // the body must BEND rather than rotate rigidly: the rect hides, the
    // articulated path shows, and the group stops rotating.
    await page.locator('[role="button"][aria-label*="(PC13)"]').first().click();
    await page.locator('[role="button"][aria-label^="Signal NE2"]').click();
    // Poll into the crossover at 1s steps so the body is caught mid-bend
    // regardless of running speed.
    await expect
      .poll(
        async () => {
          await page.clock.fastForward("00:00:01");
          return marker.getAttribute("data-bendy");
        },
        { intervals: [10], timeout: 60000 }
      )
      .toBe("true");
    await expect(marker).toHaveAttribute("data-bendy", "true");
    await expect(body).toBeVisible();
    await expect(marker.locator("rect").first()).toBeHidden();
    // A bendy marker carries its geometry in the path, so the GROUP must not
    // also rotate — that would turn the bend twice.
    await expect(marker).toHaveAttribute("transform", /scale\(/);
    await expect(marker).not.toHaveAttribute("transform", /rotate\(-?[1-9]/);
    // The body spans two bearings, so it reaches well beyond the depth a flat
    // marker could ever occupy (half of the 14-unit body, before scaling).
    const depth = await body.evaluate((el) => (el as SVGPathElement).getBBox().height);
    expect(depth).toBeGreaterThan(14);



    // The bent outline is a closed hexagon: two ends plus one mitred joint per
    // side. A rigid box would only ever have four corners.
    const d = (await body.getAttribute("d")) ?? "";
    expect(d.endsWith("Z")).toBe(true);
    expect(d.split("L").length - 1).toBe(5); // 6 vertices

    // The bend is not sticky: once the whole body is back on plain track the
    // cheap rigid box returns, rotated onto that track's own bearing. (JNG's
    // crossover is shorter than the marker, so a train is never rigid mid-way
    // across it — it bends from entry to exit.)
    // The clock is faked, so time only moves when the test advances it: step
    // it forward until the whole body is back on plain track. Polling alone
    // would spin on a frozen simulation.
    await expect
      .poll(
        async () => {
          await page.clock.fastForward("00:00:10");
          return await marker.getAttribute("data-bendy");
        },
        {
          intervals: [50],
          timeout: 15000,
          message: "the marker never returned to the rigid box after the crossover",
        }
      )
      .toBe("false");
    await expect(body).toBeHidden();
    await expect(marker.locator("rect").first()).toBeVisible();
  });

  test("jatinegara point controls remain individually clickable", async ({ page }) => {
    // At 08:00 real timetable trains are running over the throat. The test
    // proves both protections: scissors controls do not overlap each other
    // and train markers never paint over a point control.
    await page.goto("/jng?start=08:00");
    const controls = page.locator('[role="button"][aria-label^="Wesel"]');
    await expect(controls).toHaveCount(35);

    // A native Playwright click fails if another SVG element owns the centre —
    // exactly how stacked scissors controls and train rectangles regressed.
    // Each successful click must change only that element's own pressed state.
    for (let i = 0; i < 28; i++) {
      const control = controls.nth(i);
      const before = await control.getAttribute("aria-pressed");
      expect(before).not.toBeNull();
      await control.click();
      await expect(control).toHaveAttribute("aria-pressed", before === "true" ? "false" : "true");
      await control.click(); // restore the initial, all-normal table for the next control
      await expect(control).toHaveAttribute("aria-pressed", before!);
    }
  });

  test("jatinegara interactive table — 26 signal controls, manual route set works", async ({ page }) => {
    // Start with an empty board: at realistic running speeds service trains
    // would occupy the mains and block the NW1 route this test sets.
    await page.goto("/jng?start=00:00&controls=1");
    // all 26 signals are clickable controls (schematic mode, no grid chrome)
    await expect(page.getByRole("button", { name: /^NW1 · MERAH/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^NW1A · MERAH/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^XW2A · MERAH/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^XE8 ·/ })).toBeVisible();
    await expect(page.getByText("A", { exact: true })).toHaveCount(2); // the graph-paper grid chrome is shown (top + bottom letters)
    // the point handles are present (35: 24 coupled groups, two of which draw
    // one handle per switch, + 8 singles)
    await expect(page.locator('[role="button"][aria-label^="Wesel"]')).toHaveCount(35);
    // a route already formed by the points as they stand still clears: NW1
    // needs no point moves, so it lights amber (next signal still red)
    await page.getByRole("button", { name: /^NW1 · MERAH/ }).click();
    await expect(page.getByRole("button", { name: /^NW1 · KUNING/ })).toBeVisible();
    // its route locks the track-1 switches it passes
    await expect(page.locator('[role="button"][aria-label*="terkunci"]').first()).toBeVisible();
    // Manual route setting (interlocking.routeSetting = "manual"): NE5→XW4
    // needs P36 reversed. The signal must REFUSE rather than throw the point
    // itself — the road is not set, so the track is not reachable.
    const p36 = page.locator('[role="button"][aria-label^="Wesel 36 "]');
    await expect(p36).toHaveAttribute("aria-label", /lurus/);
    await page.getByRole("button", { name: /^NE5 · MERAH/ }).click();
    // the refusal names the point that is set the wrong way, and which way it
    // must go — not just "the road is not passable"
    await expect(page.getByText(/posisi wesel salah/i)).toBeVisible();
    await expect(page.getByText(/Wesel 36 harus BELOK/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^NE5 · MERAH/ })).toBeVisible();
    // the refusal must not have moved the point on the user's behalf
    await expect(p36).toHaveAttribute("aria-label", /lurus/);
    // set the road by hand, and the very same click now succeeds
    await p36.click();
    await expect(p36).toHaveAttribute("aria-label", /belok/);
    await page.getByRole("button", { name: /^NE5 · MERAH/ }).click();
    await expect(page.getByRole("button", { name: /^NE5 · (KUNING|HIJAU)/ })).toBeVisible();
    await expect(page.locator('[role="button"][aria-label*="belok, terkunci"]').first()).toBeVisible();
  });

  test("jatinegara NW1 reservation never re-lights after train passes", async ({ page }) => {
    await page.clock.install();
    await page.goto("/jng?start=06:00");
    await page.locator('[role="button"][aria-label^="Signal NW1 ("]').click({ force: true });
    await page.locator('[role="button"][aria-label^="Signal NW1A ("]').click({ force: true });
    await page.clock.fastForward("00:00:08");
    await page.locator('[role="button"][aria-label^="Signal NE2 ("]').click({ force: true });

    let glitchDetected = false;
    const marker = page.locator('[data-train="5024C"]');
    for (let step = 0; step < 60; step++) {
      await page.clock.fastForward("00:00:02");
      const rawX = await marker.getAttribute("data-x").catch(() => null);
      if (rawX === null) continue;
      const x = Number(rawX);
      const paths = await page.evaluate(() =>
        [...document.querySelectorAll('path[stroke="#f59e0b"]')].map((p) => p.getAttribute("d") ?? "")
      );
      // NW1 reservation starts at 64,496 and ends at 240,496. Once 5024C has passed
      // x=240, NW1 reservation must NEVER re-appear in full (64,496 -> 240,496).
      if (x > 250 && paths.some((d) => d.includes("64,496") && d.includes("240,496"))) {
        glitchDetected = true;
        break;
      }
    }
    expect(glitchDetected).toBe(false);
  });
