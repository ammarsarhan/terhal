# Terhal

pnpm workspace + Turborepo.

```
backend/   Hono API + BullMQ worker + Prisma (Render, Neon Postgres)
web/       Next.js: the customer site, the staff dashboard and the admin panel, one host each (Vercel)
```

## Hosts

Each audience gets its own origin, so a bug on one site can't act on another. `web/proxy.ts` maps each host onto its
section of the app (`app/site`, `app/staff`, `app/admin`), and the API only accepts each audience's routes from its own
origin.

|          | Local                                 | Staging                               | Production                    |
| -------- | ------------------------------------- | ------------------------------------- | ----------------------------- |
| Customer | `https://local.terhal.co:3000`        | `https://staging.terhal.co`           | `https://terhal.co`           |
| Staff    | `https://dashboard.local.terhal.co:3000` | `https://dashboard.staging.terhal.co` | `https://dashboard.terhal.co` |
| Admin    | `https://admin.local.terhal.co:3000`  | `https://admin.staging.terhal.co`     | `https://admin.terhal.co`     |
| API      | `https://api.local.terhal.co:8080`    | `https://api.staging.terhal.co`       | `https://api.terhal.co`       |

## Local development

Locally everything runs over https on `local.terhal.co` and its subdomains, mirroring production. Plain `localhost`
doesn't work: browsers treat `admin.localhost` and `localhost` as different sites, so they drop the API's `SameSite=Lax`
auth cookies. The frontends and the API have to share a registrable domain, as they do in production. `.co` doesn't force
https the way `.app` does, but the cookies are `Secure`, so local development runs on https too.

### One-time setup

**1. Point the local hostnames at your machine** by adding these lines to your hosts file:

```
127.0.0.1 local.terhal.co
127.0.0.1 dashboard.local.terhal.co
127.0.0.1 admin.local.terhal.co
127.0.0.1 api.local.terhal.co
```

macOS / Linux, the file is `/etc/hosts`:

```sh
printf '127.0.0.1 %s\n' local.terhal.co dashboard.local.terhal.co admin.local.terhal.co api.local.terhal.co | sudo tee -a /etc/hosts
```

Windows, the file is `C:\Windows\System32\drivers\etc\hosts`. In PowerShell run as Administrator:

```powershell
"local.terhal.co", "dashboard.local.terhal.co", "admin.local.terhal.co", "api.local.terhal.co" | ForEach-Object { Add-Content -Path "$env:SystemRoot\System32\drivers\etc\hosts" -Value "127.0.0.1 $_" }
```

**2. Create trusted certificates with [mkcert](https://github.com/FiloSottile/mkcert).** `mkcert -install` adds a local
certificate authority to your system's trust store, so browsers trust certificates it creates. Run it once per machine.
The certificate names `local.terhal.co` as well as the wildcard, since a wildcard doesn't cover the name it's under.

macOS / Linux:

```sh
brew install mkcert              # Linux without Homebrew: see the mkcert README
mkcert -install
mkdir -p .certs && mkcert -cert-file .certs/local.pem -key-file .certs/local-key.pem local.terhal.co "*.local.terhal.co"
```

Windows (PowerShell, from the repo root):

```powershell
choco install mkcert             # or: scoop bucket add extras; scoop install mkcert
mkcert -install
New-Item -ItemType Directory -Force .certs | Out-Null; mkcert -cert-file .certs/local.pem -key-file .certs/local-key.pem local.terhal.co "*.local.terhal.co"
```

`.certs/` is git-ignored. Firefox keeps its own trust store: on macOS / Linux install `nss` (`brew install nss`) before
`mkcert -install`.

### Running

```sh
pnpm install
docker compose up -d                 # Postgres on :5432, cache Redis on :6379, queue Redis on :6380
cp backend/.env.example backend/.env # then set ADMIN_SECRET and TOTP_ENCRYPTION_KEY: openssl rand -base64 32
cp web/.env.example web/.env.local
pnpm --filter @terhal/backend db:deploy

pnpm dev                             # backend server + web
pnpm --filter @terhal/backend dev:worker
```

Open `https://local.terhal.co:3000` for the customer site, `https://dashboard.local.terhal.co:3000` for staff and
`https://admin.local.terhal.co:3000` for admin.

### The first admin

Set `ADMIN_EMAIL` in `backend/.env` and run `pnpm --filter @terhal/backend db:seed`. With `RESEND_KEY` empty the
invitation email, link included, is printed to the console. The seed only works while no admin exists; every admin after
the first is invited by an admin.

## Render services

Production and staging are separate Render environments with the same four resources each, all in Frankfurt (next to
Neon's AWS Frankfurt region). Both backend services build from the repo root so pnpm can see the lockfile.

| Service | Type           | Build                                                                     | Start                                        |
| ------- | -------------- | ------------------------------------------------------------------------- | -------------------------------------------- |
| server  | Web service    | `pnpm install --frozen-lockfile && pnpm turbo build --filter=@terhal/backend` | `pnpm --filter @terhal/backend start`, after `db:deploy` as the pre-deploy command |
| worker  | Background worker | same as server                                                        | `pnpm --filter @terhal/backend start:worker` |
| cache   | Key Value      | `maxmemoryPolicy: allkeys-lru`                                            |                                              |
| queue   | Key Value      | `maxmemoryPolicy: noeviction`                                             |                                              |

Only the server runs migrations, so the two never race on deploy. `DATABASE_URL` is the Neon branch's pooled URL and
`DATABASE_URL_UNPOOLED` its direct URL, used only for migrations.

**Client IPs.** Rate limits read the caller's address from `CF-Connecting-IP`, which Render's Cloudflare edge sets and
clients can't override. In every new environment, check that a spoofed header is ignored: send the same failing sign in
with a different `CF-Connecting-IP` each time and make sure the limit still kicks in.
