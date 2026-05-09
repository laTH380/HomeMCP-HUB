import type { HomeMcpPlugin, PluginContext } from "../../types/plugin.js";

export function createClockPlugin(): HomeMcpPlugin {
  let timezone = "UTC";

  return {
    id: "clock",
    name: "Clock",
    version: "0.1.0",
    async initialize(context: PluginContext): Promise<void> {
      timezone = typeof context.config.timezone === "string" ? context.config.timezone : "UTC";
      context.logger.info("clock plugin initialized", { timezone });
    },
    tools: {
      async list() {
        return [
          {
            name: "now",
            title: "Current time",
            description: "Return the current time for the configured timezone.",
            inputSchema: {
              type: "object",
              properties: {
                timezone: {
                  type: "string",
                  description: "Optional IANA timezone override.",
                },
              },
              additionalProperties: false,
            },
          },
        ];
      },
      async call(name, args) {
        if (name !== "now") {
          throw new Error(`Unknown clock tool '${name}'`);
        }
        const requestedTimezone = typeof args.timezone === "string" ? args.timezone : timezone;
        const now = new Date();
        const formatted = new Intl.DateTimeFormat("en-US", {
          dateStyle: "full",
          timeStyle: "long",
          timeZone: requestedTimezone,
        }).format(now);
        return {
          content: [{ type: "text", text: formatted }],
          structuredContent: {
            iso: now.toISOString(),
            timezone: requestedTimezone,
            formatted,
          },
        };
      },
    },
    resources: {
      async list() {
        return [
          {
            uri: "homemcp://clock/config",
            name: "clock-config",
            title: "Clock configuration",
            description: "The active clock plugin configuration.",
            mimeType: "application/json",
          },
        ];
      },
      async read(uri) {
        if (uri !== "homemcp://clock/config") {
          throw new Error(`Unknown clock resource '${uri}'`);
        }
        return {
          contents: [
            {
              uri,
              mimeType: "application/json",
              text: JSON.stringify({ timezone }, null, 2),
            },
          ],
        };
      },
    },
    async healthCheck() {
      return { status: "ok", details: { timezone } };
    },
  };
}
