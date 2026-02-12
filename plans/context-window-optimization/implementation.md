# Context Window Optimization

## Goal
Add custom compact wrapper tools and cached resources for console logs, scene hierarchy, and GameObject details to reduce context usage without modifying upstream tools.

## Prerequisites
Make sure that the user is currently on the `optimize/context-window-architecture` branch before beginning implementation.
If not, move them to the correct branch. If the branch does not exist, create it from main.

### Step-by-Step Instructions

#### Step 1: Create Compact Console Logs Tool (Custom Wrapper)
- [ ] Create these directories if they do not exist:
  - `Server~/src/custom/cache`
  - `Server~/src/custom/summarizers`
  - `Server~/src/resources/custom`
  - `Server~/src/tools/custom`
- [ ] Create the new summarizer at `Server~/src/custom/summarizers/logSummarizer.ts` and paste:

```typescript
export interface LogSummary {
  total: number;
  byType: Record<string, number>;
  sampleMessages: Array<{ type: string; message: string; count: number }>;
  hasStackTraces: boolean;
}

const SAMPLE_LIMIT = 5;
const MAX_MESSAGE_LENGTH = 200;

function normalizeType(log: any): string {
  const raw = log?.logType ?? log?.type ?? log?.level ?? 'info';
  return String(raw).toLowerCase();
}

function normalizeMessage(log: any): string {
  const raw = log?.message ?? log?.condition ?? log?.text ?? '';
  const message = String(raw);
  if (message.length <= MAX_MESSAGE_LENGTH) {
    return message;
  }
  return `${message.slice(0, MAX_MESSAGE_LENGTH)}...`;
}

function hasStackTrace(log: any): boolean {
  const stack = log?.stackTrace ?? log?.stack ?? log?.stacktrace ?? '';
  return Boolean(stack && String(stack).trim().length > 0);
}

export function summarizeLogs(logs: any[]): LogSummary {
  const byType: Record<string, number> = {};
  const messageCounts = new Map<string, { type: string; message: string; count: number }>();
  let hasStackTraces = false;

  for (const log of logs ?? []) {
    const type = normalizeType(log);
    const message = normalizeMessage(log);

    byType[type] = (byType[type] ?? 0) + 1;

    const key = `${type}::${message}`;
    const entry = messageCounts.get(key) ?? { type, message, count: 0 };
    entry.count += 1;
    messageCounts.set(key, entry);

    if (!hasStackTraces && hasStackTrace(log)) {
      hasStackTraces = true;
    }
  }

  const sampleMessages = Array.from(messageCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, SAMPLE_LIMIT);

  return {
    total: logs?.length ?? 0,
    byType,
    sampleMessages,
    hasStackTraces,
  };
}
```

- [ ] Create the cache at `Server~/src/custom/cache/sessionCache.ts` and paste:

```typescript
export interface CacheStats {
  size: number;
}

interface CacheEntry<T> {
  value: T;
  createdAt: number;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 30 * 60 * 1000;
const store = new Map<string, CacheEntry<any>>();

function now(): number {
  return Date.now();
}

function pruneExpired(): void {
  const current = now();
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt <= current) {
      store.delete(key);
    }
  }
}

export function setSession<T>(id: string, value: T, ttlMs: number = DEFAULT_TTL_MS): void {
  pruneExpired();
  const current = now();
  store.set(id, {
    value,
    createdAt: current,
    expiresAt: current + ttlMs,
  });
}

export function getSession<T>(id: string): T | undefined {
  pruneExpired();
  const entry = store.get(id);
  if (!entry) {
    return undefined;
  }
  if (entry.expiresAt <= now()) {
    store.delete(id);
    return undefined;
  }
  return entry.value as T;
}

export function hasSession(id: string): boolean {
  return getSession(id) !== undefined;
}

export function deleteSession(id: string): void {
  store.delete(id);
}

export function clearSessions(): void {
  store.clear();
}

export function getSessionStats(): CacheStats {
  pruneExpired();
  return { size: store.size };
}
```

- [ ] Create the cached logs resource at `Server~/src/resources/custom/cachedLogsResource.ts` and paste:

