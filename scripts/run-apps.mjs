import { spawn } from "node:child_process";
import { stdin, stdout } from "node:process";

const task = process.argv[2];
const apps = [
  { label: "Web", packageName: "gulgle-web" },
  { label: "Server", packageName: "gulgle-server" },
];

if (!["dev", "build"].includes(task)) {
  throw new Error("Usage: node scripts/run-apps.mjs <dev|build>");
}

if (!stdin.isTTY || !stdout.isTTY) {
  throw new Error(
    `pnpm ${task} requires an interactive terminal. Use a specific ${task}:web or ${task}:server command instead.`,
  );
}

let cursor = 0;
const selected = new Set([0]);

function render() {
  stdout.write("\x1B[2J\x1B[H");
  stdout.write(`Select app(s) to ${task} (↑/↓ to move, space to toggle, enter to run)\n\n`);

  for (const [index, app] of apps.entries()) {
    const pointer = index === cursor ? "›" : " ";
    const checkbox = selected.has(index) ? "◉" : "○";
    stdout.write(`${pointer} ${checkbox} ${app.label}\n`);
  }

  stdout.write("\nCtrl+C to cancel\n");
}

function chooseApps() {
  return new Promise((resolve) => {
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    render();

    const onData = (key) => {
      if (key === "\u0003") process.exit(130);
      if (key === "\r" || key === "\n") {
        if (selected.size === 0) return;
        stdin.off("data", onData);
        stdin.setRawMode(false);
        stdin.pause();
        stdout.write("\x1B[2J\x1B[H");
        resolve([...selected].map((index) => apps[index]));
        return;
      }

      if (key === "\u001B[A" || key === "k") cursor = (cursor + apps.length - 1) % apps.length;
      if (key === "\u001B[B" || key === "j") cursor = (cursor + 1) % apps.length;
      if (key === " ") selected.has(cursor) ? selected.delete(cursor) : selected.add(cursor);
      render();
    };

    stdin.on("data", onData);
  });
}

function run(app) {
  const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  return spawn(command, ["--filter", app.packageName, task], { stdio: "inherit" });
}

const chosenApps = await chooseApps();
const children = chosenApps.map(run);

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => children.forEach((child) => child.kill(signal)));
}

const results = await Promise.all(
  children.map(
    (child) =>
      new Promise((resolve) => {
        child.on("exit", (code, signal) => resolve({ code, signal }));
      }),
  ),
);

if (results.some(({ code, signal }) => code !== 0 || signal)) {
  process.exitCode = 1;
}
