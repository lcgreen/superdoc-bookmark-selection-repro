import { mountEditor } from "./editor";
import "./style.css";
let editor;
const host = document.querySelector("#editor");
const status = document.querySelector("#status");
async function load(fixture) {
  document.querySelectorAll("button").forEach((button) => {
    button.disabled = true;
  });
  status.textContent = "Loading…";
  editor?.destroy();
  host.replaceChildren();
  try {
    editor = await mountEditor(host, fixture);
    status.textContent = `Ready: ${fixture}`;
  } catch (error) {
    status.textContent = error.message;
  } finally {
    document.querySelectorAll("button").forEach((button) => {
      button.disabled = false;
    });
  }
}
document.querySelector("#bookmarks").onclick = () => load("bookmarks");
document.querySelector("#control").onclick = () => load("no-bookmarks");
load("bookmarks");