```typescript
import { Logger } from '../../utils/logger.js';
import { ResourceTemplate, McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';
import { Variables } from '@modelcontextprotocol/sdk/shared/uriTemplate.js';
import { McpUnityError, ErrorType } from '../../utils/errors.js';
import { getSession } from '../../custom/cache/sessionCache.js';

const resourceName = 'cached_console_logs';
const resourceUri = 'unity://logs/cached/{sessionId}';
const resourceMimeType = 'application/json';

export function registerCachedLogsResource(server: McpServer, logger: Logger) {
  logger.info(`Registering resource: ${resourceName}`);

  const resourceTemplate = new ResourceTemplate(resourceUri, { list: undefined });

  server.resource(
    resourceName,
    resourceTemplate,
    {
      description: 'Retrieve cached console logs by session ID (generated by get_console_logs_compact).',
      mimeType: resourceMimeType,
    },
    async (uri, variables) => {
      try {
        return resourceHandler(uri, variables);
      } catch (error) {
        logger.error(`Error handling resource ${resourceName}: ${error}`);
        throw error;
      }
    }
  );
}

function resourceHandler(uri: URL, variables: Variables): ReadResourceResult {
  const sessionId = decodeURIComponent(variables['sessionId'] as string);
  const logs = getSession<any[]>(sessionId);

  if (!logs) {
    throw new McpUnityError(
      ErrorType.RESOURCE_FETCH,
      `Cached logs not found for session ${sessionId}`
    );
  }

  return {
    contents: [
      {
        uri: `unity://logs/cached/${sessionId}`,
        mimeType: resourceMimeType,
        text: JSON.stringify(logs, null, 2),
      },
    ],
  };
}
```

- [ ] Create the compact tool at `Server~/src/tools/custom/getConsoleLogsCompactTool.ts` and paste:

```typescript
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
```

##### Step 1 Verification Checklist
- [ ] No TypeScript errors when compiling `Server~/src/custom` changes locally
- [ ] Running `get_console_logs_compact` with 50+ logs returns a summary and `detailsUri`

#### Step 1 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

#### Step 2: Create Compact Hierarchy Tool (Custom Wrapper)
- [ ] Create the summarizer at `Server~/src/custom/summarizers/hierarchySummarizer.ts` and paste:

```typescript
export interface HierarchySummary {
  totalObjects: number;
  activeObjects: number;
  rootObjects: number;
  maxDepth: number;
  samplePaths: string[];
}

const SAMPLE_LIMIT = 10;

function getNodeName(node: any): string {
  const name = node?.name ?? 'Unnamed';
  return String(name);
}

function isNodeActive(node: any): boolean {
  const active = node?.activeSelf ?? node?.active ?? node?.isActive;
  return Boolean(active);
}

function getChildren(node: any): any[] {
  return Array.isArray(node?.children) ? node.children : [];
}

export function countHierarchyObjects(hierarchy: any[]): number {
  let count = 0;

  function walk(node: any) {
    if (!node) return;
    count += 1;
    for (const child of getChildren(node)) {
      walk(child);
    }
  }

  if (Array.isArray(hierarchy)) {
    for (const root of hierarchy) {
      walk(root);
    }
  }

  return count;
}

export function summarizeHierarchy(hierarchy: any[]): HierarchySummary {
  let totalObjects = 0;
  let activeObjects = 0;
  let maxDepth = 0;
  const samplePaths: string[] = [];

  function walk(node: any, path: string, depth: number) {
    if (!node) return;
    totalObjects += 1;
    if (isNodeActive(node)) {
      activeObjects += 1;
    }
    if (depth > maxDepth) {
      maxDepth = depth;
    }

    if (samplePaths.length < SAMPLE_LIMIT) {
      samplePaths.push(path);
    }

    for (const child of getChildren(node)) {
      const childName = getNodeName(child);
      walk(child, `${path}/${childName}`, depth + 1);
    }
  }

  const roots = Array.isArray(hierarchy) ? hierarchy : [];
  for (const root of roots) {
    const rootName = getNodeName(root);
    walk(root, rootName, 1);
  }

  return {
    totalObjects,
    activeObjects,
    rootObjects: roots.length,
    maxDepth,
    samplePaths,
  };
}
```

- [ ] Create the cache at `Server~/src/custom/cache/hierarchyCache.ts` and paste:

```typescript
export interface CacheStats {
  size: number;
}

interface CacheEntry<T> {
  value: T;
  createdAt: number;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 30 * 60 * 1000;
const store = new Map<string, CacheEntry<any>>();

function now(): number {
  return Date.now();
}

function pruneExpired(): void {
  const current = now();
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt <= current) {
      store.delete(key);
    }
  }
}

export function setHierarchy<T>(id: string, value: T, ttlMs: number = DEFAULT_TTL_MS): void {
  pruneExpired();
  const current = now();
  store.set(id, {
    value,
    createdAt: current,
    expiresAt: current + ttlMs,
  });
}

