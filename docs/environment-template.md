# Environment Template

Copy these keys into your deployment platform’s secret manager. The placeholders below are intentionally non-functional and safe to commit.

```dotenv
# Next.js browser configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key

# Next.js server-only configuration
PATHPILOT_API_URL=https://api.your-domain.example

# FastAPI server-only configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-server-supabase-key
PATHPILOT_AI_PROVIDER=structured-provider-name
PATHPILOT_AI_API_KEY=your-server-ai-key
```

> Do not commit a real `.env` file, service role key, JWT signing key, or AI provider key. Enable Supabase row-level security before exposing browser credentials.
