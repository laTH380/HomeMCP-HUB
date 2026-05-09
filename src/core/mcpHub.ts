import { HubPolicy } from "./policy.js";
import type { PluginRegistry } from "./pluginRegistry.js";
import type {
  NamespacedPrompt,
  NamespacedResource,
  NamespacedResourceTemplate,
  NamespacedTool,
  ResourceReadRoute,
} from "../types/plugin.js";
import type { PromptResult, ResourceContent, ResourceResult, ToolResult } from "../types/mcp.js";

export interface HubStatus {
  plugins: Array<{
    id: string;
    name: string;
    version: string;
    health?: Record<string, unknown>;
  }>;
}

export class McpHub {
  constructor(
    private readonly registry: PluginRegistry,
    private readonly policy = new HubPolicy(),
  ) {}

  async listTools(): Promise<NamespacedTool[]> {
    const tools: NamespacedTool[] = [
      {
        pluginId: "homemcp",
        localName: "list_plugins",
        name: "homemcp.list_plugins",
        title: "List HomeMCP plugins",
        description: "List plugins registered in this HomeMCP Hub.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
      },
      {
        pluginId: "homemcp",
        localName: "get_status",
        name: "homemcp.get_status",
        title: "Get HomeMCP status",
        description: "Get plugin health and hub status.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
      },
    ];

    for (const plugin of this.registry.list()) {
      if (!plugin.tools) continue;
      for (const tool of await plugin.tools.list()) {
        const name = namespaceName(plugin.id, tool.name);
        if (!this.policy.allowTool(name)) continue;
        tools.push({ ...tool, name, pluginId: plugin.id, localName: tool.name });
      }
    }
    return tools;
  }

  async callTool(namespacedName: string, args: Record<string, unknown> = {}): Promise<ToolResult> {
    if (!this.policy.allowTool(namespacedName)) {
      throw new Error(`Tool '${namespacedName}' is disabled by policy`);
    }
    if (namespacedName === "homemcp.list_plugins") {
      const plugins = this.registry.list().map(({ id, name, version }) => ({ id, name, version }));
      return {
        content: [{ type: "text", text: JSON.stringify(plugins, null, 2) }],
        structuredContent: { plugins },
      };
    }
    if (namespacedName === "homemcp.get_status") {
      const status = await this.getStatus();
      return {
        content: [{ type: "text", text: JSON.stringify(status, null, 2) }],
        structuredContent: status as unknown as Record<string, unknown>,
      };
    }

    const { pluginId, localName } = splitNamespacedName(namespacedName);
    const plugin = this.registry.require(pluginId);
    if (!plugin.tools) {
      throw new Error(`Plugin '${pluginId}' does not expose tools`);
    }
    return plugin.tools.call(localName, args);
  }

  async listResources(): Promise<NamespacedResource[]> {
    const resources: NamespacedResource[] = [
      {
        pluginId: "homemcp",
        uri: "homemcp://plugins",
        name: "plugins",
        title: "HomeMCP plugins",
        description: "Registered HomeMCP plugins.",
        mimeType: "application/json",
      },
      {
        pluginId: "homemcp",
        uri: "homemcp://status",
        name: "status",
        title: "HomeMCP status",
        description: "Hub and plugin health status.",
        mimeType: "application/json",
      },
    ];

    for (const plugin of this.registry.list()) {
      if (!plugin.resources) continue;
      for (const resource of await plugin.resources.list()) {
        const uri = namespaceUri(plugin.id, resource.uri);
        if (!this.policy.allowResource(uri)) continue;
        resources.push({ ...resource, uri, pluginId: plugin.id });
      }
    }
    return resources;
  }

  async listResourceTemplates(): Promise<NamespacedResourceTemplate[]> {
    const templates: NamespacedResourceTemplate[] = [];
    for (const plugin of this.registry.list()) {
      if (!plugin.resources?.templates) continue;
      for (const template of await plugin.resources.templates()) {
        templates.push({
          ...template,
          uriTemplate: namespaceUri(plugin.id, template.uriTemplate),
          pluginId: plugin.id,
        });
      }
    }
    return templates;
  }

