# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub Issues.**

Doing so could expose the vulnerability to malicious actors before it can be
fixed and affect all users of the system.

### How to Report

1. Go to the repository's **Security** tab on GitHub.
2. Click **"Report a vulnerability"** to open a private security advisory.
3. Provide the following information:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact (e.g., data exposure, authentication bypass)
   - Affected component (Web API, Auth, Database policies, Android)
   - Any suggested fix if you have one

Alternatively, if you cannot use GitHub's private advisory system, describe
the issue in general terms in a public Issue and a maintainer will contact you
privately to collect details.

### What to Expect

- We will acknowledge receipt within **3 business days**.
- We will investigate and provide a status update within **7 business days**.
- We will coordinate a fix and disclosure timeline with you.
- Credit will be given in the security advisory and CHANGELOG unless you
  prefer to remain anonymous.

---

## Scope

The following are in scope for security reports:

- **Web Platform** (`web/site`):
  - Authentication bypass or session hijacking
  - Authorization failures (accessing another user's data)
  - SQL injection or RLS bypass in Supabase queries
  - Server-Side Request Forgery (SSRF)
  - Exposed secrets or API keys in committed code
  - Insecure direct object references

- **Android App** (`app/`):
  - Sensitive data exposure in logs or local storage
  - Insecure network communication
  - Authentication bypass

### Out of Scope

- Issues in third-party dependencies (report to those projects directly)
- Social engineering attacks
- Physical attacks
- Denial of service without exploitable vulnerability

---

## Credential Rotation

If a secret (API key, service role key, database password) has been
accidentally committed to this repository:

1. Report it immediately via the private advisory process above.
2. We will rotate the credential immediately — the commit history is secondary.
3. After rotation, we will address Git history cleanup.

**Do not attempt to access or use any leaked credentials.**

---

## Security Architecture Notes

- Supabase Row-Level Security (RLS) is enforced at the database layer for all
  authenticated operations.
- Service role keys are server-side only and never exposed to the browser.
- All student submission writes are gated through the `save_student_submission`
  SECURITY DEFINER RPC, which enforces attempt limits and ownership checks.
- Google OAuth is the primary external authentication provider; sessions are
  managed by Supabase Auth.
- For a comprehensive technical audit of all 13 security controls, RLS policies,
  and advisory locks, see **[docs/SECURITY.md](docs/SECURITY.md)**.
