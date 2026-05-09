import { readFile } from "node:fs/promises";

import type { HomeMcpConfig, PluginConfig } from "../types/plugin.js";

export type PluginFactoryMap = Record<string, () => unknown>;

const DEFAULT_CONFIG_PATH = "config/homemcp.json";

export const defaultHomeMcpConfig = {
  server: {
    name: "HomeMCP",
    transport: "stdio",
  },
  plugins: {
    clock: {
      enabled: true,
      config: {
        timezone: process.env.HOMEMCP_TIMEZONE ?? "UTC",
      },
    },
    memory: {
      enabled: true,
      config: {
        notes: [
          {
            id: "welcome",
            title: "Welcome to HomeMCP",
            body: "Plugins own their MCP tools, resources, and prompts; HomeMCP aggregates them.",
            createdAt: new Date().toISOString(),
          },
        ],
      },
    },
  },
} satisfies HomeMcpConfig;

export async function loadHomeMcpConfig(configPath = process.env.HOMEMCP_CONFIG): Promise<HomeMcpConfig> {
  const path = configPath ?? DEFAULT_CONFIG_PATH;
  try {
    return mergeConfig(defaultHomeMcpConfig, parseConfig(await readFile(path, "utf8"), path));
  } catch (error) {
    if (!configPath && isFileNotFound(error)) {
      return defaultHomeMcpConfig;
    }
    throw error;
  }
}

export function pluginConfigFor(config: HomeMcpConfig, pluginId: string): PluginConfig {
  return config.plugins?.[pluginId] ?? {};
}

function parseConfig(raw: string, path: string): HomeMcpConfig {
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`HomeMCP config '${path}' must be a JSON object`);
  }
  return parsed as HomeMcpConfig;
}

function mergeConfig(base: HomeMcpConfig, override: HomeMcpConfig): HomeMcpConfig {
  return {
    ...base,
    ...override,
    server: {
      ...base.server,
      ...override.server,
    },
    plugins: {
      ...base.plugins,
      ...override.plugins,
    },
  };
}

function isFileNotFound(error: unknown): boolean {
  return !!error && typeof error === "object" && (error as { code?: unknown }).code === "ENOENT";
}
