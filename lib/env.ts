function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  AUTH_SECRET: required("AUTH_SECRET"),
  AUTH_GOOGLE_ID: required("AUTH_GOOGLE_ID"),
  AUTH_GOOGLE_SECRET: required("AUTH_GOOGLE_SECRET"),
};
