import { MigrationInterface, QueryRunner } from 'typeorm'

/** Esquema inicial derivado de los modelos: garments, suppliers, movements. */
export class InitialSchema1790000000000 implements MigrationInterface {
  name = 'InitialSchema1790000000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS warehouse`)

    await queryRunner.query(`
      CREATE TABLE warehouse.garments (
        id         UUID NOT NULL,
        sku        VARCHAR(20) NOT NULL,
        name       VARCHAR(120) NOT NULL,
        category   VARCHAR(20) NOT NULL,
        size       VARCHAR(10) NOT NULL,
        brand      VARCHAR(60) NOT NULL DEFAULT '',
        color      VARCHAR(40) NOT NULL DEFAULT '',
        price      NUMERIC(10, 2) NOT NULL DEFAULT 0,
        stock      INTEGER NOT NULL DEFAULT 0,
        status     VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT pk_garments PRIMARY KEY (id),
        CONSTRAINT uq_garments_sku UNIQUE (sku)
      )
    `)

    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS warehouse`)

    await queryRunner.query(`
      CREATE TABLE warehouse.suppliers (
        id             UUID NOT NULL,
        name           VARCHAR(200) NOT NULL,
        tax_id         VARCHAR(20) NOT NULL DEFAULT '',
        email          VARCHAR(200) NOT NULL DEFAULT '',
        phone          VARCHAR(20) NOT NULL DEFAULT '',
        city           VARCHAR(100) NOT NULL DEFAULT '',
        lead_time_days INTEGER NOT NULL DEFAULT 0,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT     pk_suppliers PRIMARY KEY (id)
      )
    `)

    await queryRunner.query(`
      CREATE UNIQUE INDEX uq_suppliers_tax_id
        ON warehouse.suppliers (tax_id)
        WHERE tax_id <> ''
    `)

    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS warehouse`)

    await queryRunner.query(`
      CREATE TABLE warehouse.movements (
        id            UUID NOT NULL,
        reference     VARCHAR(20) NOT NULL,
        movement_date DATE NOT NULL,
        movement_type VARCHAR(10) NOT NULL,
        garment_label VARCHAR(200) NOT NULL,
        quantity      INTEGER NOT NULL,
        counterparty  VARCHAR(200) NOT NULL DEFAULT '',
        reason        VARCHAR(20) NOT NULL,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT    pk_movements PRIMARY KEY (id),
        CONSTRAINT    uq_movements_reference UNIQUE (reference)
      )
    `)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS warehouse.movements`)
    await queryRunner.query(`DROP TABLE IF EXISTS warehouse.suppliers`)
    await queryRunner.query(`DROP TABLE IF EXISTS warehouse.garments`)
  }
}
