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