export function getHierarchy<T>(id: string): T | undefined {
  pruneExpired();
  const entry = store.get(id);
  if (!entry) {
    return undefined;
  }
  if (entry.expiresAt <= now()) {
    store.delete(id);
    return undefined;
  }
  return entry.value as T;
}

export function hasHierarchy(id: string): boolean {
  return getHierarchy(id) !== undefined;
}

export function deleteHierarchy(id: string): void {
  store.delete(id);
}

export function clearHierarchies(): void {
  store.clear();
}

export function getHierarchyStats(): CacheStats {
  pruneExpired();
  return { size: store.size };
}
```

- [ ] Create the cached hierarchy resource at `Server~/src/resources/custom/cachedHierarchyResource.ts` and paste:

```typescript
import { Logger } from '../../utils/logger.js';
import { ResourceTemplate, McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';
import { Variables } from '@modelcontextprotocol/sdk/shared/uriTemplate.js';
import { McpUnityError, ErrorType } from '../../utils/errors.js';
import { getHierarchy } from '../../custom/cache/hierarchyCache.js';

const resourceName = 'cached_scene_hierarchy';
const resourceUri = 'unity://hierarchy/cached/{hierarchyId}';
const resourceMimeType = 'application/json';

export function registerCachedHierarchyResource(server: McpServer, logger: Logger) {
  logger.info(`Registering resource: ${resourceName}`);

  const resourceTemplate = new ResourceTemplate(resourceUri, { list: undefined });

  server.resource(
    resourceName,
    resourceTemplate,
    {
      description: 'Retrieve cached scene hierarchy by ID (generated by get_scenes_hierarchy_compact).',
      mimeType: resourceMimeType,
    },
    async (uri, variables) => {
      try {
        return resourceHandler(uri, variables);
      } catch (error) {
        logger.error(`Error handling resource ${resourceName}: ${error}`);
        throw error;
      }
    }
  );
}

function resourceHandler(uri: URL, variables: Variables): ReadResourceResult {
  const hierarchyId = decodeURIComponent(variables['hierarchyId'] as string);
  const hierarchy = getHierarchy<any>(hierarchyId);

  if (!hierarchy) {
    throw new McpUnityError(
      ErrorType.RESOURCE_FETCH,
      `Cached hierarchy not found for id ${hierarchyId}`
    );
  }

  return {
    contents: [
      {
        uri: `unity://hierarchy/cached/${hierarchyId}`,
        mimeType: resourceMimeType,
        text: JSON.stringify(hierarchy, null, 2),
      },
    ],
  };
}
```

- [ ] Create the compact tool at `Server~/src/tools/custom/getScenesHierarchyCompactTool.ts` and paste:

```typescript
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
```

##### Step 2 Verification Checklist
- [ ] Running `get_scenes_hierarchy_compact` on a 500+ object scene returns a summary and `detailsUri`
- [ ] The cached hierarchy resource resolves and returns full hierarchy JSON

#### Step 2 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

#### Step 3: Create Compact GameObject Tool (Custom Wrapper)
- [ ] Create the cache at `Server~/src/custom/cache/gameObjectCache.ts` and paste:

```typescript
export interface CacheStats {
  size: number;
}

interface CacheEntry<T> {
  value: T;
  createdAt: number;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 30 * 60 * 1000;
const store = new Map<string, CacheEntry<any>>();

function now(): number {
  return Date.now();
}

function pruneExpired(): void {
  const current = now();
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt <= current) {
      store.delete(key);
    }
  }
}

export function setGameObject<T>(id: string, value: T, ttlMs: number = DEFAULT_TTL_MS): void {
  pruneExpired();
  const current = now();
  store.set(id, {
    value,
    createdAt: current,
    expiresAt: current + ttlMs,
  });
}

export function getGameObject<T>(id: string): T | undefined {
  pruneExpired();
  const entry = store.get(id);
  if (!entry) {
    return undefined;
  }
  if (entry.expiresAt <= now()) {
    store.delete(id);
    return undefined;
  }
  return entry.value as T;
}

export function hasGameObject(id: string): boolean {
  return getGameObject(id) !== undefined;
}

export function deleteGameObject(id: string): void {
  store.delete(id);
}

export function clearGameObjects(): void {
  store.clear();
}

