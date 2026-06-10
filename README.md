# FizzFX Beta

This repository contains the obfuscated/minified FizzFX beta build.
Source files are intentionally not included.

Cloudflare Pages:
- Build command: `exit 0`
- Build output directory: `public`

Access control:
- Cloudflare Pages Functions protect the editor behind Supabase email/password auth.
- Login stores HttpOnly session cookies and refreshes sessions server-side.
- Configure these Cloudflare environment variables before deployment:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`

License API:
- /api/license verifies a Supabase bearer token for desktop access.
- Without SUPABASE_LICENSE_TABLE, the API runs in auth-only mode.
- With SUPABASE_LICENSE_TABLE, create rows with user_id or email, status, and optional expires_at.
- Active statuses: active, trial, beta.
- Optional Cloudflare variable: SUPABASE_SERVICE_ROLE_KEY for server-side license table reads.

Desktop download page:
- Public page: /download.html
- Download endpoint: /download/windows
- Configure Cloudflare variable FIZZFX_WINDOWS_INSTALLER_URL with the hosted Windows installer URL.
- Do not commit installer .exe files to this repository; Cloudflare Pages static assets are limited to 25 MiB per file.
