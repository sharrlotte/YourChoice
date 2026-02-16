const AUTH_REQUIRED_ENV_VARS = [
  "AUTH_SECRET",
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
] as const;

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optional(name: string): string | undefined {
  return process.env[name] || undefined;
}

export function getMissingEnvVars(names: readonly string[]): string[] {
  return names.filter((name) => !process.env[name]);
}

export function getMissingAuthEnvVars(): string[] {
  return getMissingEnvVars(AUTH_REQUIRED_ENV_VARS);
}

export function getAuthEnvOrThrow() {
  return {
    AUTH_SECRET: required("AUTH_SECRET"),
    AUTH_GOOGLE_ID: required("AUTH_GOOGLE_ID"),
    AUTH_GOOGLE_SECRET: required("AUTH_GOOGLE_SECRET"),
  };
}

export const env = {
  DATABASE_URL: optional("DATABASE_URL"),
};
