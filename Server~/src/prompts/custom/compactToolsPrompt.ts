import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerCompactToolsPrompt(server: McpServer) {
  server.prompt(
    'unity_compact_tools',
    'Guidance for using Unity MCP compact tools efficiently',
    async () => ({
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `# Unity MCP Compact Tools

Use compact tools by default to reduce context usage. Prefer full outputs only when explicitly requested.

When to use compact tools:
- Large datasets (logs, hierarchy, or complex GameObjects)
- When summarization is acceptable
- When the user did not explicitly request full details

Use original tools/resources when:
- Debugging requires full stack traces
- Small datasets (< 20 items)
- The user explicitly requests full details

Usage examples:

get_console_logs_compact({ logType: "error", limit: 50 })
get_scenes_hierarchy_compact()
get_gameobject_compact({ idOrName: "Player" })
get_gameobject_compact({ idOrName: "Player", compactMode: false })
`,
          },
        },
      ],
    })
  );
}
