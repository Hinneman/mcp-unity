import * as z from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Logger } from '../utils/logger.js';
import { registerAppTool } from '@modelcontextprotocol/ext-apps/server';

const toolName = 'show_unity_dashboard';
const toolDescription = 'Opens the Unity dashboard MCP App in VS Code.';
const paramsSchema = z.object({});

export function registerShowUnityDashboardTool(server: McpServer, logger: Logger) {
  logger.info(`Registering tool: ${toolName}`);

  registerAppTool(server, toolName, {
    description: toolDescription,
    inputSchema: paramsSchema.shape,
    _meta: {
      ui: {
        resourceUri: 'ui://unity-dashboard',
      }
    }
  }, async () => {
    try {
      logger.info(`Executing tool: ${toolName}`);
      const result = await toolHandler();
      logger.info(`Tool execution successful: ${toolName}`);
      return result;
    } catch (error) {
      logger.error(`Tool execution failed: ${toolName}`, error);
      throw error;
    }
  });
}

async function toolHandler(): Promise<CallToolResult> {
  // registerAppTool handles resource fetching automatically
  // The MCP host will fetch ui://unity-dashboard resource
  return {
    content: [
      {
        type: 'text',
        text: 'Unity Dashboard opened successfully'
      }
    ]
  };
}
