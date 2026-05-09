# HomeMCP

HomeMCP is a lightweight **MCP Hub**. Instead of forcing every source into one central `NormalizedItem` model, each plugin owns the MCP surface that best matches its source: tools, resources, resource templates, and prompts.

The hub core stays intentionally thin:

- register and initialize plugins
- aggregate plugin-owned `tools/list`, `resources/list`, and `prompts/list`
- namespace plugin capabilities to avoid collisions
- dispatch `tools/call`, `resources/read`, and `prompts/get` back to the owning plugin
- provide shared policy, secrets, logging, and health-check hooks

## Architecture

```text
MCP Client / Agent
        |
        | MCP JSON-RPC
        v
HomeMCP Hub
  - homemcp.* core tools/resources
  - namespacing
  - dispatch
  - policy/logging/secrets
        |
        +--> clock plugin   -> clock.now, homemcp://clock/config
        +--> memory plugin  -> memory.add_note, memory.search_notes, homemcp://memory/notes/{id}
        +--> future plugins -> github.*, rss.*, calendar.*, filesystem.*
```

## Why MCP Hub instead of a thick common item layer?

Information sources naturally expose different operations. A calendar source wants tools like `calendar.find_free_time`, GitHub wants `github.search_issues`, and RSS wants `rss.fetch_latest`. HomeMCP therefore keeps plugin-specific capabilities visible to the agent and only standardizes the MCP boundary.

Optional shared services such as cross-plugin search, indexing, scheduling, or caching can be added later without making them mandatory for every plugin.

## Included plugins

### `clock`

- Tool: `clock.now`
- Resource: `homemcp://clock/config`

### `memory`

- Tools: `memory.add_note`, `memory.search_notes`
- Resource template: `homemcp://memory/notes/{note_id}`
- Prompt: `memory.summarize_notes`

## Development

```bash
npm run build
npm test
npm start
```

`npm start` runs a newline-delimited JSON-RPC server over stdio.

HomeMCP loads plugin settings from `config/homemcp.json` by default. Set `HOMEMCP_CONFIG` to use another JSON file. If no config file exists, the built-in defaults are used.

Plugins share a common configuration shape:

```json
{
  "plugins": {
    "clock": {
      "enabled": true,
      "config": {
        "timezone": "UTC"
      }
    },
    "memory": {
      "enabled": false,
      "config": {}
    }
  }
}
```

Set `enabled` to `false` to keep a plugin from being registered, initialized, or exposed through MCP.

Example request:

```json
{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}
```

## Plugin shape

Plugins implement `HomeMcpPlugin`:

```ts
interface HomeMcpPlugin {
  id: string;
  name: string;
  version: string;
  initialize(context: PluginContext): Promise<void>;
  tools?: ToolProvider;
  resources?: ResourceProvider;
  prompts?: PromptProvider;
  healthCheck?(): Promise<PluginHealth>;
}
```

A plugin returns local names such as `search_issues`; HomeMCP publishes them as namespaced MCP names such as `github.search_issues`.
