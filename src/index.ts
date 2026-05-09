import { loadHomeMcpConfig, pluginConfigFor } from "./core/config.js";
import { McpHub } from "./core/mcpHub.js";
import { HubPolicy } from "./core/policy.js";
import { PluginRegistry } from "./core/pluginRegistry.js";
import { JsonRpcMcpServer, runStdioServer } from "./server/jsonRpcServer.js";
import { createClockPlugin } from "./plugins/clock/index.js";
import { createMemoryPlugin } from "./plugins/memory/index.js";

const registry = new PluginRegistry();
const config = await loadHomeMcpConfig();

const pluginFactories = {
  clock: createClockPlugin,
  memory: createMemoryPlugin,
};

for (const [pluginId, createPlugin] of Object.entries(pluginFactories)) {
  const pluginConfig = pluginConfigFor(config, pluginId);
  registry.register(createPlugin(), {
    enabled: pluginConfig.enabled ?? true,
    config: pluginConfig.config ?? {},
  });
}

await registry.initializeAll();
await runStdioServer(new JsonRpcMcpServer(new McpHub(registry, new HubPolicy(config.policy))));
