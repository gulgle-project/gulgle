import "./global.css";
import { doRedirect } from "./redirect";

(async () => {
  if (!(await doRedirect())) {
    (await import("./render")).renderSettingsUI();
  }
})();