export function getGameObjectStats(): CacheStats {
  pruneExpired();
  return { size: store.size };
}
```

- [ ] Create the cached GameObject resource at `Server~/src/resources/custom/cachedGameObjectResource.ts` and paste:

```typescript
import { Logger } from '../../utils/logger.js';
import { ResourceTemplate, McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ReadResourceResult } from '@modelcontextprotocol/sdk/types.js';
import { Variables } from '@modelcontextprotocol/sdk/shared/uriTemplate.js';
import { McpUnityError, ErrorType } from '../../utils/errors.js';
import { getGameObject } from '../../custom/cache/gameObjectCache.js';

const resourceName = 'cached_gameobject';
const resourceUri = 'unity://gameobject/cached/{cacheId}';
const resourceMimeType = 'application/json';

export function registerCachedGameObjectResource(server: McpServer, logger: Logger) {
  logger.info(`Registering resource: ${resourceName}`);

  const resourceTemplate = new ResourceTemplate(resourceUri, { list: undefined });

  server.resource(
    resourceName,
    resourceTemplate,
    {
      description: 'Retrieve cached GameObject details by ID (generated by get_gameobject_compact).',
      mimeType: resourceMimeType,
    },
    async (uri, variables) => {
      try {
        return resourceHandler(uri, variables);
      } catch (error) {
        logger.error(`Error handling resource ${resourceName}: ${error}`);
        throw error;
      }
    }
  );
}

function resourceHandler(uri: URL, variables: Variables): ReadResourceResult {
  const cacheId = decodeURIComponent(variables['cacheId'] as string);
  const gameObject = getGameObject<any>(cacheId);

  if (!gameObject) {
    throw new McpUnityError(
      ErrorType.RESOURCE_FETCH,
      `Cached GameObject not found for id ${cacheId}`
    );
  }

  return {
    contents: [
      {
        uri: `unity://gameobject/cached/${cacheId}`,
        mimeType: resourceMimeType,
        text: JSON.stringify(gameObject, null, 2),
      },
    ],
  };
}
```

- [ ] Create the compact tool at `Server~/src/tools/custom/getGameObjectCompactTool.ts` and paste:

```typescript
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
```

##### Step 3 Verification Checklist
- [ ] `get_gameobject_compact` returns compact output and `detailsUri` for large GameObjects
- [ ] `compactMode=false` returns full details and bypasses caching

#### Step 3 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.

#### Step 4: Register Custom Tools, Resources, and Prompt
- [ ] Create the prompt at `Server~/src/prompts/custom/compactToolsPrompt.ts` and paste:

```typescript
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
```

- [ ] Update `Server~/src/index.ts` and paste:

```typescript
// Import MCP SDK components
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpUnity } from './unity/mcpUnity.js';
import { Logger, LogLevel } from './utils/logger.js';
import { registerCreateSceneTool } from './tools/createSceneTool.js';
import { registerMenuItemTool } from './tools/menuItemTool.js';
import { registerSelectGameObjectTool } from './tools/selectGameObjectTool.js';
import { registerAddPackageTool } from './tools/addPackageTool.js';
import { registerRunTestsTool } from './tools/runTestsTool.js';
import { registerSendConsoleLogTool } from './tools/sendConsoleLogTool.js';
import { registerGetConsoleLogsTool } from './tools/getConsoleLogsTool.js';
import { registerUpdateComponentTool } from './tools/updateComponentTool.js';
import { registerAddAssetToSceneTool } from './tools/addAssetToSceneTool.js';
import { registerUpdateGameObjectTool } from './tools/updateGameObjectTool.js';
import { registerCreatePrefabTool } from './tools/createPrefabTool.js';
import { registerDeleteSceneTool } from './tools/deleteSceneTool.js';
import { registerLoadSceneTool } from './tools/loadSceneTool.js';
import { registerSaveSceneTool } from './tools/saveSceneTool.js';
import { registerGetSceneInfoTool } from './tools/getSceneInfoTool.js';
import { registerGetPlayModeStatusTool } from './tools/getPlayModeStatusTool.js';
import { registerSetPlayModeStatusTool } from './tools/setPlayModeStatusTool.js';
import { registerUnloadSceneTool } from './tools/unloadSceneTool.js';
import { registerRecompileScriptsTool } from './tools/recompileScriptsTool.js';
import { registerGetGameObjectTool } from './tools/getGameObjectTool.js';
import { registerTransformTools } from './tools/transformTools.js';
import { registerCreateMaterialTool, registerAssignMaterialTool, registerModifyMaterialTool, registerGetMaterialInfoTool } from './tools/materialTools.js';
import { registerDuplicateGameObjectTool, registerDeleteGameObjectTool, registerReparentGameObjectTool } from './tools/gameObjectTools.js';
import { registerBatchExecuteTool } from './tools/batchExecuteTool.js';
import { registerShowUnityDashboardTool } from './tools/showUnityDashboardTool.js';
import { registerGetScenesHierarchyTool } from './tools/getScenesHierarchyTool.js';
import { registerGetMenuItemsResource } from './resources/getMenuItemResource.js';
import { registerGetConsoleLogsResource } from './resources/getConsoleLogsResource.js';
import { registerGetHierarchyResource } from './resources/getScenesHierarchyResource.js';
import { registerGetPackagesResource } from './resources/getPackagesResource.js';
import { registerGetAssetsResource } from './resources/getAssetsResource.js';
import { registerGetTestsResource } from './resources/getTestsResource.js';
import { registerGetGameObjectResource } from './resources/getGameObjectResource.js';
import { registerUnityDashboardAppResource } from './resources/unityDashboardAppResource.js';
import { registerGameObjectHandlingPrompt } from './prompts/gameobjectHandlingPrompt.js';
import { registerUnityDashboardPrompt } from './prompts/unityDashboardPrompt.js';
import { registerGetConsoleLogsCompactTool } from './tools/custom/getConsoleLogsCompactTool.js';
import { registerGetScenesHierarchyCompactTool } from './tools/custom/getScenesHierarchyCompactTool.js';
import { registerGetGameObjectCompactTool } from './tools/custom/getGameObjectCompactTool.js';
import { registerCachedLogsResource } from './resources/custom/cachedLogsResource.js';
import { registerCachedHierarchyResource } from './resources/custom/cachedHierarchyResource.js';
import { registerCachedGameObjectResource } from './resources/custom/cachedGameObjectResource.js';
import { registerCompactToolsPrompt } from './prompts/custom/compactToolsPrompt.js';

