import { McpHub } from "./core/mcpHub.js";
import { PluginRegistry } from "./core/pluginRegistry.js";
import { JsonRpcMcpServer, runStdioServer } from "./server/jsonRpcServer.js";
import { createClockPlugin } from "./plugins/clock/index.js";
import { createMemoryPlugin } from "./plugins/memory/index.js";

const registry = new PluginRegistry();
registry.register(createClockPlugin(), { config: { timezone: process.env.HOMEMCP_TIMEZONE ?? "UTC" } });
registry.register(createMemoryPlugin(), {
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
});

await registry.initializeAll();
await runStdioServer(new JsonRpcMcpServer(new McpHub(registry)));
