import type { PluginLogger } from "../types/plugin.js";

const SECRET_PATTERN = /(token|secret|password|key)/i;

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitize);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        SECRET_PATTERN.test(key) ? "[redacted]" : sanitize(item),
      ]),
    );
  }
  return value;
}

export class ConsolePluginLogger implements PluginLogger {
  constructor(private readonly pluginId: string) {}

  debug(message: string, meta?: Record<string, unknown>): void {
    this.write("debug", message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.write("info", message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.write("warn", message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.write("error", message, meta);
  }

  private write(level: string, message: string, meta?: Record<string, unknown>): void {
    const payload = {
      level,
      pluginId: this.pluginId,
      message,
      ...(meta ? { meta: sanitize(meta) } : {}),
    };
    console.error(JSON.stringify(payload));
  }
}
