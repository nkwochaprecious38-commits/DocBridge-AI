# DocBridge

AI document intelligence platform. Next.js 15, React 19, TypeScript, Tailwind CSS, Supabase (Auth, Postgres, Storage), Recharts, Anthropic API.

## Setup (about 10 minutes)

1. **Create a Supabase project** at supabase.com.
2. **Run the schema.** Paste `supabase/migrations/0001_init.sql` into the Supabase SQL editor and run it. It creates all tables, row level security policies, the private `documents` storage bucket with policies, the signup bootstrap trigger, search and team functions.
3. **Authentication settings** (Supabase dashboard, Authentication):
   * Providers: Email enabled. Leave "Confirm email" on to require email verification (supported by the app), or turn it off for instant sign in.
   * URL Configuration: set Site URL to your deployed URL (for local work `http://localhost:3000`) and add `https://YOUR_DOMAIN/auth/callback` (and `http://localhost:3000/auth/callback`) to Redirect URLs. Email verification and password reset links depend on this.
   * For production email delivery, configure a custom SMTP provider (Supabase's default sender is heavily rate limited).
4. **Environment variables.** Copy `.env.example` to `.env.local` and fill in:
   | Variable | Purpose | Required |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth, database, storage (anon key is public by design; data is protected by row level security) | Yes |
   | `ANTHROPIC_API_KEY` | Server only. Summaries, classification, extraction, OCR for scanned PDFs and images, chat, comparison, splitting | For AI features |
   | `ANTHROPIC_MODEL` | Defaults to `claude-sonnet-5-5` | No |
   | `LLAMA_CLOUD_API_KEY` | Optional LlamaParse for legacy DOC, XLS, PPT and as an OCR alternative | No |
5. `npm install && npm run dev`, then open `/signup`.

The service role key is never used by this app. Do not add it to frontend code.

## What works without any AI key
Sign up and login, uploads, text parsing of PDF (with embedded text), DOCX, XLSX, XLS, PPTX, TXT, CSV, page level indexing, keyword search, categories (keyword rule classification), document workspace, team management, workflows (steps that need extraction are skipped). Scanned PDFs, images, legacy formats, AI summaries, extraction, chat, comparison and splitting need the keys above, and show clear messages when missing.

## Architecture
* `app/(site)`: marketing pages. `app/(auth)`: signup, login, forgot and reset password. `app/auth/callback`: email link handler. `middleware.ts`: refreshes sessions and protects `/dashboard` and `/api/app`.
* `app/dashboard/*`: 14 sections plus the per document workspace. Reads use the signed in user's Supabase client, so row level security applies to every query. There is no service role bypass.
* `app/api/app/*`: protected endpoints (upload and process, file streaming, assistant, search, compare, split, extract, export).
* `lib/pipeline.ts`: parse, store pages, classify, summarize, extract, then run matching workflows. Each stage is recorded in `agent_runs` and `processing_jobs`.
* `lib/workflows.ts`: step executor with a pause for human approval (approval tasks resume or reject the run).
* Retrieval: Postgres full text search over page text (`search_pages`). The assistant answers only from retrieved passages, requires quotes with source and page, checks each quote against the passage, labels interpretation separately, and returns "not found" without calling the model when nothing is retrieved. Semantic mode expands the query with AI generated related terms.
* Security: organization separated data and roles (owner, admin, member, viewer) enforced in the database; private storage bucket with per organization folder policies; originals are streamed through an authenticated route, never exposed by public URL; audit log; JSON export; owner only delete all; `retention_days` per organization.

## Retention
Set the retention window in Settings. To enforce it, schedule the purge function in Supabase (pg_cron):
```sql
select cron.schedule('docbridge_retention', '0 3 * * *', 'select public.purge_expired_documents()');
```
This deletes document rows. Stored files for purged rows need a storage cleanup job (for example a scheduled Edge Function listing objects with no matching document). Deletions made through the app also remove the stored file.

## Pricing and Selar
Prices were read live from the three Selar pages: Starter $47 per month, Professional $57 per month, Enterprise $97 per month. Limits and feature bullets are placeholders in `lib/plans.ts`. Subscribe buttons open the exact checkout URLs in a new tab.

**Payment hook (migration `0002_selar.sql` plus `/api/webhooks/selar`).**
1. Run `supabase/migrations/0002_selar.sql` in the SQL editor.
2. Set a secret once: `insert into app_private.settings (key, value) values ('selar_webhook_secret', 'LONG_RANDOM_STRING') on conflict (key) do update set value = excluded.value;`
3. In Selar, add a webhook pointing to `https://YOUR_DOMAIN/api/webhooks/selar?secret=LONG_RANDOM_STRING`.
4. A payment activates the plan on the workspace owned by the account whose email matches the buyer email, so buyers must check out with their DocBridge email. The plan is detected from the checkout link slug, or the amount (47, 57, 97). Cancel, expire or refund events mark it cancelled. The Settings page shows the current plan.

Every authorized delivery is stored in `app_private.selar_events` with its outcome (applied, no_account, unknown_plan), so mismatches are visible. The function is tested against Postgres (secret check, matching, upgrade, unmatched cases). Selar's real payload format is not documented publicly, so the field mapping is a best effort: send one test purchase and check `selar_events`. Adjust `app/api/webhooks/selar/route.ts` if the fields differ. Plan limits are not enforced by the app yet.

## Integrations status (honest)
| Integration | Status |
|---|---|
| Supabase Auth, Postgres, Storage | Implemented, requires your project |
| Anthropic API (language model, vision OCR) | Implemented, requires key |
| LlamaParse | Implemented as optional parser, **untested** against the live service |
| Google Drive, SharePoint, OneDrive, Dropbox, S3, GCS | Not built. Settings shows them as not configured |
| External vector database | Not connected. The `document_embeddings` table (pgvector) is provisioned for it |

## Replacing the logo
`components/Logo.tsx` and `public/logo.svg`, `public/favicon.svg` hold a neutral placeholder mark. Swap those three files when your final logo is ready.

## Testing performed
* Production build and type check pass.
* Migration applied to a real PostgreSQL 16 with stubbed Supabase auth and storage schemas. Verified: signup bootstrap, cross organization isolation, viewer read only, admin only audit access, member management, full text search.
* Parsing verified on generated PDF (per page), DOCX, XLSX, PPTX, TXT, CSV. OCR and legacy formats return actionable errors without keys.
* Browser tests (Playwright): all public pages, navigation, mobile menu, footer text, Selar links and order, no dashes or emoji in visible text, protected route redirects, form validation, 15 dashboard pages and workspace tabs against a mock Supabase API, mobile overflow checks.
* **Not tested:** real Supabase Auth round trips (email delivery, verification and reset links), real storage uploads, and any call to Anthropic or LlamaParse. These need your credentials. Follow Setup, then sign up and upload a file to confirm end to end.
