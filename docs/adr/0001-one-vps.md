# 0001: One VPS with Docker Compose

**Status:** accepted, 2026-11-02

## Context

Terhal started on Render (API, worker, Redis) and Vercel (web), on free plans. Free web services sleep after 15 minutes,
the free Key Value instance keeps nothing across restarts, and the worker has no free plan, so the parts Terhal needs
most were the ones being put off. Terhal is single-tenant: one company's traffic.

## Decision

Everything except the database runs in Docker on one VPS: per environment (staging, main) a Compose stack with the
server, the worker, the web app and two Redis containers, behind one shared Caddy that terminates TLS for every host.
The database stays on Neon, for backups, point-in-time restore and branches. GitHub Actions builds the images, pushes
them to GHCR and deploys over SSH once CI passes (`deploy/`, `.github/workflows/deploy.yml`).

## What we gave up

- Operations are ours: OS updates, the firewall, monitoring, restarts.
- One box is a single point of failure for the site, the API and the worker.
- Deploys recreate containers, so there are a few seconds of downtime per deploy.

When an hour of downtime starts to cost real money, add a second box behind a load balancer. The server is stateless
(sessions in Postgres, limits and queues in Redis), so that needs no rewrite.
