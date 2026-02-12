import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../../utils/logger.js';
import { McpUnity } from '../../unity/mcpUnity.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpUnityError, ErrorType } from '../../utils/errors.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { summarizeHierarchy, countHierarchyObjects } from '../../custom/summarizers/hierarchySummarizer.js';
import { setHierarchy } from '../../custom/cache/hierarchyCache.js';

const toolName = 'get_scenes_hierarchy_compact';
const toolDescription = 'Compact hierarchy (auto-summarized when large)';
const paramsSchema = z.object({});

export function registerGetScenesHierarchyCompactTool(
  server: McpServer,
  mcpUnity: McpUnity,
  logger: Logger
) {
  logger.info(`Registering tool: ${toolName}`);

  server.tool(
    toolName,
    toolDescription,
    paramsSchema.shape,
    async () => {
      try {
        logger.info(`Executing tool: ${toolName}`);
        const result = await toolHandler(mcpUnity);
        logger.info(`Tool execution successful: ${toolName}`);
        return result;
      } catch (error) {
        logger.error(`Tool execution failed: ${toolName}`, error);
        throw error;
      }
    }
  );
}

async function toolHandler(mcpUnity: McpUnity): Promise<CallToolResult> {
  const response = await mcpUnity.sendRequest({
    method: 'get_scenes_hierarchy',
    params: {},
  });

  if (!response.success) {
    throw new McpUnityError(
      ErrorType.TOOL_EXECUTION,
      response.message || 'Failed to fetch hierarchy from Unity'
    );
  }

  const hierarchy = response.hierarchy ?? response.data ?? response;
  const hierarchyList = Array.isArray(hierarchy) ? hierarchy : [];
  const totalObjects = countHierarchyObjects(hierarchyList);

  if (totalObjects > 100) {
    const hierarchyId = uuidv4();
    setHierarchy(hierarchyId, hierarchyList);
    const summary = summarizeHierarchy(hierarchyList);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              summary,
              totalObjects,
              detailsUri: `unity://hierarchy/cached/${hierarchyId}`,
              message: 'Large hierarchy cached. Access via URI to view details.',
            },
            null,
            2
          ),
        },
      ],
      data: {
        summary,
        totalObjects,
        detailsUri: `unity://hierarchy/cached/${hierarchyId}`,
      },
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(hierarchy, null, 2),
      },
    ],
    data: {
      hierarchy,
      totalObjects,
    },
  };
}
