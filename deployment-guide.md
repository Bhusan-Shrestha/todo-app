# todo-backend Deployment Guide (Docker Swarm)

This covers how the stack is structured and the steps to build, push, and deploy it on the swarm.

## Overview

The stack has three services:

- **registry** — a private Docker registry running on the manager node. Stores the `todo-backend` and `todo-stats` images so worker nodes can pull them without SSH access to the manager.
- **backend** — the main API. Runs only on the manager, bound directly to host port 4000 (`mode: host`). Talks to Postgres on the host machine and to `todo-stats` over the internal `app-net` overlay network.
- **todo-stats** — a microservice. Runs only on worker nodes, spread across them, with no published ports — it's reachable only from inside the swarm network.

Images for `backend` and `todo-stats` are not pulled from Docker Hub. They're built locally on the manager and pushed to the private registry, then Swarm pulls them from there onto whichever node needs them.

## Prerequisites

- `.env` file in the project root with:
  ```
  REGISTRY_HOST=<manager-ip>:5000
  ```
- Every node in the swarm (manager and workers) must trust this registry as insecure, since it's plain HTTP, not HTTPS. On each node:
  ```bash
  sudo mkdir -p /etc/docker
  echo '{ "insecure-registries": ["<manager-ip>:5000"] }' | sudo tee /etc/docker/daemon.json
  sudo systemctl restart docker
  ```
  See `DEPLOY.md` for the full one-time setup.

## Deploy Workflow

### 1. Export environment variables

`docker stack deploy` does not read `.env` files automatically the way `docker compose` does. Export them into the shell first:

```bash
set -a && source .env && set +a
echo "$REGISTRY_HOST"   # sanity check — should print 10.2.1.152:5000
```

### 2. Deploy the stack (starts the registry)

```bash
docker stack deploy -c docker-compose.yml todo-backend
```

On a first-time deploy, `backend` and `todo-stats` will fail to start here — that's expected, since the registry is empty. This step's real purpose is to bring the `registry` service up.

### 3. Build and push the images

```bash
docker build -t $REGISTRY_HOST/todo-backend:local ./backend
docker push $REGISTRY_HOST/todo-backend:local

docker build -t $REGISTRY_HOST/todo-stats:local ./stats-service
docker push $REGISTRY_HOST/todo-stats:local
```

Verify both landed in the registry:

```bash
curl http://$REGISTRY_HOST/v2/_catalog
```

Expected output: `{"repositories":["todo-backend","todo-stats"]}`

### 4. Redeploy

```bash
docker stack deploy -c docker-compose.yml todo-backend
```

Swarm will retry the previously failed tasks automatically once the images exist, but redeploying forces it immediately.

### 5. Verify

```bash
docker stack ps todo-backend --no-trunc
```

All tasks should show `Running`. `Ignoring unsupported options: build` in the deploy output is normal — Swarm doesn't build images, so it ignores the `build:` key and uses `image:` instead.

## Redeploying After Code Changes

Whenever `backend` or `stats-service` code changes, repeat steps 3 and 4 (build, push, `docker stack deploy`). The `update_config` on `todo-stats` (`order: start-first`) means it starts the new task before killing the old one, for a rolling update with no downtime.

## Troubleshooting

**`invalid reference format` on deploy**
`REGISTRY_HOST` wasn't set in the shell, so it expanded to empty. Run `echo "$REGISTRY_HOST"` — if blank, re-run `set -a && source .env && set +a`.

**`failed to resolve reference ... not found`**
The image tag is correct but nothing's been pushed to the registry yet, or the push silently failed. Check `curl http://$REGISTRY_HOST/v2/_catalog` to confirm what's actually in the registry.

**`http: server gave HTTP response to HTTPS client` on push**
The node doesn't trust the registry as insecure. Run the `insecure-registries` setup from Prerequisites on that node and restart Docker.

**Worker can't pull but manager can**
The insecure-registries setting is per-node. It must be set on every worker as well as the manager — check `/etc/docker/daemon.json` on the failing worker specifically.
