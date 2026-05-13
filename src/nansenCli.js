import { exec, execFile } from "node:child_process";
import { promisify } from "node:util";
import { config } from "./config.js";

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

function cleanCliOutput(value) {
  return String(value || "")
    .replace(config.nansenApiKey || "__never_match__", "[redacted]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

async function runNansenCli(args, timeout = 8000) {
  const env = {
    ...process.env,
    ...(config.nansenApiKey ? { NANSEN_API_KEY: config.nansenApiKey } : {})
  };

  if (process.platform === "win32") {
    const command = `nansen ${args.join(" ")}`;
    return execAsync(command, {
      env,
      timeout,
      windowsHide: true,
      maxBuffer: 1024 * 1024
    });
  }

  return execFileAsync("nansen", args, {
    env,
    timeout,
    windowsHide: true,
    maxBuffer: 1024 * 1024
  });
}

async function findNansenCli() {
  try {
    if (process.platform === "win32") {
      await execFileAsync("where.exe", ["nansen"], {
        timeout: 3000,
        windowsHide: true
      });
    } else {
      await execFileAsync("which", ["nansen"], {
        timeout: 3000,
        windowsHide: true
      });
    }
    return true;
  } catch {
    return false;
  }
}

export async function checkNansenCli() {
  try {
    const installed = await findNansenCli();
    if (!installed) {
      return {
        ok: false,
        command: "nansen schema --pretty",
        message: "nansen CLI was not found. Run: npm install -g nansen-cli"
      };
    }

    const result = await runNansenCli(["schema", "--pretty"]);
    const output = cleanCliOutput(result.stdout || result.stderr);
    return {
      ok: true,
      command: "nansen schema --pretty",
      message: output ? `schema loaded (${output.length} chars preview)` : "schema loaded"
    };
  } catch (error) {
    const raw = cleanCliOutput(error.stderr || error.stdout || error.message);
    const notFound = /not recognized|not found|ENOENT|EPERM|command not found/i.test(raw);
    return {
      ok: false,
      command: "nansen schema --pretty",
      message: notFound
        ? "nansen CLI is not installed, not in PATH, or blocked by this runtime"
        : raw || "nansen CLI check failed"
    };
  }
}
