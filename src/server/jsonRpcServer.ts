import type { McpHub } from "../core/mcpHub.js";
import type { JsonObject, JsonRpcRequest, JsonRpcResponse, JsonValue } from "../types/mcp.js";

const PARSE_ERROR = -32700;
const INVALID_REQUEST = -32600;
const METHOD_NOT_FOUND = -32601;
const INVALID_PARAMS = -32602;
const INTERNAL_ERROR = -32603;

export class JsonRpcMcpServer {
  constructor(private readonly hub: McpHub) {}

  async handle(raw: string): Promise<JsonRpcResponse | undefined> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      return errorResponse(null, PARSE_ERROR, "Parse error", String(error));
    }

    if (!isRequest(parsed)) {
      return errorResponse(null, INVALID_REQUEST, "Invalid JSON-RPC request");
    }

    const request = parsed;
    if (request.id === undefined) {
      await this.dispatch(request);
      return undefined;
    }

    try {
      const result = await this.dispatch(request);
      return { jsonrpc: "2.0", id: request.id, result };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return errorResponse(request.id, errorCodeFor(error), message);
    }
  }

  private async dispatch(request: JsonRpcRequest): Promise<JsonValue> {
    switch (request.method) {
      case "initialize":
        return {
          protocolVersion: "2025-11-25",
          serverInfo: { name: "HomeMCP-HUB", version: "0.1.0" },
          capabilities: {
            tools: { listChanged: true },
            resources: { listChanged: true },
            prompts: { listChanged: true },
          },
        };
      case "ping":
        return {};
      case "tools/list":
        return { tools: (await this.hub.listTools()) as unknown as JsonValue } as JsonObject;
      case "tools/call": {
        const params = request.params ?? {};
        const name = expectString(params.name, "name");
        const args = expectObject(params.arguments ?? {}, "arguments");
        return (await this.hub.callTool(name, args)) as unknown as JsonValue;
      }
      case "resources/list":
        return { resources: (await this.hub.listResources()) as unknown as JsonValue } as JsonObject;
      case "resources/templates/list":
        return {
          resourceTemplates: (await this.hub.listResourceTemplates()) as unknown as JsonValue,
        } as JsonObject;
      case "resources/read": {
        const params = request.params ?? {};
        const uri = expectString(params.uri, "uri");
        return (await this.hub.readResource(uri)) as unknown as JsonValue;
      }
      case "prompts/list":
        return { prompts: (await this.hub.listPrompts()) as unknown as JsonValue } as JsonObject;
      case "prompts/get": {
        const params = request.params ?? {};
        const name = expectString(params.name, "name");
        const args = expectObject(params.arguments ?? {}, "arguments");
        return (await this.hub.getPrompt(name, args)) as unknown as JsonValue;
      }
      case "notifications/initialized":
        return {};
      default:
        throw new JsonRpcDispatchError(METHOD_NOT_FOUND, `Method '${request.method}' is not implemented`);
    }
  }
}

export async function runStdioServer(server: JsonRpcMcpServer): Promise<void> {
  process.stdin.setEncoding("utf8");
  let buffer = "";

  for await (const chunk of process.stdin) {
    buffer += chunk;
    let newlineIndex = buffer.indexOf("\n");
    while (newlineIndex >= 0) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (line) {
        const response = await server.handle(line);
        if (response) {
          process.stdout.write(`${JSON.stringify(response)}\n`);
        }
      }
      newlineIndex = buffer.indexOf("\n");
    }
  }
}

class JsonRpcDispatchError extends Error {
  constructor(
    readonly code: number,
    message: string,
  ) {
    super(message);
  }
}

function isRequest(value: unknown): value is JsonRpcRequest {
  return (
    !!value &&
    typeof value === "object" &&
    (value as JsonRpcRequest).jsonrpc === "2.0" &&
    typeof (value as JsonRpcRequest).method === "string"
  );
}

function expectString(value: unknown, name: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new JsonRpcDispatchError(INVALID_PARAMS, `Parameter '${name}' must be a non-empty string`);
  }
  return value;
}

function expectObject(value: unknown, name: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new JsonRpcDispatchError(INVALID_PARAMS, `Parameter '${name}' must be an object`);
  }
  return value as Record<string, unknown>;
}

function errorResponse(
  id: string | number | null,
  code: number,
  message: string,
  data?: JsonValue,
): JsonRpcResponse {
  return { jsonrpc: "2.0", id, error: { code, message, ...(data === undefined ? {} : { data }) } };
}

function errorCodeFor(error: unknown): number {
  return error instanceof JsonRpcDispatchError ? error.code : INTERNAL_ERROR;
}
