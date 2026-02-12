import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../../utils/logger.js';
import { McpUnity } from '../../unity/mcpUnity.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpUnityError, ErrorType } from '../../utils/errors.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { summarizeLogs } from '../../custom/summarizers/logSummarizer.js';
import { setSession } from '../../custom/cache/sessionCache.js';

const toolName = 'get_console_logs_compact';
const toolDescription = 'Compact console logs (auto-summarized when large)';
const paramsSchema = z.object({
  logType: z
    .enum(['info', 'warning', 'error'])
    .optional()
    .describe('The type of logs to retrieve (info, warning, error) - defaults to all logs if not specified'),
  offset: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe('Starting index for pagination (0-based, defaults to 0)'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(500)
    .optional()
    .describe('Maximum number of logs to return (defaults to 50, max 500 to avoid token limits)'),
  includeStackTrace: z
    .boolean()
    .optional()
    .describe('Whether to include stack trace in logs. Defaults to false for compact summaries.'),
});

export function registerGetConsoleLogsCompactTool(
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

async function toolHandler(
  mcpUnity: McpUnity,
  params: z.infer<typeof paramsSchema>
): Promise<CallToolResult> {
  const { logType, offset = 0, limit = 50, includeStackTrace = false } = params;

  const response = await mcpUnity.sendRequest({
    method: 'get_console_logs',
    params: {
      logType,
      offset,
      limit,
      includeStackTrace,
    },
  });

  if (!response.success) {
    throw new McpUnityError(
      ErrorType.TOOL_EXECUTION,
      response.message || 'Failed to fetch logs from Unity'
    );
  }

  const logs = response.data ?? response.logs ?? response;
  const logList = Array.isArray(logs) ? logs : [];

  if (logList.length > 20 || includeStackTrace) {
    const sessionId = uuidv4();
    setSession(sessionId, logList);
    const summary = summarizeLogs(logList);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              summary,
              count: logList.length,
              includeStackTrace,
              detailsUri: `unity://logs/cached/${sessionId}`,
              message: 'Full logs available via URI.',
            },
            null,
            2
          ),
        },
      ],
      data: {
        summary,
        count: logList.length,
        detailsUri: `unity://logs/cached/${sessionId}`,
      },
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(logs, null, 2),
      },
    ],
    data: {
      logs,
      offset,
      limit,
      logType,
      includeStackTrace,
    },
  };
}
