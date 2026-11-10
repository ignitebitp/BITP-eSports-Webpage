# BITPeSports Website

Next.js App Router website with a small Prisma-backed content manager. Frontend pages and components live in `src/app`, `src/components`, `src/context`, and `src/data`; backend library services live in `src/lib`, and the PostgreSQL schema lives in `prisma/schema.prisma`. Public pages read events, teams, rosters, committee members, matches, weekly activities, and results from the database. Club administrators manage content at `/admin`.

## Local setup

Requirements: Node.js 20.9 or later and npm.

```bash
npm ci
cp .env.example .env
```

Follow the production setup below to get the Prisma Postgres connection string and put it in `DATABASE_URL` in `.env`. Keep `.env` private; it is ignored by Git.

```bash
npm run db:generate
npm run db:push
```

Set `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD` (14–72 UTF-8 bytes), and `ADMIN_ROLE=OWNER` in `.env` temporarily, then run:

```bash
npm run admin:create
```

Remove `ADMIN_PASSWORD` from `.env` after provisioning. To promote an existing account through the trusted CLI, use its email and set `ADMIN_ROLE=OWNER`; this invalidates its existing sessions.

Start the site with `npm run dev`, then sign in at [http://localhost:3000/admin](http://localhost:3000/admin).

## Production setup (new Vercel account + Prisma Postgres)

The Next.js app includes its backend API routes, so deploy the whole application to Vercel. For a completely separate deployment under a different owner, create a new Vercel project and a new Prisma Postgres database under that owner’s accounts. Transferring the GitHub repository does not transfer the existing Vercel project or Prisma database. No separate Render service is needed.

### 1. Create a new Prisma Postgres database

1. Sign in to [Prisma Console](https://console.prisma.io/) using the new owner’s account and create a new Prisma Postgres database.
2. Copy its PostgreSQL connection string and configure it as `DATABASE_URL` locally and in the new Vercel project. Treat it as a password; never commit it, expose it in frontend code, or paste it in chat.
3. The new database starts empty. Existing content in another Prisma database is not copied automatically. To retain that content, back it up and migrate it separately before switching production traffic.

### 2. Create the database tables and initial Owner account

On your development computer, put the new database connection string in the ignored root `.env`:

```dotenv
DATABASE_URL="paste-the-connection-string-here"
```

From the repository root, create the tables:

```bash
npm ci
npm run db:generate
npm run db:push
```

Then temporarily add `ADMIN_EMAIL`, `ADMIN_NAME`, `ADMIN_PASSWORD`, and `ADMIN_ROLE=OWNER` to `.env` and run `npm run admin:create`. Use a unique password of at least 14 characters and no more than 72 UTF-8 bytes. Remove `ADMIN_PASSWORD` when the account is created. The initial database has no content records; add them after signing in at `/admin`.

### 3. Import the GitHub repository into Vercel

In the new owner’s Vercel account, select **Add New → Project** and import the transferred GitHub repository. Configure the project from the repository root—the directory containing `package.json` and `package-lock.json`:

- **Framework Preset:** Next.js
- **Root Directory:** repository root (`.` or blank)
- **Install Command:** default (`npm ci`)
- **Build Command:** default (`npm run build`)
- **Output Directory:** default

### 4. Add server environment variables in Vercel

In **Project → Settings → Environment Variables**, add the following to **Production**. Add values to **Preview** only when previews should use them; use a separate preview database where possible.

| Name | Value |
| --- | --- |
| `DATABASE_URL` | New owner’s Prisma Postgres connection string |
| `ADMIN_JWT_SECRET` | New random secret, at least 32 characters. Generate locally with `openssl rand -base64 48`; do not reuse the old deployment’s secret. |
| `APP_BASE_URL` | New deployment’s HTTPS origin, e.g. `https://your-project.vercel.app` (no trailing path). |
| `RESEND_API_KEY` | Resend API key; required for invitations and password resets. |
| `AUTH_FROM_EMAIL` | Sender on a domain verified in Resend, e.g. `BITPeSports <accounts@your-domain.example>`. |

The Prisma database connection strings and `ADMIN_JWT_SECRET` must remain server-only. Never prefix them with `NEXT_PUBLIC_`.

### 5. Configure email with Resend (not SMTP)

This application sends email through the Resend HTTP API. **SMTP host, port, username, and password settings are not used.**

1. In the [Resend Dashboard](https://resend.com/), open **Domains → Add Domain** and add a domain or subdomain controlled by the new owner.
2. Add Resend’s DNS records at the domain’s DNS provider and wait for verification.
3. Create a Resend API key and add it to Vercel as `RESEND_API_KEY`.
4. Set `AUTH_FROM_EMAIL` to an address on the verified domain. Invitations and password resets use this sender.

For contact-form email notifications, also set `CONTACT_FROM_EMAIL` (verified sender) and `CONTACT_TO_EMAIL` (club inbox). Contact submissions are stored in the database even when email notifications are not configured.

### 6. Deploy and sign in

Save the project settings and environment variables, then deploy the latest commit from `main`. Check the build log to confirm the install command runs `npm ci` from the repository root and the build succeeds. Visit the deployment’s `/` and `/admin` routes. Sign in with the initial Owner credentials created in step 2, then invite other users from **User accounts**; do not share the Owner password.

## Content manager

The authenticated admin panel supports content management for events, game divisions, team rosters, committee members, achievements, matches, weekly activities, and competition results. It also provides a private contact inbox and an activity log that records the signed-in administrator's display name and email for content changes. Administrators can edit their own profile name and change their password. Owners can invite users and assign roles; invitations and forgotten-password links are single-use and expire after 30 minutes. Users can also change their password after signing in.

Events support an optional JPEG, PNG, or WebP poster up to 4 MB. The recommended image size is 1440×1350 pixels; other dimensions are accepted and displayed in the poster frame. Posters are stored in PostgreSQL alongside event records, so include the database in backups. Event descriptions preserve entered line breaks on public pages.

The **Committee & members** section manages the About page team sections. Choose a section (President, Core Executive, Senior Coordinator, or Junior Coordinator) separately from the person’s post, so Core Executive members can have different posts. Core Executive profiles are displayed together as static cards, with the Manager first; coordinator sections use manual carousels. Add the person’s photo (JPEG, PNG, or WebP, up to 4 MB), name, and roll number; uploaded photos are stored in PostgreSQL with the committee record. The current About page also includes frontend-local committee portraits in `public/resources/people`.

To add a user, sign in at `/admin` as an `OWNER` or `ADMIN`, open **User accounts**, enter only the person's email address, choose a role if you are an Owner (Admins can only invite Moderators), and select **Send invitation**. Invitation email must be configured with Resend. The person follows the single-use email link to choose their own display name, unique username, and password. They can sign in using either their email or username. Admins can change their display name and username under **My profile**; activity records identify the username.

Roles are enforced by server-side API authorization. `MODERATOR` can create, edit, and delete site content but cannot access the contact inbox or manage accounts. `ADMIN` has Moderator permissions, can access the contact inbox, invite Moderator accounts, and delete Moderator accounts; Admins cannot create, edit, delete, or change the roles/status of Admin or Owner accounts. `OWNER` can manage all content, inbox data, users, and roles. At least one active Owner must remain. Existing `EDITOR` accounts are migrated to `MODERATOR` when `npm run db:push` runs. Login, invitations, password changes, and reset flows use database-backed rate limits shared across serverless instances; reset links are single-use, expire after 30 minutes, and requesting a new reset link invalidates previous unused reset links.

## Frontend image assets

Frontend images are stored locally under `public/resources` and served from `/resources/...`; the site does not fetch the displayed photos or game artwork from remote image hosts. Committee portraits used by the About page are under `public/resources/people`. Add future frontend image assets to this folder and reference them with a `/resources/...` path.

Public content endpoints are read-only. All content mutations use same-origin admin API routes protected by the signed, HTTP-only admin session cookie. Contact submissions are saved in the database and are not publicly readable.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Prisma Postgres connection string (`postgres://...` or `postgresql://...`). |
| `ADMIN_JWT_SECRET` | Yes | Random session-signing secret, at least 32 characters. Use a different secret per environment. |
| `ADMIN_EMAIL` | Only when creating an admin | Initial administrator email. Do not leave bootstrap values configured after setup. |
| `ADMIN_NAME` | Only when creating an admin | Initial administrator display name. |
| `ADMIN_PASSWORD` | Only when creating an admin | Initial password, 14–72 UTF-8 bytes; remove after account creation. |
| `ADMIN_ROLE` | Only when provisioning/promoting through CLI | `OWNER`, `ADMIN`, or `MODERATOR`; defaults to `OWNER`. |
| `RESEND_API_KEY` | Required for invitations/reset links; optional otherwise | Resend API credential. |
| `AUTH_FROM_EMAIL` | Required for invitations/reset links | Verified Resend sender for account emails. Falls back to `CONTACT_FROM_EMAIL`. |
| `APP_BASE_URL` | Required for invitations/reset links | Public HTTPS URL used to generate password links, e.g. `https://club.example.org`. |
| `CONTACT_FROM_EMAIL` | Optional with Resend | Verified sender address for contact notifications and as a fallback account sender. |
| `CONTACT_TO_EMAIL` | Optional with Resend | Club inbox receiving notifications. |

If contact-notification settings are absent, contact messages remain stored in the admin inbox. Do not enable user invitations or rely on reset links until `RESEND_API_KEY`, `AUTH_FROM_EMAIL` (or `CONTACT_FROM_EMAIL`), and `APP_BASE_URL` are configured.

## Database and operations

The application uses Prisma Postgres. Set `DATABASE_URL` in the Vercel project’s production environment and in the ignored local `.env` for local development. Do not commit or paste the connection string into source control.

The Prisma schema is `prisma/schema.prisma`. Run `npm run db:generate`, then review and apply the schema with `npm run db:push`. Run the schema push only after configuring `DATABASE_URL` to the intended database; back up production data before future schema changes. A newly created database starts empty, so provision an Owner account and add public content through the admin panel.

## Security and deployment

- Admin passwords are bcrypt-hashed; session tokens are signed, short-lived, HTTP-only, SameSite cookies with Secure enabled in production. Role, account-active state, and auth-version are rechecked against the database on every protected request.
- Reset/invitation tokens are cryptographically random, stored only as hashes, single-use, expire after 30 minutes, and revoke existing sessions after a password update.
- Admin APIs enforce server-side authorization, body size limits, field validation, safe errors, and same-origin checks for mutations.
- Login and public contact endpoints are rate-limited. Contact submissions have length/email checks and short-window duplicate protection.
- Security response headers include MIME sniffing and framing protections, a restrictive referrer policy, permissions policy, and production HSTS. No cross-origin API access is enabled.
- Contact messages can include personal information; restrict admin access and database/backups accordingly.
- A content security policy is not configured because the existing frontend uses inline styles and externally hosted fonts; add one only after testing a policy against the deployed site.
- Configure HTTPS at the hosting platform/reverse proxy. Ensure its proxy overwrites forwarding headers used for client IP rate limiting.

## Checks

```bash
npm run typecheck
npm run lint
npm run build
```
