import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";
import { mkdir, writeFile } from "node:fs/promises";

export default defineConfig({
  optimizeDeps: { exclude: ["superdoc"] },
  test: {
    include: ["tests/*.browser.test.js"],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
      viewport: { width: 1280, height: 900 },
      commands: {
        async dragSelection(ctx, points, name) {
          const frame = await ctx.frame();
          const box = await (await frame.frameElement()).boundingBox();
          if (!box) throw new Error("Missing browser frame bounds");
          const viewport = await frame.evaluate(() => ({ width: innerWidth, height: innerHeight }));
          const coordinates = (p) => ({
            x: box.x + (p.x * box.width) / viewport.width,
            y: box.y + (p.y * box.height) / viewport.height,
          });
          const from = coordinates(points[0]),
            to = coordinates(points[1]);
          await ctx.page.mouse.move(from.x, from.y);
          await ctx.page.mouse.down();
          await ctx.page.mouse.move(to.x, to.y, { steps: 30 });
          await ctx.page.mouse.up();
          await ctx.page.waitForTimeout(500);
          await mkdir("evidence", { recursive: true });
          await frame.locator("body").screenshot({ path: `evidence/${name}.png` });
        },
        async recordResults(_ctx, results) {
          await mkdir("evidence", { recursive: true });
          await writeFile("evidence/results.json", JSON.stringify(results, null, 2) + "\n");
        },
      },
    },
  },
});
