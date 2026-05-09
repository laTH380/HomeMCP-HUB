export type JsonValue = unknown;

export type JsonObject = Record<string, unknown>;

export type JsonSchema = Record<string, unknown>;

export interface ToolDefinition {
  name: string;
  title?: string;
  description?: string;
  inputSchema: JsonSchema;
  outputSchema?: JsonSchema;
}

export interface ToolContent {
  type: "text";
  text: string;
}

export interface ToolResult {
  content: ToolContent[];
  structuredContent?: JsonObject;
  isError?: boolean;
}

export interface ResourceDefinition {
  uri: string;
  name: string;
  title?: string;
  description?: string;
  mimeType?: string;
}

export interface ResourceTemplateDefinition {
  uriTemplate: string;
  name: string;
  title?: string;
  description?: string;
  mimeType?: string;
}

export interface ResourceContent {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: string;
}

export interface ResourceResult {
  contents: ResourceContent[];
}

export interface PromptDefinition {
  name: string;
  title?: string;
  description?: string;
  arguments?: Array<{
    name: string;
    title?: string;
    description?: string;
    required?: boolean;
  }>;
}

export interface PromptMessage {
  role: "user" | "assistant";
  content: ToolContent;
}

export interface PromptResult {
  description?: string;
  messages: PromptMessage[];
}

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: JsonObject;
}

export interface JsonRpcSuccessResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result: JsonValue;
}

export interface JsonRpcErrorResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  error: {
    code: number;
    message: string;
    data?: JsonValue;
  };
}

export type JsonRpcResponse = JsonRpcSuccessResponse | JsonRpcErrorResponse;
