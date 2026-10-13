import { SuperDoc } from "superdoc";
import "superdoc/style.css";

export async function mountEditor(host, fixture) {
  const response = await fetch(`/fixtures/${fixture}.docx`);
  if (!response.ok) throw new Error(`Fixture download failed: ${response.status}`);
  const blob = await response.blob();
  let editor;
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("SuperDoc ready timeout")), 60000);
    editor = new SuperDoc({
      selector: host,
      document: new File([blob], `${fixture}.docx`, {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
      documentMode: "suggesting",
      role: "editor",
      telemetry: { enabled: false },
      fonts: { bundled: { include: ["Calibri"] }, resolveAssetUrl: ({ file }) => `/fonts/${file}` },
      modules: { comments: false, trackChanges: { visible: true, mode: "review" } },
      onReady: () => {
        clearTimeout(timeout);
        resolve();
      },
    });
  });
  await document.fonts.ready;
  return editor;
}
