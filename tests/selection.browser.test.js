import { it, expect } from "vitest";
import { commands } from "vitest/browser";
import { mountEditor } from "../src/editor";

it("reproduces paragraph-end block highlighting only with bookmarks", async () => {
  const results = [];
  for (const [fixture, finalWord] of [
    ["bookmarks", "END"],
    ["bookmarks", "END."],
    ["no-bookmarks", "END."],
  ]) {
    const host = document.createElement("div");
    host.style.cssText = "width:1100px;height:900px;overflow:auto";
    document.body.append(host);
    const editor = await mountEditor(host, fixture);
    try {
      await expect.poll(() => host.querySelectorAll(".superdoc-line").length).toBeGreaterThan(3);
      const point = (word, end) => {
        const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          if (!node.parentElement?.closest(".superdoc-line")) continue;
          const index = (node.textContent ?? "").indexOf(word);
          if (index < 0) continue;
          const offset = end ? index + word.length - 1 : index;
          const range = document.createRange();
          range.setStart(node, offset);
          range.setEnd(node, offset + 1);
          const rect = range.getBoundingClientRect();
          return { x: end ? rect.right - 0.2 : rect.left + 0.2, y: rect.top + rect.height / 2 };
        }
        throw new Error(`Missing rendered text: ${word}`);
      };
      const name = `${fixture}-${finalWord.endsWith(".") ? "end" : "before-end"}`;
      await commands.dragSelection([point("This paragraph", false), point(finalWord, true)], name);
      await expect
        .poll(() => editor.ui.selection.getSnapshot().status, { timeout: 15000 })
        .toBe("ready");
      const snapshot = editor.ui.selection.getSnapshot();
      const rects = [...host.querySelectorAll("[data-v2-selection-overlay] > div")].map((el) => ({
        left: parseFloat(el.style.left),
        top: parseFloat(el.style.top),
        width: parseFloat(el.style.width),
        height: parseFloat(el.style.height),
      }));
      results.push({
        fixture,
        finalWord,
        quotedText: snapshot.quotedText,
        selectionTarget: snapshot.selectionTarget,
        rects,
        fonts: [...document.fonts]
          .filter((font) => font.status === "loaded")
          .map((font) => font.family),
      });
      await commands.recordResults(results);
      expect(snapshot.quotedText).toMatch(/^This paragraph/);
      const maximumHeight = Math.max(...rects.map((rect) => rect.height));
      if (fixture === "bookmarks" && finalWord === "END.")
        expect(maximumHeight).toBeGreaterThan(40);
      else expect(maximumHeight).toBeLessThan(25);
    } finally {
      editor.destroy();
      host.remove();
    }
  }
  expect(results[1].quotedText).toBe(results[2].quotedText);
}, 120000);
