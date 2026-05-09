import assert from "node:assert/strict";
import test from "node:test";
import { McpHub, namespaceName, namespaceUri, routeResource } from "../src/core/mcpHub.js";
import { PluginRegistry } from "../src/core/pluginRegistry.js";
import { createMemoryPlugin } from "../src/plugins/memory/index.js";

test("namespaces plugin-owned MCP names and URIs", () => {
  assert.equal(namespaceName("github", "search_issues"), "github.search_issues");
  assert.equal(namespaceUri("github", "homemcp://repos/o/r/issues/1"), "homemcp://github/repos/o/r/issues/1");
  assert.deepEqual(routeResource("homemcp://github/repos/o/r/issues/1"), {
    pluginId: "github",
    localUri: "homemcp://github/repos/o/r/issues/1",
  });
});

test("rejects duplicate plugin ids", () => {
  const registry = new PluginRegistry();
  registry.register(createMemoryPlugin());
  assert.throws(() => registry.register(createMemoryPlugin()), /already registered/);
});

test("skips disabled plugins", async () => {
  const registry = new PluginRegistry();
  registry.register(createMemoryPlugin(), { enabled: false });
  await registry.initializeAll();

  const hub = new McpHub(registry);
  const tools = await hub.listTools();
  assert.equal(registry.list().length, 0);
  assert.ok(!tools.some((tool) => tool.name === "memory.search_notes"));
});

test("aggregates and dispatches plugin-owned tools", async () => {
  const registry = new PluginRegistry();
  registry.register(createMemoryPlugin(), {
    config: { notes: [{ id: "first", title: "First", body: "hello hub" }] },
  });
  await registry.initializeAll();

  const hub = new McpHub(registry);
  const tools = await hub.listTools();
  assert.ok(tools.some((tool) => tool.name === "homemcp.list_plugins"));
  assert.ok(tools.some((tool) => tool.name === "memory.search_notes"));

  const result = await hub.callTool("memory.search_notes", { query: "hub" });
  const content = result.structuredContent as { results: Array<{ title: string; uri: string }> };
  assert.equal(content.results.length, 1);
  assert.equal(content.results[0]?.title, "First");
  assert.equal(content.results[0]?.uri, "homemcp://memory/notes/first");
});

test("routes namespaced resources back to their owning plugin", async () => {
  const registry = new PluginRegistry();
  registry.register(createMemoryPlugin(), {
    config: { notes: [{ id: "first", title: "First", body: "hello resource" }] },
  });
  await registry.initializeAll();

  const hub = new McpHub(registry);
  const resources = await hub.listResources();
  assert.ok(resources.some((resource) => resource.uri === "homemcp://memory/notes/first"));

  const result = await hub.readResource("homemcp://memory/notes/first");
  assert.equal(result.contents[0]?.uri, "homemcp://memory/notes/first");
  assert.match(result.contents[0]?.text ?? "", /hello resource/);
});
