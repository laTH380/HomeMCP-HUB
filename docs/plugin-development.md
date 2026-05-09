# Plugin Development

HomeMCP-HUB plugins own their MCP surface. A plugin can expose tools, resources, resource templates, prompts, and a health check.

## Minimal Plugin

Create a plugin under `src/plugins/<plugin-id>/index.ts`.

```ts
import type { HomeMcpPlugin, PluginContext } from "../../types/plugin.js";

export function createEchoPlugin(): HomeMcpPlugin {
  return {
    id: "echo",
    name: "Echo",
    version: "0.1.0",
    async initialize(context: PluginContext): Promise<void> {
      context.logger.info("echo plugin initialized");
    },
    tools: {
      async list() {
        return [
          {
            name: "say",
            title: "Echo text",
            description: "Return the provided text.",
            inputSchema: {
              type: "object",
              properties: {
                text: { type: "string" }
              },
              required: ["text"],
              additionalProperties: false
            }
          }
        ];
      },
      async call(name, args) {
        if (name !== "say") {
          throw new Error(`Unknown echo tool '${name}'`);
        }
        const text = typeof args.text === "string" ? args.text : "";
        return {
          content: [{ type: "text", text }],
          structuredContent: { text }
        };
      }
    },
    async healthCheck() {
      return { status: "ok" };
    }
  };
}
```

## Register the Plugin

Add the factory to `src/index.ts`:

```ts
import { createEchoPlugin } from "./plugins/echo/index.js";

const pluginFactories = {
  clock: createClockPlugin,
  memory: createMemoryPlugin,
  echo: createEchoPlugin
};
```

Then configure it:

```json
{
  "plugins": {
    "echo": {
      "enabled": true,
      "config": {}
    }
  }
}
```

## Naming Rules

Plugin IDs must:

- start with a lowercase letter
- contain only lowercase letters, numbers, and hyphens

Tool and prompt local names may contain letters, numbers, underscores, and hyphens.

HomeMCP-HUB publishes local names with the plugin namespace:

- local tool name: `say`
- plugin id: `echo`
- published MCP name: `echo.say`

## Configuration

Plugin-specific config is available as `context.config` during initialization:

```ts
async initialize(context: PluginContext): Promise<void> {
  const endpoint = typeof context.config.endpoint === "string" ? context.config.endpoint : undefined;
}
```

Use the common wrapper in `config/homemcp.json`:

```json
{
  "plugins": {
    "echo": {
      "enabled": true,
      "config": {
        "endpoint": "https://example.com"
      }
    }
  }
}
```

## Resources

Resources should use `homemcp://<plugin-id>/...` URIs.

```ts
resources: {
  async list() {
    return [
      {
        uri: "homemcp://echo/config",
        name: "echo-config",
        title: "Echo configuration",
        mimeType: "application/json"
      }
    ];
  },
  async read(uri) {
    if (uri !== "homemcp://echo/config") {
      throw new Error(`Unknown echo resource '${uri}'`);
    }
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify({ ok: true }, null, 2)
        }
      ]
    };
  }
}
```

## Prompts

Prompts are optional and use the same namespacing behavior as tools.

```ts
prompts: {
  async list() {
    return [
      {
        name: "summarize",
        title: "Summarize",
        description: "Ask the model to summarize echo output."
      }
    ];
  },
  async get(name) {
    if (name !== "summarize") {
      throw new Error(`Unknown echo prompt '${name}'`);
    }
    return {
      messages: [
        {
          role: "user",
          content: { type: "text", text: "Summarize the latest echo output." }
        }
      ]
    };
  }
}
```

## Testing

Run:

```bash
npm test
```

When adding a plugin, include tests for:

- plugin registration
- tool listing and dispatch
- resource listing and reading, if applicable
- prompt listing and retrieval, if applicable
- disabled-plugin behavior if the plugin has startup side effects
