import "./global.css";
import { doRedirect } from "./redirect";

(async function() {
  if (!await doRedirect()) {
    (await import("./render")).renderSettingsUI();
  }
})();