  async readResource(uri: string): Promise<ResourceResult> {
    if (!this.policy.allowResource(uri)) {
      throw new Error(`Resource '${uri}' is disabled by policy`);
    }
    if (uri === "homemcp://plugins") {
      const plugins = this.registry.list().map(({ id, name, version }) => ({ id, name, version }));
      return jsonResource(uri, { plugins });
    }
    if (uri === "homemcp://status") {
      return jsonResource(uri, await this.getStatus());
    }

    const route = routeResource(uri);
    const plugin = this.registry.require(route.pluginId);
    if (!plugin.resources) {
      throw new Error(`Plugin '${route.pluginId}' does not expose resources`);
    }
    const result = await plugin.resources.read(route.localUri);
    return {
      contents: result.contents.map((content) => ({
        ...content,
        uri: namespaceUri(route.pluginId, content.uri),
      })),
    };
  }

  async listPrompts(): Promise<NamespacedPrompt[]> {
    const prompts: NamespacedPrompt[] = [];
    for (const plugin of this.registry.list()) {
      if (!plugin.prompts) continue;
      for (const prompt of await plugin.prompts.list()) {
        const name = namespaceName(plugin.id, prompt.name);
        if (!this.policy.allowPrompt(name)) continue;
        prompts.push({ ...prompt, name, pluginId: plugin.id, localName: prompt.name });
      }
    }
    return prompts;
  }

  async getPrompt(namespacedName: string, args: Record<string, unknown> = {}): Promise<PromptResult> {
    if (!this.policy.allowPrompt(namespacedName)) {
      throw new Error(`Prompt '${namespacedName}' is disabled by policy`);
    }
    const { pluginId, localName } = splitNamespacedName(namespacedName);
    const plugin = this.registry.require(pluginId);
    if (!plugin.prompts) {
      throw new Error(`Plugin '${pluginId}' does not expose prompts`);
    }
    return plugin.prompts.get(localName, args);
  }

  async getStatus(): Promise<Record<string, unknown>> {
    const plugins = [];
    for (const plugin of this.registry.list()) {
      plugins.push({
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        health: plugin.healthCheck ? await plugin.healthCheck() : { status: "ok" },
      });
    }
    return { plugins };
  }
}

export function namespaceName(pluginId: string, localName: string): string {
  if (!/^[a-zA-Z0-9_-]+$/.test(localName)) {
    throw new Error(`Invalid local MCP name '${localName}' from plugin '${pluginId}'`);
  }
  return `${pluginId}.${localName}`;
}

export function splitNamespacedName(name: string): { pluginId: string; localName: string } {
  const separator = name.indexOf(".");
  if (separator < 1 || separator === name.length - 1) {
    throw new Error(`Expected namespaced MCP name like 'plugin.tool', got '${name}'`);
  }
  return { pluginId: name.slice(0, separator), localName: name.slice(separator + 1) };
}

export function namespaceUri(pluginId: string, localUri: string): string {
  if (localUri.startsWith(`homemcp://${pluginId}/`)) {
    return localUri;
  }
  if (localUri.startsWith("homemcp://")) {
    const withoutScheme = localUri.slice("homemcp://".length);
    return `homemcp://${pluginId}/${withoutScheme}`;
  }
  if (localUri.startsWith("/")) {
    return `homemcp://${pluginId}${localUri}`;
  }
  return `homemcp://${pluginId}/${localUri}`;
}

export function routeResource(uri: string): ResourceReadRoute {
  if (!uri.startsWith("homemcp://")) {
    throw new Error(`Unsupported resource URI '${uri}'`);
  }
  const path = uri.slice("homemcp://".length);
  const slash = path.indexOf("/");
  if (slash < 1) {
    throw new Error(`Expected plugin resource URI like 'homemcp://plugin/path', got '${uri}'`);
  }
  const pluginId = path.slice(0, slash);
  return { pluginId, localUri: uri };
}

function jsonResource(uri: string, value: unknown): ResourceResult {
  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(value, null, 2),
      } satisfies ResourceContent,
    ],
  };
}
