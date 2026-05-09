# HomeMCP-HUB

HomeMCP-HUB is a template for adding your own MCP tools and running them together as one integrated MCP server.

Instead of writing MCP SDK boilerplate for every new tool, you can use this repository as a base (or fork it) and implement your desired tools as plugins. HomeMCP-HUB handles common tasks such as tool registration, namespace management (e.g., `plugin_name.tool_name`), and request routing, allowing you to focus purely on the custom logic of your tools.

[日本語 README](./README.ja.md)

## Features

- Plugin-owned MCP tools, resources, resource templates, and prompts
- Namespaced capabilities such as `clock.now` and `memory.search_notes`
- Stdio JSON-RPC MCP server
- Common plugin enable/disable configuration
- Built-in example plugins for clock and in-memory notes
- TypeScript-first plugin interface

## Requirements

- Node.js 22 or later
- npm

## Quick Start

```bash
npm install
npm run build
npm test
npm start
```

`npm start` runs a newline-delimited JSON-RPC server over stdio.

Example request:

```json
{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}
```

## Configuration

HomeMCP-HUB loads `config/homemcp.json` by default. Set `HOMEMCP_CONFIG` to use another file. If no config file exists, built-in defaults are used.

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

See [Configuration](./docs/configuration.md) for details.

## Included Plugins

### `clock`

- Tool: `clock.now`
- Resource: `homemcp://clock/config`

### `memory`

- Tools: `memory.add_note`, `memory.search_notes`
- Resource template: `homemcp://memory/notes/{note_id}`
- Prompt: `memory.summarize_notes`

## Plugin Development

Plugins implement `HomeMcpPlugin` and may expose tools, resources, resource templates, prompts, and health checks.

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

A plugin returns local names such as `search_issues`; HomeMCP-HUB publishes them as namespaced MCP names such as `github.search_issues`.

See [Plugin Development](./docs/plugin-development.md) for a full guide.

## Architecture

```text
MCP Client / Agent
        |
        | MCP JSON-RPC
        v
HomeMCP-HUB
  - homemcp.* core tools/resources
  - namespacing
  - dispatch
  - policy/logging/secrets
        |
        +--> clock plugin   -> clock.now, homemcp://clock/config
        +--> memory plugin  -> memory.add_note, memory.search_notes
        +--> future plugins -> github.*, rss.*, calendar.*, filesystem.*
```

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

MIT. See [LICENSE](./LICENSE).
