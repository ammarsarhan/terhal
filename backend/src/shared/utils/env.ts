import { config } from "dotenv";

// backend/.env holds local settings, including the local Postgres; the repo-root .env.local is written by `neon env pull`
// when you need to reach a Neon branch from your machine. Earlier files win, so comment out the two DATABASE_URL lines in
// backend/.env to use it. On Render neither file exists and env is injected.
config({ path: [".env", "../.env.local"] });
