import type {
  PromptDefinition,
  PromptResult,
  ResourceContent,
  ResourceDefinition,
  ResourceResult,
  ResourceTemplateDefinition,
  ToolDefinition,
  ToolResult,
} from "./mcp.js";

export interface PluginContext {
  pluginId: string;
  config: Record<string, unknown>;
  logger: PluginLogger;
  secrets: SecretProvider;
}

export interface PluginLogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

export interface SecretProvider {
  get(name: string): string | undefined;
  require(name: string): string;
}

export interface PluginHealth {
  status: "ok" | "degraded" | "error";
  message?: string;
  details?: Record<string, unknown>;
}

export interface ToolProvider {
  list(): Promise<ToolDefinition[]>;
  call(name: string, args: Record<string, unknown>): Promise<ToolResult>;
}

export interface ResourceProvider {
  list(): Promise<ResourceDefinition[]>;
  templates?(): Promise<ResourceTemplateDefinition[]>;
  read(uri: string): Promise<ResourceResult>;
}

export interface PromptProvider {
  list(): Promise<PromptDefinition[]>;
  get(name: string, args: Record<string, unknown>): Promise<PromptResult>;
}

export interface HomeMcpPlugin {
  id: string;
  name: string;
  version: string;
  initialize(context: PluginContext): Promise<void>;
  tools?: ToolProvider;
  resources?: ResourceProvider;
  prompts?: PromptProvider;
  healthCheck?(): Promise<PluginHealth>;
}

export interface NamespacedTool extends ToolDefinition {
  pluginId: string;
  localName: string;
}

export interface NamespacedResource extends ResourceDefinition {
  pluginId: string;
}

export interface NamespacedResourceTemplate extends ResourceTemplateDefinition {
  pluginId: string;
}

export interface NamespacedPrompt extends PromptDefinition {
  pluginId: string;
  localName: string;
}

export interface ResourceReadRoute {
  pluginId: string;
  localUri: string;
}

export type ResourceContentMapper = (content: ResourceContent) => ResourceContent;
