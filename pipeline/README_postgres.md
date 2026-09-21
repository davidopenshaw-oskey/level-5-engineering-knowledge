# The Postgres index (`facts-postgres-index-local`)

The local database behind the whole pipeline. Extraction writes files; the sync step loads them
here; the edge builders, the MCP server and the PRD agent all read from here. For the run
sequence see [README.md](README.md). This page is about the database itself: how to reach it,
where its data lives, and how not to lose it.

**It is a normal PostgreSQL 16 with the pgvector extension, running inside a Docker container.**
Anything that talks to Postgres works with it.

---

## Quick reference

| | |
|---|---|
| Container | `facts-postgres-index-local` |
| Image | `pgvector/pgvector:pg16` (PostgreSQL 16.15, pgvector 0.8.6, plus `pg_trgm`, `pgcrypto`) |
| Host / port | `localhost` : `5433` (container-internal port is 5432) |
| Database / user / password | `facts_index` / `facts_index` / `local_dev_only` |
| Data lives in | Docker named volume `facts-postgres-index_facts_postgres_data` |
| Config | [facts-postgres-index/docker-compose.yml](facts-postgres-index/docker-compose.yml), schema in [facts-postgres-index/schema-proposal.sql](facts-postgres-index/schema-proposal.sql) |
| Size (2026-09-21) | about 1 GB, almost all of it the `facts` table (embeddings) |
| Backups | none automatic. See [Backup and restore](#backup-and-restore) |

The scripts read `PG_HOST`, `PG_PORT`, `PG_USER`, `PG_PASSWORD` and `PG_DATABASE` from the
environment and fall back to the values above, so on a normal setup you set nothing.

The password is a local-development placeholder, not a secret. This instance is **not** a
production store.

---

## Start, stop, check

Run from the repo root. Always pass the compose file path (see [Gotchas](#gotchas)).

```bash
# start (data is kept)
docker compose -f pipeline/facts-postgres-index/docker-compose.yml up -d

# is it running?
docker ps --filter name=facts-postgres-index-local

# stop, keeping the data (safe)
docker compose -f pipeline/facts-postgres-index/docker-compose.yml stop
```

The container has no restart policy, so **it does not start by itself after a reboot or a Docker
restart**. Run the `up -d` line above; the data is still there.

## Connecting

Any Postgres client: `localhost`, port `5433`, the credentials above. DBeaver, TablePlus, pgAdmin
and `psql` all work.

Without installing a client, use the one inside the container:

```bash
# interactive
docker exec -it facts-postgres-index-local psql -U facts_index -d facts_index

# one-off query
docker exec -i facts-postgres-index-local psql -U facts_index -d facts_index -c "select count(*) from facts" </dev/null

# run a SQL file
docker exec -i facts-postgres-index-local psql -U facts_index -d facts_index < my-query.sql
```

Scripts and automation: always redirect stdin (`</dev/null` for `-c`, or `< file`). A `docker exec -i`
with nothing on stdin can hang.

---

## What is in it

| Table | Rows (approx, 2026-09-21) | What it holds |
|---|---|---|
| `facts` | 69,000 | Every extracted fact, its description, and its embedding vector. Written by `sync-facts.ts` |
| `cross_repo_edges` | 17,600 | Graph edges between facts, within a repo (`INTRA_REPO_CALL`) and across repos. Written by the edge builders |
| `extraction_runs` | 24 | Which run is the current one for each repo (`is_current`) |
| `embedding_calls` | 1,100 | A log of every paid embedding call (model, tokens, time), used to track spend |

Everything here is **derived** from the source repositories and can be rebuilt (see
[Rebuilding from scratch](#rebuilding-from-scratch)). Nothing in it is hand-entered.

---

## Where the data lives, and what can destroy it

The data is **not inside the container**. It is in a Docker named volume, which sits outside the
container's own filesystem. That is why these are safe:

- restarting or stopping the container, rebooting the machine
- `docker compose down` (without `-v`), `docker rm facts-postgres-index-local`
- recreating the container from the compose file

On macOS the volume lives inside Docker Desktop's hidden Linux disk image, so it is **not a folder
you can browse**, and Time Machine or a file copy is not a reliable way to back it up.

**These destroy the data:**

- `docker compose down -v` (the `-v` deletes volumes)
- `docker volume rm facts-postgres-index_facts_postgres_data`
- `docker volume prune` or `docker system prune --volumes` (removes volumes no container is using)
- Docker Desktop: "Clean / Purge data" or "Reset to factory defaults"
- Deleting Docker's disk image, a full or failing disk, losing the machine

Treat any of those commands as a "take a backup first" moment.

---

## Backup and restore

There is **no automatic backup**. The output folder is not in git, so the database exists in one
place unless you make copies. Use logical dumps (`pg_dump`), not file copies.

### Full backup (the whole database, compressed)

```bash
mkdir -p output/backups
docker exec facts-postgres-index-local pg_dump -U facts_index -Fc facts_index \
  > output/backups/facts_index-$(date +%F).dump
```

`output/` is gitignored, so this never gets committed. **Also copy the file somewhere outside
Docker and outside this folder** (an external drive or a cloud drive), otherwise one bad day takes
both the database and its backup.

### One table only (what the edge-build sessions do before changing edges)

```bash
docker exec facts-postgres-index-local pg_dump -U facts_index -t cross_repo_edges facts_index \
  > output/backups/cross_repo_edges-$(date +%F).sql
```

### When to back up

Before a schema change, before rebuilding or deleting a table, before any Docker clean-up or
Docker Desktop update or reset, and after any run that cost real embedding spend.

### Restore

Test this once into a scratch database so you know it works before you need it:

```bash
# 1. scratch database
docker exec facts-postgres-index-local createdb -U facts_index facts_restore_test

# 2. restore into it
docker exec -i facts-postgres-index-local pg_restore -U facts_index -d facts_restore_test \
  < output/backups/facts_index-YYYY-MM-DD.dump

# 3. sanity check, then drop it
docker exec -i facts-postgres-index-local psql -U facts_index -d facts_restore_test \
  -c "select count(*) from facts" </dev/null
docker exec facts-postgres-index-local dropdb -U facts_index facts_restore_test
```

To restore over the real database (replaces its contents), stop anything writing to it first, then
use `pg_restore -d facts_index --clean --if-exists` in step 2.

> These restore commands have **not yet been run in this repo**. Do the scratch-database test
> above once and correct this page if anything differs.

---

## Rebuilding from scratch

Because everything is derived, you can drop and rebuild: extract (free), sync, then the edge
builders. The full sequence is in [README.md](README.md).

- **The cost is embeddings.** Re-embedding is paid and the usage log shows it is substantial
  (about 99,000 fact-embeddings and 9.4 million tokens logged across the project so far, counting
  repeats). A backup is far cheaper than a re-embed.
- `sync-facts.ts` keeps an existing embedding when a fact's description is unchanged, so a
  re-sync of unchanged code costs nothing. A brand-new empty database re-embeds everything.

---

## Gotchas

- **"My data vanished after I started it"** usually means you started a *different* volume. Docker
  Compose prefixes the volume name with the project name, which comes from the compose file's
  folder (`facts-postgres-index`). Running compose from another directory, or with another
  project name, creates a new empty volume next to the real one. Always use
  `-f pipeline/facts-postgres-index/docker-compose.yml`, and check `docker volume ls` for the name
  above.
- **Port 5433 already in use:** another Postgres or a second copy of this container is running.
  `docker ps` to find it.
- **Connection refused:** the container is not running (see [Start, stop, check](#start-stop-check)).
- **The port is open to your network.** The compose file publishes `5433` on all interfaces
  (`0.0.0.0`) with a placeholder password. On a shared network, change the port line to
  `"127.0.0.1:5433:5432"` and recreate the container (the data survives that).
- **Concurrent sessions:** several scripts and Claude sessions may use this database at once.
  Don't drop or rewrite tables without checking nothing else is mid-run.
- **Live edits are real edits.** There is no staging copy; a `DELETE` here changes what the MCP
  server and the PRD agent see immediately.
