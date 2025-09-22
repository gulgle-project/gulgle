import clipboardSvg from "/clipboard.svg";
import clipboardCheckSvg from "/clipboard-check.svg";
import {
  addCustomBang,
  getAllBangs,
  getCustomBangs,
  getDefaultBangOrStore,
  removeCustomBang,
  setDefaultBang,
  exportSettings,
  importSettings,
} from "./bang-manager";
import type { Bang } from "./types";

// Helper functions for element visibility
function hideElement(element: HTMLElement) {
  element.classList.add('hidden');
}

function showElement(element: HTMLElement, display?: 'block' | 'flex' | 'inline' | 'inline-block') {
  element.classList.remove('hidden');
  if (display) {
    element.style.display = display;
  }
}

function safeQuerySelector<T extends HTMLElement>(
  parent: Document | Element | null | undefined,
  selector: string,
  errorMessage?: string,
): T {
  const element = parent?.querySelector<T>(selector);
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
    <div class="main-container">
      <div class="content-container">
        <h1>Gulgle</h1>
        <p>Add the following URL as a custom search engine to your browser to use Gulgle's fast client-side redirects, including <a href="https://kbe.smaertness.net/">all Kagi bangs</a>, custom bangs, and a configurable default search engine.</p>

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
            <div class="collapsible-header" id="custom-bangs-header">
              <span>Custom Bangs:</span>
              <span class="collapse-icon">▼</span>
            </div>
            <div class="collapsible-content" id="custom-bangs-content">
              <div class="custom-bangs-list">
                ${customBangs.length === 0
      ? '<p class="no-bangs">No custom bangs yet. Add one below!</p>'
      : customBangs
        .map(
          (bang) => `
                    <div class="custom-bang-item" data-trigger="${bang.t}">
                      <div class="bang-info">
                        <div class="bang-display" id="display-${bang.t}">
                          <strong>!${bang.t}</strong> - ${bang.s}
                          <div class="bang-url">${bang.u}</div>
                        </div>
                        <div class="bang-edit bang-form hidden" id="edit-${bang.t}">
                          <label>Edit Custom Bang</label>
                          <div class="form-row">
                            <input id="edit-bang-trigger" type="text" class="form-input" value="${bang.t}" data-value="${bang.t}" placeholder="Trigger (e.g., 'gh')" />
                            <input type="text" class="form-input" value="${bang.s}" placeholder="Name (e.g., 'GitHub')" />
                          </div>
                          <input type="text" class="form-input--full-width" value="${bang.u}" placeholder="URL (direct link or search template with %s)" />
                          <div class="edit-buttons">
                            <button class="save-bang-btn primary-button" data-trigger="${bang.t}" disabled>Save</button>
                            <button class="cancel-edit-btn secondary-button" data-trigger="${bang.t}">Cancel</button>
                          </div>
                        </div>
                      </div>
                      <div class="bang-actions">
                        <div class="action-display" id="actions-display-${bang.t}">
                          <button class="edit-bang-btn secondary-button" data-trigger="${bang.t}">Edit</button>
                          <button class="delete-bang-btn" data-trigger="${bang.t}">Delete</button>
                        </div>
                      </div>
                    </div>
                  `,
        )
        .join("")
    }
              </div>

              <div class="bang-form">
                <label>Add Custom Bang</label>
                <div class="form-row">
                  <input type="text" id="bang-trigger" placeholder="Trigger (e.g., 'gh')" class="form-input" />
                  <input type="text" id="bang-name" placeholder="Name (e.g., 'GitHub')" class="form-input" />
                </div>
                <input type="text" id="bang-url" placeholder="URL (direct link or search template with %s)" class="form-input--full-width" />
                <div>
                  <button id="add-bang-btn" class="primary-button" disabled>Add Bang</button>
                </div>
              </div>
            </div>
          </div>

          <div class="setting-group">
            <label>Import/Export Settings:</label>
            <div class="import-export-section">
              <div class="form-row">
                <button id="export-settings-btn" class="secondary-button">Export Settings</button>
                <button id="import-settings-btn" class="secondary-button">Import Settings</button>
              </div>
              <input type="file" id="import-file-input" accept=".json" class="hidden" />
              <div id="import-export-status" class="status-message hidden"></div>
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

  defaultBangInput.addEventListener("input", async () => {
    setThroughDropDown = false;

    const value = defaultBangInput.value;
    autoComplete.innerHTML = "";

    if (!value) {
      hideElement(autoComplete);
      return;
    }

    if (!setThroughDropDown) {
      defaultBangInput.classList.add("error");
    } else {
      defaultBangInput.classList.remove("error");
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
      hideElement(autoComplete);
      return;
    }

    matches.forEach((match, index) => {
      const item = document.createElement("div");
      item.classList.add("autocomplete-item");

      // Build the display text with additional triggers if they exist
      const additionalTriggers = match.ts && match.ts.length > 0
        ? ` [${match.ts.join(", ")}]`
        : "";

      item.textContent = `(!${match.t}) ${match.s} (${match.d})${additionalTriggers}${"c" in match ? " (Custom)" : ""}`;
      item.addEventListener("click", () => {
        defaultBangInput.classList.remove("error");
        defaultBangInput.value = match.t;
        hideElement(autoComplete);
        setThroughDropDown = true;
        setDefaultBang(match);
      });
      autoComplete.appendChild(item);

      // Add hr between entries (but not after the last one)
      if (index < matches.length - 1) {
        const hr = document.createElement("hr");
        autoComplete.appendChild(hr);
      }
    });
    showElement(autoComplete, 'block');
    // setDefaultBang((await getAllBangs()).find(b => b.t == defaultBangInput.value)!!);
  });

  // Add custom bang
  const addBangBtn = safeQuerySelector<HTMLButtonElement>(app, "#add-bang-btn");
  const triggerInput = safeQuerySelector<HTMLInputElement>(app, "#bang-trigger");
  const nameInput = safeQuerySelector<HTMLInputElement>(app, "#bang-name");
  const urlInput2 = safeQuerySelector<HTMLInputElement>(app, "#bang-url");

  triggerInput.addEventListener("input", async () => {
    if (!triggerInput.value) {
      return;
    }

    if (getCustomBangs().find((b) => b.t === triggerInput.value)) {
      triggerInput.classList.add("error");
      addBangBtn.disabled = true;
      return;
    }

    triggerInput.classList.remove("error");
    addBangBtn.disabled = false;
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

  // Edit custom bangs
  app.querySelectorAll(".edit-bang-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const trigger = (e.target as HTMLButtonElement).dataset.trigger;
      if (!trigger) {
        console.error("Trigger data attribute not found");
        return;
      }

      // Show edit mode
      const displayElement = safeQuerySelector<HTMLDivElement>(app, `#display-${trigger}`);
      const editElement = safeQuerySelector<HTMLDivElement>(app, `#edit-${trigger}`);
      const actionsDisplay = safeQuerySelector<HTMLDivElement>(app, `#actions-display-${trigger}`);

      hideElement(displayElement);
      showElement(editElement, 'block');
      hideElement(actionsDisplay);
    });
  });

  // Save edited custom bangs
  app.querySelectorAll(".save-bang-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const trigger = (e.target as HTMLButtonElement).dataset.trigger;
      if (!trigger) {
        console.error("Trigger data attribute not found");
        return;
      }

      const editElement = safeQuerySelector<HTMLDivElement>(app, `#edit-${trigger}`);
      const formInputs = editElement.querySelectorAll('.form-input');
      const newTrigger = (formInputs[0] as HTMLInputElement).value.trim().toLowerCase();
      const newName = (formInputs[1] as HTMLInputElement).value.trim();
      const newUrl = (editElement.querySelector(".form-input--full-width") as HTMLInputElement).value.trim();

      if (!newTrigger || !newName || !newUrl) {
        alert("Please fill in all fields");
        return;
      }

      // Validate URL
      try {
        new URL(newUrl.includes("%s") ? newUrl.replace("%s", "test") : newUrl);
      } catch (_error) {
        alert("Please enter a valid URL");
        return;
      }

      const domain = new URL(newUrl.includes("%s") ? newUrl.replace("%s", "test") : newUrl).hostname;

      // If trigger changed, remove old one first
      if (trigger !== newTrigger) {
        removeCustomBang(trigger);
      }

      addCustomBang({
        t: newTrigger,
        s: newName,
        u: newUrl,
        d: domain,
        c: true,
      });

      // Refresh the UI
      renderSettingsUI();
    });
  });

  app.querySelectorAll<HTMLInputElement>("#edit-bang-trigger").forEach((input) => {
    const saveBtn = safeQuerySelector<HTMLButtonElement>(input.parentElement?.parentElement, ".save-bang-btn");
    input.addEventListener("input", async () => {
      if (!input.value) {
        return;
      }

      if (getCustomBangs().find(b => b.t === input.value && b.t !== input.dataset.value)) {
        input.classList.add("error");
        saveBtn.disabled = true;
        return;
      }

      input.classList.remove("error");
      saveBtn.disabled = false;
    });
  });

  // Cancel edit custom bangs
  app.querySelectorAll(".cancel-edit-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const trigger = (e.target as HTMLButtonElement).dataset.trigger;
      if (!trigger) {
        console.error("Trigger data attribute not found");
        return;
      }

      // Show display mode
      const displayElement = safeQuerySelector<HTMLDivElement>(app, `#display-${trigger}`);
      const editElement = safeQuerySelector<HTMLDivElement>(app, `#edit-${trigger}`);
      const actionsDisplay = safeQuerySelector<HTMLDivElement>(app, `#actions-display-${trigger}`);

      showElement(displayElement, 'block');
      hideElement(editElement);
      showElement(actionsDisplay, 'flex');
    });
  });

  // Custom bangs collapsible functionality
  const customBangsHeader = safeQuerySelector<HTMLDivElement>(app, "#custom-bangs-header");
  const customBangsContent = safeQuerySelector<HTMLDivElement>(app, "#custom-bangs-content");
  const collapseIcon = safeQuerySelector<HTMLSpanElement>(customBangsHeader, ".collapse-icon");

  customBangsHeader.addEventListener("click", () => {
    const isCollapsed = customBangsContent.classList.contains("collapsed");

    if (isCollapsed) {
      customBangsContent.classList.remove("collapsed");
      collapseIcon.textContent = "▼";
    } else {
      customBangsContent.classList.add("collapsed");
      collapseIcon.textContent = "▶";
    }
  });

  // Export settings
  const exportBtn = safeQuerySelector<HTMLButtonElement>(app, "#export-settings-btn");
  exportBtn.addEventListener("click", () => {
    try {
      const settings = exportSettings();
      const dataStr = JSON.stringify(settings, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(dataBlob);
      link.download = `gulgle-settings-${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      showStatusMessage("Settings exported successfully!", "success");
    } catch (error) {
      showStatusMessage(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    }
  });

  // Import settings
  const importBtn = safeQuerySelector<HTMLButtonElement>(app, "#import-settings-btn");
  const fileInput = safeQuerySelector<HTMLInputElement>(app, "#import-file-input");

  importBtn.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const settingsData = JSON.parse(event.target?.result as string);
        const result = importSettings(settingsData);

        if (result.success) {
          renderSettingsUI();
          showStatusMessage(result.message, "success");
        } else {
          showStatusMessage(result.message, "error");
        }
      } catch (error) {
        showStatusMessage(`Failed to parse settings file: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
      }
    };
    reader.readAsText(file);

    // Reset file input
    fileInput.value = "";
  });
}

function showStatusMessage(message: string, type: "success" | "error") {
  const app = safeQuerySelector<HTMLDivElement>(document, "#app");
  const statusElement = safeQuerySelector<HTMLDivElement>(app, "#import-export-status");

  statusElement.textContent = message;
  statusElement.className = `status-message ${type}`;
  showElement(statusElement);

  // Hide the message after 5 seconds
  setTimeout(() => {
    hideElement(statusElement);
  }, 5000);
}
