import { MigrationInterface, QueryRunner } from 'typeorm'

/** Esquema inicial derivado de los modelos: vehicles, clients, sales. */
export class InitialSchema1790000000000 implements MigrationInterface {
  name = 'InitialSchema1790000000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS dealership`)

    await queryRunner.query(`
      CREATE TABLE dealership.vehicles (
        id         UUID NOT NULL,
        vin        VARCHAR(17) NOT NULL,
        brand      VARCHAR(60) NOT NULL,
        model      VARCHAR(80) NOT NULL,
        version    VARCHAR(120) NOT NULL DEFAULT '',
        plate      VARCHAR(12) NOT NULL DEFAULT '',
        color      VARCHAR(40) NOT NULL DEFAULT '',
        fuel       VARCHAR(20) NOT NULL,
        year       INTEGER NOT NULL,
        mileage    INTEGER NOT NULL DEFAULT 0,
        price      NUMERIC(12, 2) NOT NULL DEFAULT 0,
        status     VARCHAR(20) NOT NULL DEFAULT 'stock',
        notes      VARCHAR(1000) NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT pk_vehicles PRIMARY KEY (id),
        CONSTRAINT uq_vehicles_vin UNIQUE (vin),
        CONSTRAINT uq_vehicles_plate UNIQUE (plate)
      )
    `)

    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS dealership`)

    await queryRunner.query(`
      CREATE TABLE dealership.clients (
        id          UUID NOT NULL,
        name        VARCHAR(200) NOT NULL,
        client_type VARCHAR(20) NOT NULL DEFAULT 'individual',
        tax_id      VARCHAR(20) NOT NULL DEFAULT '',
        email       VARCHAR(200) NOT NULL DEFAULT '',
        phone       VARCHAR(20) NOT NULL DEFAULT '',
        city        VARCHAR(100) NOT NULL DEFAULT '',
        address     VARCHAR(300) NOT NULL DEFAULT '',
        notes       VARCHAR(1000) NOT NULL DEFAULT '',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT  pk_clients PRIMARY KEY (id),
        CONSTRAINT  uq_clients_tax_id UNIQUE (tax_id)
      )
    `)

    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS dealership`)

    await queryRunner.query(`
      CREATE TABLE dealership.sales (
        id             UUID NOT NULL,
        reference      VARCHAR(20) NOT NULL,
        sale_date      DATE NOT NULL,
        vehicle_label  VARCHAR(200) NOT NULL,
        client_label   VARCHAR(200) NOT NULL,
        salesperson    VARCHAR(120) NOT NULL DEFAULT '',
        amount         NUMERIC(12, 2) NOT NULL DEFAULT 0,
        discount       NUMERIC(12, 2) NOT NULL DEFAULT 0,
        payment_method VARCHAR(20) NOT NULL DEFAULT 'cash',
        status         VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT     pk_sales PRIMARY KEY (id),
        CONSTRAINT     uq_sales_reference UNIQUE (reference)
      )
    `)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS dealership.sales`)
    await queryRunner.query(`DROP TABLE IF EXISTS dealership.clients`)
    await queryRunner.query(`DROP TABLE IF EXISTS dealership.vehicles`)
  }
}