// Initialize loggers
const serverLogger = new Logger('Server', LogLevel.INFO);
const unityLogger = new Logger('Unity', LogLevel.INFO);
const toolLogger = new Logger('Tools', LogLevel.INFO);
const resourceLogger = new Logger('Resources', LogLevel.INFO);

// Initialize the MCP server
const server = new McpServer (
  {
    name: "MCP Unity Server",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

// Initialize MCP HTTP bridge with Unity editor
const mcpUnity = new McpUnity(unityLogger);

// Register all tools into the MCP server
registerMenuItemTool(server, mcpUnity, toolLogger);
registerSelectGameObjectTool(server, mcpUnity, toolLogger);
registerAddPackageTool(server, mcpUnity, toolLogger);
registerRunTestsTool(server, mcpUnity, toolLogger);
registerSendConsoleLogTool(server, mcpUnity, toolLogger);
registerGetConsoleLogsTool(server, mcpUnity, toolLogger);
registerUpdateComponentTool(server, mcpUnity, toolLogger);
registerAddAssetToSceneTool(server, mcpUnity, toolLogger);
registerUpdateGameObjectTool(server, mcpUnity, toolLogger);
registerCreatePrefabTool(server, mcpUnity, toolLogger);
registerCreateSceneTool(server, mcpUnity, toolLogger);
registerDeleteSceneTool(server, mcpUnity, toolLogger);
registerLoadSceneTool(server, mcpUnity, toolLogger);
registerSaveSceneTool(server, mcpUnity, toolLogger);
registerGetSceneInfoTool(server, mcpUnity, toolLogger);
registerGetPlayModeStatusTool(server, mcpUnity, toolLogger);
registerSetPlayModeStatusTool(server, mcpUnity, toolLogger);
registerShowUnityDashboardTool(server, toolLogger);
registerGetScenesHierarchyTool(server, mcpUnity, toolLogger);
registerUnloadSceneTool(server, mcpUnity, toolLogger);
registerRecompileScriptsTool(server, mcpUnity, toolLogger);
registerGetGameObjectTool(server, mcpUnity, toolLogger);
registerTransformTools(server, mcpUnity, toolLogger);
registerDuplicateGameObjectTool(server, mcpUnity, toolLogger);
registerDeleteGameObjectTool(server, mcpUnity, toolLogger);
registerReparentGameObjectTool(server, mcpUnity, toolLogger);

// Register Material Tools
registerCreateMaterialTool(server, mcpUnity, toolLogger);
registerAssignMaterialTool(server, mcpUnity, toolLogger);
registerModifyMaterialTool(server, mcpUnity, toolLogger);
registerGetMaterialInfoTool(server, mcpUnity, toolLogger);

// Register Batch Execute Tool (high-priority for performance)
registerBatchExecuteTool(server, mcpUnity, toolLogger);

// ========== CUSTOM TOOLS (Fork-specific - Context Optimization) ==========
registerGetConsoleLogsCompactTool(server, mcpUnity, toolLogger);
registerGetScenesHierarchyCompactTool(server, mcpUnity, toolLogger);
registerGetGameObjectCompactTool(server, mcpUnity, toolLogger);
// =======================================================================

// Register all resources into the MCP server
registerGetTestsResource(server, mcpUnity, resourceLogger);
registerGetGameObjectResource(server, mcpUnity, resourceLogger);
registerGetMenuItemsResource(server, mcpUnity, resourceLogger);
registerGetConsoleLogsResource(server, mcpUnity, resourceLogger);
registerGetHierarchyResource(server, mcpUnity, resourceLogger);
registerGetPackagesResource(server, mcpUnity, resourceLogger);
registerGetAssetsResource(server, mcpUnity, resourceLogger);
registerUnityDashboardAppResource(server, resourceLogger);

// ========== CUSTOM RESOURCES (Fork-specific - Context Optimization) ==========
registerCachedLogsResource(server, resourceLogger);
registerCachedHierarchyResource(server, resourceLogger);
registerCachedGameObjectResource(server, resourceLogger);
// ===========================================================================

// Register all prompts into the MCP server
registerGameObjectHandlingPrompt(server);
registerUnityDashboardPrompt(server);
registerCompactToolsPrompt(server);

// Server startup function
async function startServer() {
  try {
    // Initialize STDIO transport for MCP client communication
    const stdioTransport = new StdioServerTransport();
    
    // Connect the server to the transport
    await server.connect(stdioTransport);

    serverLogger.info('MCP Server started');
    
    // Get the client name from the MCP server
    const clientName = server.server.getClientVersion()?.name || 'Unknown MCP Client';
    serverLogger.info(`Connected MCP client: ${clientName}`);
    
    // Start Unity Bridge connection with client name in headers
    await mcpUnity.start(clientName);
    
  } catch (error) {
    serverLogger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Graceful shutdown handler
let isShuttingDown = false;
async function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  try {
    serverLogger.info('Shutting down...');
    await mcpUnity.stop();
    await server.close();
  } catch (error) {
    // Ignore errors during shutdown
  }
  process.exit(0);
}

// Start the server
startServer();

// Handle shutdown signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('SIGHUP', shutdown);

// Handle stdin close (when MCP client disconnects)
process.stdin.on('close', shutdown);
process.stdin.on('end', shutdown);
process.stdin.on('error', shutdown);

// Handle uncaught exceptions - exit cleanly if it's just a closed pipe
process.on('uncaughtException', (error: NodeJS.ErrnoException) => {
  // EPIPE/EOF errors are expected when the MCP client disconnects
  if (error.code === 'EPIPE' || error.code === 'EOF' || error.code === 'ERR_USE_AFTER_CLOSE') {
    shutdown();
    return;
  }
  serverLogger.error('Uncaught exception', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  serverLogger.error('Unhandled rejection', reason);
  process.exit(1);
});
```

- [ ] Update `AGENTS.md` and paste:

```markdown
## MCP Unity — AI Agent Guide (MCP Package)

### Purpose (what this repo is)
**MCP Unity** exposes Unity Editor capabilities to MCP-enabled clients by running:
- **Unity-side “client” (C# Editor scripts)**: a WebSocket server inside the Unity Editor that executes tools/resources.
- **Node-side “server” (TypeScript)**: an MCP stdio server that registers MCP tools/resources and forwards requests to Unity over WebSocket.

### How it works (high-level data flow)
- **MCP client** ⇄ (stdio / MCP SDK) ⇄ **Node server** (`Server~/src/index.ts`)
- **Node server** ⇄ (WebSocket JSON-RPC-ish) ⇄ **Unity Editor** (`Editor/UnityBridge/McpUnityServer.cs` + `McpUnitySocketHandler.cs`)
- **Tool/Resource names must match exactly** across Node and Unity (typically `lower_snake_case`).

### Key defaults & invariants
- **Unity WebSocket endpoint**: `ws://localhost:8090/McpUnity` by default.
- **Config file**: `ProjectSettings/McpUnitySettings.json` (written/read by Unity; read opportunistically by Node).
- **Execution thread**: Tool/resource execution is dispatched via `EditorCoroutineUtility` and runs on the **Unity main thread**. Keep synchronous work short; use async patterns for long work.

### Repo layout (where to change what)
```
/
├── Editor/                       # Unity Editor package code (C#)
│   ├── Tools/                    # Tools (inherit McpToolBase)
│   ├── Resources/                # Resources (inherit McpResourceBase)
│   ├── UnityBridge/              # WebSocket server + message routing
│   ├── Services/                 # Test/log services used by tools/resources
│   └── Utils/                    # Shared helpers (config, logging, workspace integration)
├── Server~/                      # Node MCP server (TypeScript, ESM)
│   ├── src/index.ts              # Registers tools/resources/prompts with MCP SDK
│   ├── src/tools/                # MCP tool definitions (zod schema + handler)
│   ├── src/resources/            # MCP resource definitions
│   └── src/unity/mcpUnity.ts      # WebSocket client that talks to Unity
└── server.json                   # MCP registry metadata (name/version/package)
```

### Quickstart (local dev)
- **Unity side**
  - Open the Unity project that has this package installed.
  - Ensure the server is running (auto-start is controlled by `McpUnitySettings.AutoStartServer`).
  - Settings persist in `ProjectSettings/McpUnitySettings.json`.

- **Node side (build)**
  - `cd Server~ && npm run build`
  - The MCP entrypoint is `Server~/build/index.js` (published as an MCP stdio server).

- **Node side (debug/inspect)**
  - `cd Server~ && npm run inspector` to use the MCP Inspector.

### Configuration (Unity ↔ Node bridge)
The Unity settings file is the shared contract:
- **Path**: `ProjectSettings/McpUnitySettings.json`
- **Fields**
  - **Port** (default **8090**): Unity WebSocket server port.
  - **RequestTimeoutSeconds** (default **10**): Node request timeout (Node reads this if the settings file is discoverable).
  - **AllowRemoteConnections** (default **false**): Unity binds to `0.0.0.0` when enabled; otherwise `localhost`.
  - **EnableInfoLogs**: Unity console logging verbosity.
  - **NpmExecutablePath**: optional npm path for Unity-driven install/build.

Node reads config from `../ProjectSettings/McpUnitySettings.json` relative to **its current working directory**. If not found, Node falls back to:
- **host**: `localhost`
- **port**: `8090`
- **timeout**: `10s`

**Remote connection note**:
- If Unity is on another machine, set `AllowRemoteConnections=true` in Unity and set `UNITY_HOST=<unity_machine_ip_or_hostname>` for the Node process.

### Adding a new capability

### Add a tool
1. **Unity (C#)**
   - Add `Editor/Tools/<YourTool>Tool.cs` inheriting `McpToolBase`.
   - Set `Name` to the MCP tool name (recommended: `lower_snake_case`).
   - Implement:
     - `Execute(JObject parameters)` for synchronous work, or
     - set `IsAsync = true` and implement `ExecuteAsync(JObject parameters, TaskCompletionSource<JObject> tcs)` for long-running operations.
   - Register it in `Editor/UnityBridge/McpUnityServer.cs` (`RegisterTools()`).

2. **Node (TypeScript)**
   - Add `Server~/src/tools/<yourTool>Tool.ts`.
   - Register the tool in `Server~/src/index.ts`.
   - Use a zod schema for params; forward to Unity using the same `method` string:
     - `mcpUnity.sendRequest({ method: toolName, params: {...} })`

3. **Build**
   - `cd Server~ && npm run build`

### Add a resource
1. **Unity (C#)**
   - Add `Editor/Resources/<YourResource>Resource.cs` inheriting `McpResourceBase`.
   - Set `Name` (method string) and `Uri` (e.g. `unity://...`).
   - Implement `Fetch(...)` or `FetchAsync(...)`.
   - Register in `Editor/UnityBridge/McpUnityServer.cs` (`RegisterResources()`).

2. **Node (TypeScript)**
   - Add `Server~/src/resources/<yourResource>.ts`, register in `Server~/src/index.ts`.
   - Forward to Unity via `mcpUnity.sendRequest({ method: resourceName, params: {} })`.

### Logging & debugging
- **Unity**
  - Uses `McpUnity.Utils.McpLogger` (info logs gated by `EnableInfoLogs`).
  - Connection lifecycle is managed in `Editor/UnityBridge/McpUnityServer.cs` (domain reload & playmode transitions stop/restart the server).

- **Node**
  - Logging is controlled by env vars:
    - `LOGGING=true` enables console logging.
    - `LOGGING_FILE=true` writes `log.txt` in the Node process working directory.

### Common pitfalls
- **Port mismatch**: Unity default is **8090**; update docs/config if you change it.
- **Name mismatch**: Node `toolName`/`resourceName` must equal Unity `Name` exactly, or Unity responds `unknown_method`.
- **Long main-thread work**: synchronous `Execute()` blocks the Unity editor; use async patterns for heavy operations.
- **Remote connections**: Unity must bind `0.0.0.0` (`AllowRemoteConnections=true`) and Node must target the correct host (`UNITY_HOST`).
- **Unity domain reload**: the server stops during script reloads and may restart; avoid relying on persistent in-memory state across reloads.
- **Multiplayer Play Mode**: Clone instances automatically skip server startup; only the main editor hosts the MCP server.

### Release/version bump checklist
- Update versions consistently:
  - Unity package `package.json` (`version`)
  - Node server `Server~/package.json` (`version`)
  - MCP registry `server.json` (`version` + npm identifier/version)
- Rebuild Node output: `cd Server~ && npm run build`

### Available tools (current)
- `execute_menu_item` — Execute Unity menu items
- `select_gameobject` — Select GameObjects in hierarchy
- `update_gameobject` — Update or create GameObject properties
- `update_component` — Update or add components on GameObjects
- `add_package` — Install packages via Package Manager
- `run_tests` — Run Unity Test Runner tests
- `send_console_log` — Send logs to Unity console
- `add_asset_to_scene` — Add assets to scene
- `create_prefab` — Create prefabs with optional scripts
- `create_scene` — Create and save new scenes
- `load_scene` — Load scenes (single or additive)
- `delete_scene` — Delete scenes and remove from Build Settings
- `save_scene` — Save current scene (with optional Save As)
- `get_scene_info` — Get active scene info and loaded scenes list
- `get_play_mode_status` — Get Unity play mode status (isPlaying, isPaused)
- `set_play_mode_status` — Control Unity play mode (play, pause, stop, step)
- `unload_scene` — Unload scene from hierarchy
- `get_gameobject` — Get detailed GameObject info
- `get_console_logs` — Retrieve Unity console logs
- `recompile_scripts` — Recompile all project scripts
- `duplicate_gameobject` — Duplicate GameObjects with optional rename/reparent
- `delete_gameobject` — Delete GameObjects from scene
- `reparent_gameobject` — Change GameObject parent in hierarchy
- `create_material` — Create materials with specified shader
- `assign_material` — Assign materials to Renderer components
- `modify_material` — Modify material properties (colors, floats, textures)
- `get_material_info` — Get material details including all properties
- `get_console_logs_compact` — Compact console logs with summary and cached details
- `get_scenes_hierarchy_compact` — Compact scene hierarchy with summary and cached details
- `get_gameobject_compact` — Compact GameObject details with cached full output

### Available apps (current)
- `show_unity_dashboard` — Open the Unity dashboard MCP App in VS Code

### Available resources (current)
- `unity://menu-items` — List of available menu items
- `unity://scenes-hierarchy` — Current scene hierarchy
- `unity://gameobject/{id}` — GameObject details by ID or path
- `unity://logs` — Unity console logs
- `unity://packages` — Installed and available packages
- `unity://assets` — Asset database information
- `unity://tests/{testMode}` — Test Runner test information
- `unity://ui/dashboard` — Unity dashboard MCP App UI
- `unity://logs/cached/{sessionId}` — Cached console logs from compact tool
- `unity://hierarchy/cached/{hierarchyId}` — Cached scene hierarchy from compact tool
- `unity://gameobject/cached/{cacheId}` — Cached GameObject details from compact tool

### Available prompts (current)
- `unity_dashboard` — Opens Unity dashboard MCP app with guided information about features
- `gameobject_handling_strategy` — Provides structured workflow for GameObject operations
- `unity_compact_tools` — Guidance on compact tool usage and when to request full data

### Update policy (for agents)
- Update this file when:
  - tools/resources/prompts are added/removed/renamed,
  - config shape or default ports/paths change,
  - the bridge protocol changes (request/response contract).
- Keep it **high-signal**: where to edit code, how to run/build/debug, and the invariants that prevent subtle breakage.
```

##### Step 4 Verification Checklist
- [ ] `cd Server~ && npm run build` completes without errors
- [ ] MCP server starts and registers `get_console_logs_compact`, `get_scenes_hierarchy_compact`, `get_gameobject_compact`
- [ ] `unity_compact_tools` prompt appears in the MCP client prompt list

#### Step 4 STOP & COMMIT
**STOP & COMMIT:** Agent must stop here and wait for the user to test, stage, and commit the change.
