import type { bangs } from "./bang";
import { getCustomBangs,setDefaultBang,getAllBangs,addCustomBang,removeCustomBang,getDefaultBangOrStore,getBangs } from "./bang-manager";
import { CustomBang } from "./types";

export function renderSettingsUI() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
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
            <img src="/clipboard.svg" alt="Copy" />
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
              ${customBangs.length === 0 ?
      '<p class="no-bangs">No custom bangs yet. Add one below!</p>' :
      customBangs.map(bang => `
                  <div class="custom-bang-item">
                    <div class="bang-info">
                      <strong>!${bang.t}</strong> - ${bang.s}
                      <div class="bang-url">${bang.u}</div>
                    </div>
                    <button class="delete-bang-btn" data-trigger="${bang.t}">Delete</button>
                  </div>
                `).join("")
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
          <a href="https://github.com/dev-bhaskar8/unduckling" target="_blank">View on GitHub</a>
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

  let prev = Array(b.length + 1).fill(0).map((_, i) => i);
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

function score(a: CustomBang | typeof bangs[0], value: string): number {
  return Math.min(levenshtein(a.t, value) * 1, levenshtein(a.s, value) * 2)
}

function setupEventListeners() {
  const app = document.querySelector<HTMLDivElement>("#app")!;

  // Copy button functionality
  const copyButton = app.querySelector<HTMLButtonElement>(".copy-button")!;
  const copyIcon = copyButton.querySelector("img")!;
  const urlInput = app.querySelector<HTMLInputElement>(".url-input")!;

  copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(urlInput.value);
    copyIcon.src = "/clipboard-check.svg";
    setTimeout(() => {
      copyIcon.src = "/clipboard.svg";
    }, 2000);
  });

  // Default bang selection
  let setThroughDropDown = true;
  const autoComplete = app.querySelector<HTMLDivElement>("#autocomplete-list")!;
  const defaultBangInput = app.querySelector<HTMLInputElement>("#default-bang")!;
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

    const bangs = (await getAllBangs());
    const matches = bangs.filter(b => b.t.toLowerCase().includes(value) || b.s.toLowerCase().includes(value))
      .sort((a, b) => score(a, value) - score(b, value))
      .splice(0, 10);

    if (!matches.length) {
      autoComplete.style.display = "none";
      return;
    }

    matches.forEach(match => {
      const item = document.createElement('div');
      item.classList.add('autocomplete-item');
      item.textContent = `(!${match.t}) ${match.s} (${match.d})${"c" in match ? " (Custom)" : ""}`;
      item.addEventListener('click', () => {
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
  const addBangBtn = app.querySelector<HTMLButtonElement>("#add-bang-btn")!;
  const triggerInput = app.querySelector<HTMLInputElement>("#bang-trigger")!;
  const nameInput = app.querySelector<HTMLInputElement>("#bang-name")!;
  const urlInput2 = app.querySelector<HTMLInputElement>("#bang-url")!;

  triggerInput.addEventListener("input", async () => {
    if (!triggerInput.value) {
      return;
    }

    if ((await getBangs()).find(b => b.t == triggerInput.value)) {
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
    let finalUrl = url;
    try {
      // Test if it's a valid URL
      new URL(url.includes("%s") ? url.replace("%s", "test") : url);

      // If URL doesn't contain %s, it's a direct link - no modification needed
      // If URL contains %s, it's a search template - no modification needed
      // Both are valid and will be handled smartly in the redirect logic

    } catch (error) {
      alert("Please enter a valid URL");
      return;
    }

    const domain = new URL(finalUrl.includes("%s") ? finalUrl.replace("%s", "test") : finalUrl).hostname;

    addCustomBang({
      t: trigger,
      s: name,
      u: finalUrl,
      d: domain,
      c: true
    });

    // Refresh the UI
    renderSettingsUI();
  });

  // Delete custom bangs
  app.querySelectorAll(".delete-bang-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const trigger = (e.target as HTMLButtonElement).dataset.trigger!;
      if (confirm(`Delete custom bang !${trigger}?`)) {
        removeCustomBang(trigger);
        renderSettingsUI();
      }
    });
  });
}