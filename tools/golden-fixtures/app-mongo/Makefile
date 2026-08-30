.PHONY: help up down test-up test-down seed api web test test-integration typecheck local-setup

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

test:
	npm test

# Integración contra el Postgres efímero: make test-up antes (docker)
test-integration:
	npm run test:integration

typecheck:
	npm run typecheck
	npm run lint:ui-boundaries

# Onboarding en un comando: base de datos + esquema + datos + API
local-setup: up
	npm install
	sleep 6
	$(MAKE) seed
	@echo "Listo. 'make api' (http://localhost:3000/api/v1) y 'make web' (http://localhost:4200)"
