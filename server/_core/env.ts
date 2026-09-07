export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: process.env.NODE_ENV === "production",
  llmApiBaseUrl:
    configuredValue("LLM_API_BASE_URL", "OPENAI_BASE_URL") ||
    "https://api.openai.com",
  llmApiKey: configuredValue("LLM_API_KEY", "OPENAI_API_KEY"),
  llmModel: configuredValue("LLM_MODEL", "OPENAI_MODEL") || "gpt-5-mini",
  ownerNotificationWebhookUrl: configuredValue(
    "OWNER_NOTIFICATION_WEBHOOK_URL"
  ),
  ownerNotificationWebhookSecret: configuredValue(
    "OWNER_NOTIFICATION_WEBHOOK_SECRET"
  ),
  storagePublicBaseUrl: configuredValue("STORAGE_PUBLIC_BASE_URL"),
};

function configuredValue(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
}
