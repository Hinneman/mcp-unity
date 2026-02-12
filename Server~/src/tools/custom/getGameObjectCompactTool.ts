import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../../utils/logger.js';
import { McpUnity } from '../../unity/mcpUnity.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpUnityError, ErrorType } from '../../utils/errors.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { setGameObject } from '../../custom/cache/gameObjectCache.js';

const toolName = 'get_gameobject_compact';
const toolDescription = 'Get GameObject details (compact mode with optional auto-detection)';
const paramsSchema = z.object({
  idOrName: z
    .string()
    .describe(
      'The instance ID (integer), name, or hierarchical path of the GameObject to retrieve. Use paths like "Canvas/Panel/Button".'
    ),
  compactMode: z
    .union([z.boolean(), z.literal('auto')])
    .optional()
    .describe('Use true to force compact output, false for full output, or auto to compact when large.'),
});

export function registerGetGameObjectCompactTool(
  server: McpServer,
  mcpUnity: McpUnity,
  logger: Logger
) {
  logger.info(`Registering tool: ${toolName}`);

  server.tool(
    toolName,
    toolDescription,
    paramsSchema.shape,
    async (params: z.infer<typeof paramsSchema>) => {
      try {
        logger.info(`Executing tool: ${toolName}`, params);
        const result = await toolHandler(mcpUnity, params);
        logger.info(`Tool execution successful: ${toolName}`);
        return result;
      } catch (error) {
        logger.error(`Tool execution failed: ${toolName}`, error);
        throw error;
      }
    }
  );
}

function getComponentTypes(components: any[]): string[] {
  return (components ?? [])
    .map((component: any) => component?.type ?? component?.name ?? component?.componentType)
    .filter((value: any) => Boolean(value))
    .map((value: any) => String(value));
}

function getChildCount(gameObject: any): number {
  if (Array.isArray(gameObject?.children)) {
    return gameObject.children.length;
  }
  if (typeof gameObject?.childCount === 'number') {
    return gameObject.childCount;
  }
  return 0;
}

function isLargeGameObject(gameObject: any): boolean {
  const componentCount = Array.isArray(gameObject?.components)
    ? gameObject.components.length
    : 0;
  const childCount = getChildCount(gameObject);
  return componentCount > 5 || childCount > 50;
}

async function toolHandler(
  mcpUnity: McpUnity,
  params: z.infer<typeof paramsSchema>
): Promise<CallToolResult> {
  const { idOrName, compactMode = 'auto' } = params;

  const response = await mcpUnity.sendRequest({
    method: 'get_gameobject',
    params: {
      idOrName,
    },
  });

  if (!response.success) {
    throw new McpUnityError(
      ErrorType.TOOL_EXECUTION,
      response.message || 'Failed to fetch GameObject from Unity'
    );
  }

  const gameObject = response.gameObject ?? response.data ?? response;
  const shouldCompact =
    compactMode === true || (compactMode === 'auto' && isLargeGameObject(gameObject));

  if (shouldCompact) {
    const cacheId = uuidv4();
    setGameObject(cacheId, gameObject);

    const compact = {
      name: gameObject?.name ?? 'Unnamed',
      instanceId: gameObject?.instanceId ?? gameObject?.id ?? null,
      activeSelf: gameObject?.activeSelf ?? gameObject?.active ?? false,
      components: getComponentTypes(gameObject?.components),
      childCount: getChildCount(gameObject),
      detailsUri: `unity://gameobject/cached/${cacheId}`,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(compact, null, 2),
        },
      ],
      data: {
        compact,
      },
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(gameObject, null, 2),
      },
    ],
  };
}
