import { MigrationInterface, QueryRunner } from 'typeorm'

/** Esquema inicial derivado de los modelos: customers, contracts, licenses, projects. */
export class InitialSchema1790000000000 implements MigrationInterface {
  name = 'InitialSchema1790000000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS sap_licensing`)

    await queryRunner.query(`
      CREATE TABLE sap_licensing.customers (
        id                   UUID NOT NULL,
        sap_id               VARCHAR(20) NOT NULL,
        name                 VARCHAR(255) NOT NULL,
        tax_id               VARCHAR(20) NOT NULL DEFAULT '',
        industry             VARCHAR(100) NOT NULL DEFAULT '',
        address              VARCHAR(500) NOT NULL DEFAULT '',
        phone                VARCHAR(255) NOT NULL DEFAULT '',
        notes                VARCHAR(1000) NOT NULL DEFAULT '',
        city                 VARCHAR(100) NOT NULL DEFAULT '',
        country              VARCHAR(100) NOT NULL DEFAULT '',
        customer_type        VARCHAR(10) NOT NULL,
        status               VARCHAR(20) NOT NULL DEFAULT 'active',
        archived_at          TIMESTAMPTZ NULL,
        last_seen_in_sync_at TIMESTAMPTZ NULL,
        created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT           pk_customers PRIMARY KEY (id),
        CONSTRAINT           uq_customers_sap_id UNIQUE (sap_id)
      )
    `)

    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_customers_tax_id
        ON sap_licensing.customers (tax_id)
        WHERE tax_id <> ''
    `)

    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS sap_licensing`)

    await queryRunner.query(`
      CREATE TABLE sap_licensing.contracts (
        id                       UUID NOT NULL,
        contract_type            VARCHAR(20) NOT NULL,
        contract_number          VARCHAR(255) NULL,
        customer_id              UUID NOT NULL,
        customer_name            VARCHAR(255) NOT NULL,
        cms_case_id              VARCHAR(30) NOT NULL DEFAULT '',
        business_model           VARCHAR(100) NOT NULL DEFAULT '',
        sub_solution_areas       TEXT NOT NULL DEFAULT "'{}'",
        nbr_of_contracts         INTEGER NOT NULL DEFAULT 1,
        is_favorite              BOOLEAN NOT NULL DEFAULT false,
        status                   VARCHAR(20) NOT NULL DEFAULT 'active',
        source                   VARCHAR(20) NOT NULL DEFAULT 'AVVALE_SOLD',
        start_date               DATE NULL,
        end_date                 DATE NULL,
        total_value              NUMERIC(15, 2) NOT NULL DEFAULT 0,
        currency                 VARCHAR(3) NOT NULL DEFAULT 'EUR',
        billing_frequency        VARCHAR(20) NOT NULL DEFAULT 'yearly',
        renewal_type             VARCHAR(20) NOT NULL DEFAULT 'manual',
        notes                    VARCHAR(1000) NOT NULL DEFAULT '',
        origin                   VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
        lifecycle_status         VARCHAR(20) NOT NULL DEFAULT 'active',
        archived_at              TIMESTAMPTZ NULL,
        last_seen_in_sync_at     TIMESTAMPTZ NULL,
        support_model            VARCHAR(100) NOT NULL DEFAULT '',
        upcoming_maintenance_end DATE NULL,
        upcoming_maintenance_fee NUMERIC(15, 2) NULL,
        created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT               pk_contracts PRIMARY KEY (id),
        CONSTRAINT               uq_contracts_contract_number UNIQUE (contract_number)
      )
    `)

    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS sap_licensing`)

    await queryRunner.query(`
      CREATE TABLE sap_licensing.licenses (
        id                     UUID NOT NULL,
        contract_id            UUID NOT NULL,
        customer_id            UUID NOT NULL,
        customer_name          VARCHAR(255) NOT NULL,
        contract_number        VARCHAR(255) NOT NULL,
        contract_end_date      DATE NULL,
        metric_id              VARCHAR(20) NOT NULL DEFAULT '',
        metric_name            VARCHAR(200) NOT NULL,
        sub_solution_area_name VARCHAR(150) NOT NULL DEFAULT '',
        metric                 VARCHAR(20) NOT NULL,
        licensed_units         INTEGER NOT NULL,
        price_per_unit         NUMERIC(15, 2) NOT NULL DEFAULT 0,
        status                 VARCHAR(20) NOT NULL DEFAULT 'active',
        source                 VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
        material_id            VARCHAR(40) NOT NULL DEFAULT '',
        lifecycle_status       VARCHAR(20) NOT NULL DEFAULT 'active',
        archived_at            TIMESTAMPTZ NULL,
        last_seen_in_sync_at   TIMESTAMPTZ NULL,
        current_units          NUMERIC(15, 2) NOT NULL DEFAULT 0,
        consumption_pct        NUMERIC(8, 2) NOT NULL DEFAULT 0,
        excess_units           NUMERIC(15, 2) NOT NULL DEFAULT 0,
        annual_value           NUMERIC(15, 2) NOT NULL DEFAULT 0,
        created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at             TIMESTAMPTZ NULL,
        CONSTRAINT             pk_licenses PRIMARY KEY (id)
      )
    `)

    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS sap_licensing`)

    await queryRunner.query(`
      CREATE TABLE sap_licensing.projects (
        id                   UUID NOT NULL,
        customer_id          UUID NOT NULL,
        customer_name        VARCHAR(200) NOT NULL,
        name                 VARCHAR(200) NOT NULL,
        description          VARCHAR(1000) NOT NULL DEFAULT '',
        start_date           DATE NULL,
        end_date             DATE NULL,
        status               VARCHAR(20) NOT NULL DEFAULT 'planning',
        implementer          VARCHAR(20) NOT NULL DEFAULT 'AVVALE',
        origin               VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
        lifecycle_status     VARCHAR(20) NOT NULL DEFAULT 'active',
        archived_at          TIMESTAMPTZ NULL,
        last_seen_in_sync_at TIMESTAMPTZ NULL,
        sap_project_id       VARCHAR(30) NULL,
        at_risk              VARCHAR(50) NULL,
        in_escalation        VARCHAR(50) NULL,
        nbr_of_waves         INTEGER NULL,
        wave_stage           VARCHAR(50) NULL,
        wave_status          VARCHAR(50) NULL,
        plan_to_go_live      DATE NULL,
        created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at           TIMESTAMPTZ NULL,
        CONSTRAINT           pk_projects PRIMARY KEY (id),
        CONSTRAINT           uq_projects_name UNIQUE (name)
      )
    `)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS sap_licensing.projects`)
    await queryRunner.query(`DROP TABLE IF EXISTS sap_licensing.licenses`)
    await queryRunner.query(`DROP TABLE IF EXISTS sap_licensing.contracts`)
    await queryRunner.query(`DROP TABLE IF EXISTS sap_licensing.customers`)
  }
}
