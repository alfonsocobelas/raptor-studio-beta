.PHONY: help up down test-up test-down seed api web typecheck local-setup migrate migrate-rollback

help:
	@grep -E '^[a-zA-Z-]+:' Makefile | sed 's/:.*//'

up:
	docker compose -f docker/docker-compose.local.yml up -d

down:
	docker compose -f docker/docker-compose.local.yml down

test-up:
	docker compose -f docker/docker-compose.test.yml up -d

test-down:
	docker compose -f docker/docker-compose.test.yml down

seed:
	NODE_ENV=local npm run seed

api:
	NODE_ENV=local npm start

web:
	npm run web

typecheck:
	npm run typecheck

# Onboarding en un comando: base de datos + datos + API
local-setup: up
	npm install
	sleep 6
	$(MAKE) seed
	@echo "Listo. 'make api' (http://localhost:3000/api/v1) y 'make web' (http://localhost:4200)"

# --- plugins ---
migrate:
	NODE_ENV=local npm run migration:run

migrate-rollback:
	NODE_ENV=local npm run migration:revert
