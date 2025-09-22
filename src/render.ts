import clipboardSvg from "/clipboard.svg";
import clipboardCheckSvg from "/clipboard-check.svg";
import {
  addCustomBang,
  getAllBangs,
  getBangs,
  getCustomBangs,
  getDefaultBangOrStore,
  removeCustomBang,
  setDefaultBang,
} from "./bang-manager";
import type { Bang } from "./types";

function safeQuerySelector<T extends Element>(
  parent: Document | Element,
  selector: string,
  errorMessage?: string,
): T {
  const element = parent.querySelector<T>(selector);
  if (!element) {
    throw new Error(errorMessage || `Element not found: ${selector}`);
  }
  return element;
}

export function renderSettingsUI() {
  const app = safeQuerySelector<HTMLDivElement>(document, "#app");
  const customBangs = getCustomBangs();
  const defaultBang = getDefaultBangOrStore();

  // Get the current site URL and construct the search URL
  const currentOrigin = window.location.origin;
  const searchUrl = `${currentOrigin}?q=%s`;

  app.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 12px;">
      <div class="content-container">
        <h1>Gulgle</h1>
        <p>Add the following URL as a custom search engine to your browser to use Gulgle's fast client-side redirects, including <a href="https://kbe.smaertness.net/">all Kagi bangs</a>, custom bangs, and configurable default search engine.</p>

        <div class="url-container">
          <input
            type="text"
            class="url-input"
            value="${searchUrl}"
            readonly
          />
          <button class="copy-button">
            <img src="${clipboardSvg}" alt="Copy" />
          </button>
        </div>

        <div class="settings-section">

          <div class="setting-group">
            <label for="default-bang-select">Default Search Engine:</label>
            <input type="text" id="default-bang" class="setting-input" value="${defaultBang.t}" />
            <div id="autocomplete-list"></div>
          </div>

          <div class="setting-group">
            <label>Custom Bangs:</label>
            <div class="custom-bangs-list">
              ${customBangs.length === 0
      ? '<p class="no-bangs">No custom bangs yet. Add one below!</p>'
      : customBangs
        .map(
          (bang) => `
                  <div class="custom-bang-item">
                    <div class="bang-info">
                      <strong>!${bang.t}</strong> - ${bang.s}
                      <div class="bang-url">${bang.u}</div>
                    </div>
                    <button class="delete-bang-btn" data-trigger="${bang.t}">Delete</button>
                  </div>
                `,
        )
        .join("")
    }
            </div>

            <div class="add-bang-form">
              <label>Add Custom Bang</label>
              <div class="form-row">
                <input type="text" id="bang-trigger" placeholder="Trigger (e.g., 'gh')" class="form-input" />
                <input type="text" id="bang-name" placeholder="Name (e.g., 'GitHub')" class="form-input" />
              </div>
              <input type="text" id="bang-url" placeholder="URL (direct link or search template with %s)" class="form-input full-width" />
              <button id="add-bang-btn" class="primary-button">Add Bang</button>
            </div>
          </div>
        </div>
        <p class="github-link">
          <a href="https://github.com/hetzgu/gulgle" target="_blank">View on GitHub</a>
        </p>
      </div>
    </div>
  `;

  setupEventListeners();
}

function levenshtein(a: string, b: string) {
  const n = a.length;
  const m = b.length;

  if (n === 0) return m;
  if (m === 0) return n;

  // ensure n <= m to save space
  if (n > m) {
    [a, b] = [b, a];
  }

  let prev = Array(b.length + 1)
    .fill(0)
    .map((_, i) => i);
  let curr = new Array(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const insert = curr[j - 1] + 1;
      const del = prev[j] + 1;
      const replace = prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);
      curr[j] = Math.min(insert, del, replace);
    }
    [curr, prev] = [prev, curr];
  }

  return prev[b.length];
}

function score(a: Bang, value: string): number {
  // Primary trigger has lowest penalty
  const triggerScore = levenshtein(a.t, value) * 1;
  // Description has higher penalty
  const descriptionScore = levenshtein(a.s, value) * 2;
  // Additional triggers have medium penalty
  const tsScore = a.ts
    ? Math.min(...a.ts.map((trigger: string) => levenshtein(trigger, value) * 1.5))
    : Infinity;

  return Math.min(triggerScore, descriptionScore, tsScore);
}

function setupEventListeners() {
  const app = safeQuerySelector<HTMLDivElement>(document, "#app");

  // Copy button functionality
  const copyButton = safeQuerySelector<HTMLButtonElement>(app, ".copy-button");
  const urlInput = safeQuerySelector<HTMLInputElement>(app, ".url-input");
  const copyIcon = safeQuerySelector<HTMLImageElement>(copyButton, "img"); copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(urlInput.value);
    copyIcon.src = clipboardCheckSvg;
    setTimeout(() => {
      copyIcon.src = clipboardSvg;
    }, 1000);
  });

  // Default bang selection
  let setThroughDropDown = true;
  const autoComplete = safeQuerySelector<HTMLDivElement>(app, "#autocomplete-list");
  const defaultBangInput = safeQuerySelector<HTMLInputElement>(app, "#default-bang");
  // defaultBangInput.addEventListener("blur", () => {
  //   if (defaultBangInput.classList.contains("error")) {
  //     defaultBangInput.value = getDefaultBangOrStore().t;
  //     defaultBangInput.classList.remove("error");
  //     autoComplete.style.display = "none";
  //   }
  // });
  defaultBangInput.addEventListener("input", async () => {
    setThroughDropDown = false;

    const value = defaultBangInput.value;
    autoComplete.innerHTML = "";

    if (!value) {
      autoComplete.style.display = "none";
      return;
    }

    if (!setThroughDropDown) {
      defaultBangInput.classList.add("error");
    } else {
      defaultBangInput.classList.add("error");
    }

    const bangs = await getAllBangs();
    const matches = bangs
      .filter((b) =>
        b.t.toLowerCase().includes(value) ||
        b.s.toLowerCase().includes(value) ||
        (b.ts && b.ts.some(trigger => trigger.toLowerCase().includes(value)))
      )
      .sort((a, b) => score(a, value) - score(b, value))
      .splice(0, 10);

    if (!matches.length) {
      autoComplete.style.display = "none";
      return;
    }

    matches.forEach((match) => {
      const item = document.createElement("div");
      item.classList.add("autocomplete-item");
      item.textContent = `(!${match.t}) ${match.s} (${match.d})${"c" in match ? " (Custom)" : ""}`;
      item.addEventListener("click", () => {
        defaultBangInput.classList.remove("error");
        defaultBangInput.value = match.t;
        autoComplete.style.display = "none";
        setThroughDropDown = true;
        setDefaultBang(match);
      });
      autoComplete.appendChild(item);
    });
    autoComplete.style.display = "block";
    // setDefaultBang((await getAllBangs()).find(b => b.t == defaultBangInput.value)!!);
  });

  // Add custom bang
  const addBangBtn = safeQuerySelector<HTMLButtonElement>(app, "#add-bang-btn");
  const triggerInput = safeQuerySelector<HTMLInputElement>(app, "#bang-trigger");
  const nameInput = safeQuerySelector<HTMLInputElement>(app, "#bang-name");
  const urlInput2 = safeQuerySelector<HTMLInputElement>(app, "#bang-url"); triggerInput.addEventListener("input", async () => {
    if (!triggerInput.value) {
      return;
    }

    if ((await getBangs()).find((b) => b.t === triggerInput.value)) {
      triggerInput.classList.add("error");
      return;
    }

    triggerInput.classList.remove("error");
  });

  addBangBtn.addEventListener("click", () => {
    const trigger = triggerInput.value.trim().toLowerCase();
    const name = nameInput.value.trim();
    const url = urlInput2.value.trim();

    if (!trigger || !name || !url) {
      alert("Please fill in all fields");
      return;
    }

    // Smart URL validation - accept both direct URLs and search templates
    const finalUrl = url;
    try {
      // Test if it's a valid URL
      new URL(url.includes("%s") ? url.replace("%s", "test") : url);

      // If URL doesn't contain %s, it's a direct link - no modification needed
      // If URL contains %s, it's a search template - no modification needed
      // Both are valid and will be handled smartly in the redirect logic
    } catch (_error) {
      alert("Please enter a valid URL");
      return;
    }

    const domain = new URL(finalUrl.includes("%s") ? finalUrl.replace("%s", "test") : finalUrl).hostname;

    addCustomBang({
      t: trigger,
      s: name,
      u: finalUrl,
      d: domain,
      c: true,
    });

    // Refresh the UI
    renderSettingsUI();
  });

  // Delete custom bangs
  app.querySelectorAll(".delete-bang-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const trigger = (e.target as HTMLButtonElement).dataset.trigger;
      if (!trigger) {
        console.error("Trigger data attribute not found");
        return;
      }
      if (confirm(`Delete custom bang !${trigger}?`)) {
        removeCustomBang(trigger);
        renderSettingsUI();
      }
    });
  });
}
