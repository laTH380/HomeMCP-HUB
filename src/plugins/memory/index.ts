import type { HomeMcpPlugin, PluginContext } from "../../types/plugin.js";

type Note = { id: string; title: string; body: string; createdAt: string };

export function createMemoryPlugin(): HomeMcpPlugin {
  const notes = new Map<string, Note>();

  return {
    id: "memory",
    name: "In-memory notes",
    version: "0.1.0",
    async initialize(context: PluginContext): Promise<void> {
      const initialNotes = Array.isArray(context.config.notes) ? context.config.notes : [];
      for (const note of initialNotes) {
        if (!note || typeof note !== "object") continue;
        const candidate = note as Record<string, unknown>;
        if (typeof candidate.id !== "string" || typeof candidate.title !== "string") continue;
        notes.set(candidate.id, {
          id: candidate.id,
          title: candidate.title,
          body: typeof candidate.body === "string" ? candidate.body : "",
          createdAt: typeof candidate.createdAt === "string" ? candidate.createdAt : new Date().toISOString(),
        });
      }
      context.logger.info("memory plugin initialized", { noteCount: notes.size });
    },
    tools: {
      async list() {
        return [
          {
            name: "add_note",
            title: "Add note",
            description: "Create an in-memory note and expose it as a resource.",
            inputSchema: {
              type: "object",
              properties: {
                title: { type: "string" },
                body: { type: "string" },
              },
              required: ["title", "body"],
              additionalProperties: false,
            },
          },
          {
            name: "search_notes",
            title: "Search notes",
            description: "Search in-memory notes by title or body.",
            inputSchema: {
              type: "object",
              properties: {
                query: { type: "string" },
              },
              required: ["query"],
              additionalProperties: false,
            },
          },
        ];
      },
      async call(name, args) {
        if (name === "add_note") {
          const title = requireString(args.title, "title");
          const body = requireString(args.body, "body");
          const id = slugify(`${title}-${Date.now()}`);
          const note = { id, title, body, createdAt: new Date().toISOString() };
          notes.set(id, note);
          const uri = `homemcp://memory/notes/${id}`;
          return {
            content: [{ type: "text", text: `Created note '${title}' at ${uri}` }],
            structuredContent: { note, uri },
          };
        }
        if (name === "search_notes") {
          const query = requireString(args.query, "query").toLowerCase();
          const results = [...notes.values()]
            .filter((note) => note.title.toLowerCase().includes(query) || note.body.toLowerCase().includes(query))
            .map((note) => ({ ...note, uri: `homemcp://memory/notes/${note.id}` }));
          return {
            content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
            structuredContent: { results },
          };
        }
        throw new Error(`Unknown memory tool '${name}'`);
      },
    },
    resources: {
      async list() {
        return [...notes.values()].map((note) => ({
          uri: `homemcp://memory/notes/${note.id}`,
          name: `note-${note.id}`,
          title: note.title,
          description: `In-memory note created at ${note.createdAt}`,
          mimeType: "text/markdown",
        }));
      },
      async templates() {
        return [
          {
            uriTemplate: "homemcp://memory/notes/{note_id}",
            name: "memory-note",
            title: "Memory note",
            description: "Read an in-memory note by id.",
            mimeType: "text/markdown",
          },
        ];
      },
      async read(uri) {
        const prefix = "homemcp://memory/notes/";
        if (!uri.startsWith(prefix)) {
          throw new Error(`Unknown memory resource '${uri}'`);
        }
        const id = uri.slice(prefix.length);
        const note = notes.get(id);
        if (!note) {
          throw new Error(`Note '${id}' was not found`);
        }
        return {
          contents: [
            {
              uri,
              mimeType: "text/markdown",
              text: `# ${note.title}\n\n${note.body}\n`,
            },
          ],
        };
      },
    },
    prompts: {
      async list() {
        return [
          {
            name: "summarize_notes",
            title: "Summarize notes",
            description: "Ask the model to summarize all current in-memory notes.",
          },
        ];
      },
      async get(name) {
        if (name !== "summarize_notes") {
          throw new Error(`Unknown memory prompt '${name}'`);
        }
        const noteList = [...notes.values()].map((note) => `- ${note.title}: ${note.body}`).join("\n");
        return {
          description: "Summarize notes stored in the memory plugin.",
          messages: [
            {
              role: "user",
              content: {
                type: "text",
                text: `Summarize these notes and identify next actions if any:\n\n${noteList || "(no notes)"}`,
              },
            },
          ],
        };
      },
    },
    async healthCheck() {
      return { status: "ok", details: { noteCount: notes.size } };
    },
  };
}

function requireString(value: unknown, name: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Argument '${name}' must be a non-empty string`);
  }
  return value;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}
