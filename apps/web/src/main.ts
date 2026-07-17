import { registerSW } from "virtual:pwa-register";
import { doRedirect } from "./utils/redirect.utils";

// In auto-update mode the plugin activates the new worker immediately and
// reloads existing clients once it takes control. Its dev implementation is a
// no-op, so local development never tries to register a missing /sw.js.
registerSW({ immediate: true });

(async () => {
  if (!(await doRedirect())) {
    // Only import modules when we actually need to render the UI
    const React = await import("react");
    await import("./index.css");
    await import("./utils/theme-init.utils");
    const { App } = await import("./app");
    const { createRoot } = await import("react-dom/client");

    const container = document.querySelector("#root");

    if (!container) {
      throw new Error("App container not found");
    }

    const root = createRoot(container);
    root.render(React.createElement(App));
  }
})();
