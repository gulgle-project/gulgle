import { doRedirect } from "./utils/redirect.utils";

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
