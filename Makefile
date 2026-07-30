# Acelerador — fachada de comandos (patrón heredado de sap-licenses)

.PHONY: help docker-local-start docker-local-stop docker-test-start docker-test-stop \
        test lint build golden-diff format local-setup

help:
	@grep -E '^[a-zA-Z-]+:' Makefile | sed 's/:.*//'

# --- Docker (dependencias locales: postgres + azurite) ---
docker-local-start:
	docker compose -f docker/docker-compose.local.yml up -d

docker-local-stop:
	docker compose -f docker/docker-compose.local.yml down

docker-test-start:
	docker compose -f docker/docker-compose.test.yml up -d

docker-test-stop:
	docker compose -f docker/docker-compose.test.yml down

# --- Gates ---
test:
	npx nx run-many -t test

lint:
	npx nx run-many -t lint

build:
	npx nx run-many -t build

golden-diff:
	npm run golden:diff

format:
	npm run format

# --- Onboarding en un comando ---
local-setup: docker-local-start
	npm install
