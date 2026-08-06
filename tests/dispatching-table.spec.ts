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
    await page.goto("/");
    // first build/serve of the page can be slow
    await expect(
      page.locator('svg[aria-label^="Railway dispatching table"]')
    ).toBeVisible({ timeout: 30_000 });
  });

  test("renders the table and settings button; no persistent status line", async ({ page }) => {
    await expect(
      page.locator('svg[aria-label^="Railway dispatching table"]')
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Settings" })).toBeVisible();
    // renamed block signals on the approach lines; two sets share display codes
    await expect(page.getByRole("button", { name: /B101 ·/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /B106 ·/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /B109 ·/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /B201 ·/ })).toHaveCount(2);
    await expect(page.getByRole("button", { name: /B204 ·/ })).toHaveCount(2);
    // the verbose status paragraph is hidden to save vertical space
    await expect(page.locator("text=All points normal.")).toHaveCount(0);
  });

  test("settings popover opens, toggle defaults on, Escape closes", async ({ page }) => {
    await page.getByRole("button", { name: "Settings" }).click();
    const toggle = page.getByRole("switch", { name: "Show control buttons" });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("Escape");
    await expect(toggle).toBeHidden();
  });

  test("control buttons can be hidden and restored", async ({ page }) => {
    const p3 = page.getByRole("button", { name: /P3 ·/ });
    await expect(p3).toBeVisible();
    await page.getByRole("button", { name: "Settings" }).click();
    await page.getByRole("switch", { name: "Show control buttons" }).click();
    // the whole bottom row unmounts; the settings gear stays
    await expect(p3).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Settings" })).toBeVisible();
    await page.getByRole("switch", { name: "Show control buttons" }).click();
    await expect(p3).toBeVisible();
  });

  test("throwing a point reverses it", async ({ page }) => {
    await page.getByRole("button", { name: /P3 ·/ }).click();
    await expect(page.getByRole("button", { name: /P3 · REVERSED/ })).toBeVisible();
  });

  test("clearing a signal shows green and draws the reserved route", async ({ page }) => {
    // S2's next signal (B13 block chain) is clear, so S2 shows green;
    // S1 would only show amber because its next signal S2 is red.
    await page.getByRole("button", { name: /S2 ·/ }).click();
    await expect(page.getByRole("button", { name: /S2 · GREEN/ })).toBeVisible();
    // the reserved route overlay (amber) is drawn for the cleared signal
    await expect(page.locator('path[stroke="#f59e0b"]')).toHaveCount(1);
  });

  test("signal whose route needs a thrown point stays red", async ({ page }) => {
    // S7 rejoins the main line at P5 only when P5 is reversed
    await page.getByRole("button", { name: /S7 ·/ }).click();
    await expect(page.locator("text=points not set (ends at P5)")).toBeVisible();
    await expect(page.getByRole("button", { name: /S7 · RED/ })).toBeVisible();
  });

  test("opposite-direction overlap is refused with a conflict note", async ({ page }) => {
    // Reverse the right crossover: S2 (right) diverts up through P7/P8 onto
    // the top line, while S4 (left) diverts down the same way — the two
    // reserved routes overlap, so S4 must be refused.
    await page.getByRole("button", { name: /P7\+P8 ·/ }).click();
    await expect(page.getByRole("button", { name: /P7\+P8 · REVERSED/ })).toBeVisible();
    await page.getByRole("button", { name: /S2 ·/ }).click();
    await expect(page.getByRole("button", { name: /S2 · GREEN/ })).toBeVisible();
    await page.getByRole("button", { name: /S4 ·/ }).click();
    await expect(
      page.locator("text=S4 cannot clear — its route overlaps S2's reservation")
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /S4 · RED/ })).toBeVisible();
  });

  test("points under a cleared route are approach-locked", async ({ page }) => {
    await page.getByRole("button", { name: /S1 ·/ }).click();
    await expect(page.getByRole("button", { name: /S1 · AMBER/ })).toBeVisible();
    // S1's route passes through P2 and P5; the coupled P1+P2 control reports
    // the pair by its full name in the conflict toast.
    const p2 = page.getByRole("button", { name: /P2 ·/ });
    await expect(p2).toHaveAttribute("aria-disabled", "true");
    await p2.click({ force: true });
    await expect(page.locator("text=P1+P2 is locked by S1")).toBeVisible();
  });

  test("wrong-way reservation holds the opposite chain at red", async ({ page }) => {
    // S4 with the right crossover reversed drops onto the bottom line running
    // against normal traffic → S1 and the B101–B104 approach chain must be held
    // at red (the section is reserved by the wrong-way move). The exit chain
    // east of the map is beyond the reserved stretch, so it stays green.
    await page.getByRole("button", { name: /P7\+P8 ·/ }).click();
    await expect(page.getByRole("button", { name: /P7\+P8 · REVERSED/ })).toBeVisible();
    await page.getByRole("button", { name: /S4 ·/ }).click();
    await expect(page.getByRole("button", { name: /S4 · GREEN/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /S1 · RED/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /B101 · RED/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /B104 · RED/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /B109 · GREEN/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /B106 · GREEN/ })).toBeVisible();
  });

  test("both crossovers reversed: bounded wrong-way diversion reds only what it covers", async ({ page }) => {
    // With BOTH crossovers reversed the train loops through them and returns to
    // the top line — the wrong-way stretch is bounded between the crossovers, so
    // the approach chain west of it (B101–B104) is NOT force-red; only the exit
    // chain stays untouched too.
    await page.getByRole("button", { name: /P7\+P8 ·/ }).click();
    await page.getByRole("button", { name: /P1\+P2 ·/ }).click();
    await expect(page.getByRole("button", { name: /P7\+P8 · REVERSED/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /P1\+P2 · REVERSED/ })).toBeVisible();
    await page.getByRole("button", { name: /S4 ·/ }).click();
    await expect(page.getByRole("button", { name: /S4 · GREEN/ })).toBeVisible();
    // B104's section (A4, west of the left crossover) is not covered by the
    // bounded wrong-way span → stays green
    await expect(page.getByRole("button", { name: /B104 · GREEN/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /B109 · GREEN/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /B106 · GREEN/ })).toBeVisible();
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
    await expect(page.getByRole("group", { name: "Time scale" })).toBeVisible();
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

  test("train 107B follows its schedule (CIT 1:00 → TB 4:30 → BKST 9:00)", async ({ page }) => {
    // faked clock: drive the sim deterministically instead of waiting real time
    await page.clock.install();
    await page.goto("/");
    await expect(page.locator('svg[aria-label^="Railway dispatching table"]')).toBeVisible();
    // the train must pass the player-controlled signals — clear them so it can run
    await page.getByRole("button", { name: /S5 ·/ }).click();
    await page.getByRole("button", { name: /S4 ·/ }).click();
    const marker = page.locator('[data-train="107B"]');
    const x = async () => await marker.evaluate((el) => parseFloat(el.getAttribute("data-x") ?? "NaN"));
    // before 1:00 the train has not materialized
    await page.clock.fastForward("00:00:59");
    await expect(marker).toBeHidden();
    // pre-spawn: block signals read normally — no phantom occupancy from the
    // not-yet-appeared train (both B204 sets must be green)
    await expect(page.getByRole("button", { name: /B204 · GREEN/ })).toHaveCount(2);
    // just after 1:00 → at CIT platform (center ≈ 1682)
    await page.clock.fastForward("00:00:03");
    await expect(marker).toBeVisible();
    expect(Math.abs((await x()) - 1682)).toBeLessThan(40);
    // just after 4:30 → at TB platform (center ≈ 638), grid-aligned
    await page.clock.fastForward("00:03:31");
    expect(Math.abs((await x()) - 638)).toBeLessThan(40);
    expect((await x()) % 58).toBe(0); // snapped to the cell grid
    // just after 9:00 → at BKST platform (center ≈ -290)
    await page.clock.fastForward("00:04:31");
    expect(Math.abs((await x()) - -290)).toBeLessThan(20);
  });

  test("train stops at a player-red signal and resumes when cleared", async ({ page }) => {
    await page.clock.install();
    await page.goto("/");
    await expect(page.locator('svg[aria-label^="Railway dispatching table"]')).toBeVisible();
    const marker = page.locator('[data-train="107B"]');
    const x = async () => await marker.evaluate((el) => parseFloat(el.getAttribute("data-x") ?? "NaN"));
    // S4 left red: the train stops with its LEADING edge at the signal — the
    // center holds at 1076+58, the snapped span is [29,30] → box center 1160
    await page.clock.fastForward("00:04:00");
    await expect(marker).toBeVisible();
    expect(Math.abs((await x()) - 1160)).toBeLessThan(20);
    // still stopped a while later
    await page.clock.fastForward("00:02:00");
    expect(Math.abs((await x()) - 1160)).toBeLessThan(20);
    // clear S4 → the train resumes west (toward S5)
    await page.getByRole("button", { name: /S4 ·/ }).click();
    await page.clock.fastForward("00:00:40");
    expect(await x()).toBeLessThan(1160 - 100);
  });

  test("train diverts when the right crossover is reversed", async ({ page }) => {
    await page.clock.install();
    await page.goto("/");
    await expect(page.locator('svg[aria-label^="Railway dispatching table"]')).toBeVisible();
    const marker = page.locator('[data-train="107B"]');
    const y = async () => await marker.evaluate((el) => parseFloat(el.getAttribute("data-y") ?? "NaN"));
    // throw the right crossover FIRST — clearing S4 would lock P8 via its route
    await page.getByRole("button", { name: /P7\+P8 ·/ }).click();
    await expect(page.getByRole("button", { name: /P7\+P8 · REVERSED/ })).toBeVisible();
    // then clear the signals so the train can run to the crossover
    await page.getByRole("button", { name: /S5 ·/ }).click();
    await page.getByRole("button", { name: /S4 ·/ }).click();
    // by ~3:40 the train has passed p8 — diverted, it descends the crossover
    await page.clock.fastForward("00:03:40");
    await expect(marker).toBeVisible();
    expect(await y()).toBeGreaterThan(100); // left the top line (y=89)
  });

  test("train stays on the top line with points normal", async ({ page }) => {
    await page.clock.install();
    await page.goto("/");
    await expect(page.locator('svg[aria-label^="Railway dispatching table"]')).toBeVisible();
    await page.getByRole("button", { name: /S5 ·/ }).click();
    await page.getByRole("button", { name: /S4 ·/ }).click();
    await page.clock.fastForward("00:04:00"); // past p8, still on the top line
    const y = await page
      .locator('[data-train="107B"]')
      .evaluate((el) => parseFloat(el.getAttribute("data-y") ?? "NaN"));
    expect(Math.abs(y - 89)).toBeLessThan(1);
  });

  test("train occupancy overrides a cleared signal and cascades the blocks", async ({ page }) => {
    await page.clock.install();
    await page.goto("/");
    await expect(page.locator('svg[aria-label^="Railway dispatching table"]')).toBeVisible();
    // clear S4 + S5 so the train can run through to TB
    await page.getByRole("button", { name: /S5 ·/ }).click();
    await page.getByRole("button", { name: /S4 ·/ }).click();
    await expect(page.getByRole("button", { name: /S4 · GREEN/ })).toBeVisible();
    // both B201 blocks are green: the approach set (no signal west of it since
    // A2 was cut) and the exit set (mirroring the cleared S4)
    await expect(page.getByRole("button", { name: /B201 · GREEN/ })).toHaveCount(2);
    // train reaches TB (inside S4's protected section) just after 4:30
    await page.clock.fastForward("00:04:31");
    // S4 forced red despite being cleared (the train occupies its section)
    await expect(page.getByRole("button", { name: /S4 · RED/ })).toBeVisible();
    // the exit B201 drops to amber (mirroring the occupancy-red S4); the
    // approach B201 stays green (no next signal)
    await expect(page.getByRole("button", { name: /B201 · GREEN/ })).toHaveCount(1);
    await expect(page.getByRole("button", { name: /B201 · AMBER/ })).toHaveCount(1);
    // the train's pass consumed the clear: S4 stays red even after the train
    // leaves its section (re-cleared only by the player)
    await page.clock.fastForward("00:04:00");
    await expect(page.getByRole("button", { name: /S4 · RED/ })).toBeVisible();
  });

  test("player signal stays red after the train passes until re-cleared", async ({ page }) => {
    await page.clock.install();
    await page.goto("/");
    await expect(page.locator('svg[aria-label^="Railway dispatching table"]')).toBeVisible();
    await page.getByRole("button", { name: /S5 ·/ }).click();
    await page.getByRole("button", { name: /S4 ·/ }).click();
    await expect(page.getByRole("button", { name: /S4 · GREEN/ })).toBeVisible();
    // the train passes S4 (~3:02); from then on S4 must stay red
    await page.clock.fastForward("00:04:00");
    await expect(page.getByRole("button", { name: /S4 · RED/ })).toBeVisible();
    await page.clock.fastForward("00:03:00");
    await expect(page.getByRole("button", { name: /S4 · RED/ })).toBeVisible();
    // the player re-clears → it lights again (amber: the next signal S5 was also consumed)
    await page.getByRole("button", { name: /S4 ·/ }).click();
    await expect(page.getByRole("button", { name: /S4 · AMBER/ })).toBeVisible();
  });

  test("reservation highlight shrinks to the unpassed cells as the train advances", async ({ page }) => {
    await page.clock.install();
    await page.goto("/");
    await expect(page.locator('svg[aria-label^="Railway dispatching table"]')).toBeVisible();
    // clear ONLY S4: its reservation runs from S4 (x 1076) west to S5 (x 558)
    await page.getByRole("button", { name: /S4 ·/ }).click();
    await expect(page.getByRole("button", { name: /S4 · AMBER/ })).toBeVisible();
    // before the train reaches it: the full reservation is highlighted (starts at S4)
    await page.clock.fastForward("00:01:00");
    const earlyD = (await page.locator('path[stroke="#f59e0b"]').first().getAttribute("d")) ?? "";
    expect(earlyD).toContain("1076");
    // train midway (t≈4:00, front ≈ 729): the passed cells un-highlight, the far
    // end (S5) stays lit
    await page.clock.fastForward("00:03:00");
    const paths = page.locator('path[stroke="#f59e0b"]');
    const ds: string[] = [];
    for (let i = 0; i < (await paths.count()); i++) ds.push((await paths.nth(i).getAttribute("d")) ?? "");
    const joined = ds.join(" ");
    expect(joined).not.toContain("1076");
    expect(joined).toContain("558");
  });

  test("train position never jumps backward while passing signals", async ({ page }) => {
    await page.clock.install();
    await page.goto("/");
    await expect(page.locator('svg[aria-label^="Railway dispatching table"]')).toBeVisible();
    await page.getByRole("button", { name: /S5 ·/ }).click();
    await page.getByRole("button", { name: /S4 ·/ }).click();
    const x = async () =>
      await page
        .locator('[data-train="107B"]')
        .evaluate((el) => parseFloat(el.getAttribute("data-x") ?? "NaN"));
    // step through the train passing B203/B202/B201/S4/S5 — the marker must
    // move strictly west (never flicker back and forth at a signal boundary)
    let prev = Infinity;
    for (let t = 0; t < 240; t += 10) {
      await page.clock.fastForward("00:00:10");
      const v = await x();
      if (Number.isNaN(v)) continue; // not spawned yet
      expect(v).toBeLessThanOrEqual(prev);
      prev = v;
    }
  });

  test("block signal behind stays red until the train's tail clears the section", async ({ page }) => {
    await page.clock.install();
    await page.goto("/");
    await expect(page.locator('svg[aria-label^="Railway dispatching table"]')).toBeVisible();
    await page.getByRole("button", { name: /S5 ·/ }).click();
    await page.getByRole("button", { name: /S4 ·/ }).click();
    // t≈180: the front has passed B201-exit (x 1247) but the rear is still in
    // the section [1076,1247] — body occupancy keeps it red; B202-exit mirrors it
    await page.clock.fastForward("00:03:00");
    await expect(page.getByRole("button", { name: /B201 · RED/ })).toHaveCount(1);
    await expect(page.getByRole("button", { name: /B202 · AMBER/ })).toHaveCount(1);
    // t≈210: the tail has cleared — the occupancy red ends; the block now
    // mirrors the consumed S4 → amber, not red
    await page.clock.fastForward("00:00:30");
    await expect(page.getByRole("button", { name: /B201 · RED/ })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /B201 · AMBER/ })).toHaveCount(1);
  });

  test("diverted route: S4 stays player-controlled and the highlight follows the train", async ({ page }) => {
    await page.clock.install();
    await page.goto("/");
    await expect(page.locator('svg[aria-label^="Railway dispatching table"]')).toBeVisible();
    // reverse both crossovers: S4's route diverts down through P7+P8, west on
    // the bottom line, and back up through P1+P2
    await page.getByRole("button", { name: /P7\+P8 ·/ }).click();
    await page.getByRole("button", { name: /P1\+P2 ·/ }).click();
    await page.getByRole("button", { name: /S4 ·/ }).click();
    await expect(page.getByRole("button", { name: /S4 · GREEN/ })).toBeVisible();
    // before the train reaches it, S4 stays green (player-controlled) and the
    // full reservation is highlighted
    await page.clock.fastForward("00:02:30"); // t≈150 — train still approaching
    await expect(page.getByRole("button", { name: /S4 · GREEN/ })).toBeVisible();
    const earlyD = (await page.locator('path[stroke="#f59e0b"]').first().getAttribute("d")) ?? "";
    expect(earlyD).toContain("1076");
    // t≈230: the train has passed S4 (consumed → red) and is on the crossover /
    // bottom line — the highlight must follow it, not revert to the full route
    await page.clock.fastForward("00:01:20");
    await expect(page.getByRole("button", { name: /S4 · RED/ })).toBeVisible();
    const paths = page.locator('path[stroke="#f59e0b"]');
    const ds: string[] = [];
    for (let i = 0; i < (await paths.count()); i++) ds.push((await paths.nth(i).getAttribute("d")) ?? "");
    expect(ds.join(" ")).not.toContain("1076");
  });

  test("visual — default layout", async ({ page }) => {
    await expect(page).toHaveScreenshot("dispatching-default.png", {
      fullPage: true,
      // the running clock changes every frame — exclude it from comparison
      mask: [page.getByRole("timer")],
    });
  });

  test("visual — settings popover open", async ({ page }) => {
    await page.getByRole("button", { name: "Settings" }).click();
    await expect(page.getByRole("switch", { name: "Show control buttons" })).toBeVisible();
    await expect(page).toHaveScreenshot("settings-open.png", {
      fullPage: true,
      mask: [page.getByRole("timer")],
    });
  });

  test("visual — control buttons hidden", async ({ page }) => {
    await page.getByRole("button", { name: "Settings" }).click();
    await page.getByRole("switch", { name: "Show control buttons" }).click();
    await expect(page.getByRole("button", { name: /P3 ·/ })).toHaveCount(0);
    await expect(page).toHaveScreenshot("controls-hidden.png", {
      fullPage: true,
      mask: [page.getByRole("timer")],
    });
  });

  test("visual — cleared route and reversed point", async ({ page }) => {
    await page.getByRole("button", { name: /P3 ·/ }).click();
    await page.getByRole("button", { name: /S2 ·/ }).click();
    await expect(page.getByRole("button", { name: /S2 · GREEN/ })).toBeVisible();
    await expect(page).toHaveScreenshot("interacted.png", {
      fullPage: true,
      mask: [page.getByRole("timer")],
    });
  });

  test("visual — conflict toast", async ({ page }) => {
    await page.getByRole("button", { name: /P7\+P8 ·/ }).click();
    await page.getByRole("button", { name: /S2 ·/ }).click();
    await expect(page.getByRole("button", { name: /S2 · GREEN/ })).toBeVisible();
    await page.getByRole("button", { name: /S4 ·/ }).click();
    await expect(page.locator("text=S4 cannot clear")).toBeVisible();
    await expect(page).toHaveScreenshot("conflict-toast.png", {
      fullPage: true,
      mask: [page.getByRole("timer")],
    });
  });
});
