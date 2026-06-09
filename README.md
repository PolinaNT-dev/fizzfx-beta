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
