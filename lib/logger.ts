export type LogExtra = Record<string, unknown>;

type LogOptions = {
  onceKey?: string;
};

const seenLogKeys = new Set<string>();
const isProduction = process.env.NODE_ENV === "production";
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
const MAX_STACK_LINES = 8;

function truncateStack(stack: string | undefined): string | undefined {
  if (!stack) {
    return undefined;
  }

  const lines = stack.split("\n");
  if (lines.length <= MAX_STACK_LINES) {
    return stack;
  }

  return `${lines.slice(0, MAX_STACK_LINES).join("\n")}\n...stack truncated`;
}

function toErrorObject(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: isProduction ? undefined : truncateStack(error.stack),
      cause: error.cause ? toErrorObject(error.cause) : undefined,
    };
  }

  if (typeof error === "object" && error !== null) {
    return { ...error };
  }

  return {
    value: String(error),
  };
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unexpected server error.";
}

export function logServerError(
  context: string,
  error: unknown,
  extra: LogExtra = {},
  options: LogOptions = {},
) {
  if (isBuildPhase) {
    return;
  }

  if (options.onceKey) {
    if (seenLogKeys.has(options.onceKey)) {
      return;
    }

    seenLogKeys.add(options.onceKey);
  }

  const payload = {
    level: "error",
    context,
    timestamp: new Date().toISOString(),
    ...extra,
    error: toErrorObject(error),
  };

  console.error("[server-error]", JSON.stringify(payload));
}
