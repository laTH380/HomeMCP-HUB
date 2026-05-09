# Configuration

HomeMCP-HUB reads configuration from `config/homemcp.json` by default.

You can point to another file with `HOMEMCP_CONFIG`:

```bash
HOMEMCP_CONFIG=./config/local.homemcp.json npm start
```

If no default config file exists, HomeMCP-HUB starts with built-in defaults.

## Shape

```json
{
  "server": {
    "name": "HomeMCP-HUB",
    "transport": "stdio"
  },
  "plugins": {
    "clock": {
      "enabled": true,
      "config": {
        "timezone": "UTC"
      }
    },
    "memory": {
      "enabled": true,
      "config": {
        "notes": [
          {
            "id": "welcome",
            "title": "Welcome to HomeMCP-HUB",
            "body": "Plugins own their MCP surface; HomeMCP-HUB aggregates it."
          }
        ]
      }
    }
  },
  "policy": {
    "tools": {},
    "resources": {},
    "prompts": {}
  }
}
```

## Plugin Settings

Each plugin uses the same wrapper shape:

```ts
interface PluginConfig {
  enabled?: boolean;
  config?: Record<string, unknown>;
}
```

- `enabled`: set to `false` to disable the plugin.
- `config`: plugin-specific configuration passed to `initialize(context)`.

Disabled plugins are not registered, initialized, listed, or exposed through MCP.

## Built-in Plugin Config

### `clock`

```json
{
  "plugins": {
    "clock": {
      "enabled": true,
      "config": {
        "timezone": "UTC"
      }
    }
  }
}
```

`timezone` is used by `clock.now` when a request does not provide a timezone override.

### `memory`

```json
{
  "plugins": {
    "memory": {
      "enabled": true,
      "config": {
        "notes": [
          {
            "id": "first",
            "title": "First note",
            "body": "Hello HomeMCP-HUB"
          }
        ]
      }
    }
  }
}
```

`notes` seeds the in-memory note store during startup.

## Policy

Policy entries can disable specific published tools, resources, or prompts without disabling the whole plugin.

```json
{
  "policy": {
    "tools": {
      "memory.add_note": false
    },
    "resources": {
      "homemcp://clock/config": false
    },
    "prompts": {
      "memory.summarize_notes": false
    }
  }
}
```

Missing policy entries default to `true`.
