import { ConsolePluginLogger } from "./logger.js";
import { EnvironmentSecretProvider } from "./secrets.js";
import type { HomeMcpPlugin, PluginContext } from "../types/plugin.js";

export interface PluginRegistrationOptions {
  enabled?: boolean;
  config?: Record<string, unknown>;
}

export class PluginRegistry {
  private readonly plugins = new Map<string, HomeMcpPlugin>();
  private readonly configs = new Map<string, Record<string, unknown>>();
  private readonly initialized = new Set<string>();

  register(plugin: HomeMcpPlugin, options: PluginRegistrationOptions = {}): void {
    validatePluginId(plugin.id);
    if (options.enabled === false) {
      return;
    }
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin '${plugin.id}' is already registered`);
    }
    this.plugins.set(plugin.id, plugin);
    this.configs.set(plugin.id, options.config ?? {});
  }

  get(pluginId: string): HomeMcpPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  require(pluginId: string): HomeMcpPlugin {
    const plugin = this.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin '${pluginId}' is not registered`);
    }
    return plugin;
  }

  list(): HomeMcpPlugin[] {
    return [...this.plugins.values()].sort((a, b) => a.id.localeCompare(b.id));
  }

  async initializeAll(): Promise<void> {
    for (const plugin of this.list()) {
      await this.initialize(plugin.id);
    }
  }

  async initialize(pluginId: string): Promise<void> {
    if (this.initialized.has(pluginId)) {
      return;
    }
    const plugin = this.require(pluginId);
    const context: PluginContext = {
      pluginId,
      config: this.configs.get(pluginId) ?? {},
      logger: new ConsolePluginLogger(pluginId),
      secrets: new EnvironmentSecretProvider(),
    };
    await plugin.initialize(context);
    this.initialized.add(pluginId);
  }
}

function validatePluginId(pluginId: string): void {
  if (!/^[a-z][a-z0-9-]*$/.test(pluginId)) {
    throw new Error(
      `Invalid plugin id '${pluginId}'. Use lowercase letters, numbers, and dashes, starting with a letter.`,
    );
  }
}
