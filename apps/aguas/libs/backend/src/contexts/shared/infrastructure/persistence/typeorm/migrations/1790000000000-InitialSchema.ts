import { MigrationInterface, QueryRunner } from 'typeorm'

/** Esquema inicial derivado de los modelos: muestras, puntos, clientes, parametros. */
export class InitialSchema1790000000000 implements MigrationInterface {
  name = 'InitialSchema1790000000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS aguas`)

    await queryRunner.query(`
      CREATE TABLE aguas.clientes (
        id         UUID NOT NULL,
        nombre     VARCHAR(200) NOT NULL,
        tipo       VARCHAR(40) NOT NULL,
        telefono   VARCHAR(200) NOT NULL DEFAULT '',
        localidad  VARCHAR(200) NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at TIMESTAMPTZ NULL,
        deleted_op UUID NULL,
        CONSTRAINT pk_clientes PRIMARY KEY (id)
      )
    `)

    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS aguas`)

    await queryRunner.query(`
      CREATE TABLE aguas.puntos (
        id           UUID NOT NULL,
        nombre       VARCHAR(200) NOT NULL,
        tipo_agua    VARCHAR(40) NOT NULL,
        direccion    VARCHAR(200) NOT NULL DEFAULT '',
        coordenadas  VARCHAR(200) NOT NULL DEFAULT '',
        obligatorio  BOOLEAN NOT NULL DEFAULT false,
        cliente_id   UUID NOT NULL,
        cliente_name VARCHAR(200) NOT NULL,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at   TIMESTAMPTZ NULL,
        deleted_op   UUID NULL,
        CONSTRAINT   pk_puntos PRIMARY KEY (id),
        CONSTRAINT   fk_puntos_cliente FOREIGN KEY (cliente_id) REFERENCES aguas.clientes (id) ON DELETE RESTRICT
      )
    `)

    await queryRunner.query(`
      CREATE INDEX idx_puntos_cliente_id ON aguas.puntos (cliente_id)
    `)

    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS aguas`)

    await queryRunner.query(`
      CREATE TABLE aguas.muestras (
        id             UUID NOT NULL,
        codigo         VARCHAR(200) NOT NULL,
        estado         VARCHAR(40) NOT NULL,
        tecnico        VARCHAR(200) NOT NULL DEFAULT '',
        recogida       DATE NOT NULL,
        limite_informe DATE NOT NULL,
        importe        NUMERIC(15, 2) NOT NULL DEFAULT 0,
        punto_id       UUID NOT NULL,
        punto_name     VARCHAR(200) NOT NULL,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at     TIMESTAMPTZ NULL,
        deleted_op     UUID NULL,
        CONSTRAINT     pk_muestras PRIMARY KEY (id),
        CONSTRAINT     fk_muestras_punto FOREIGN KEY (punto_id) REFERENCES aguas.puntos (id) ON DELETE RESTRICT
      )
    `)

    await queryRunner.query(`
      CREATE INDEX idx_muestras_punto_id ON aguas.muestras (punto_id)
    `)

    await queryRunner.query(`
      CREATE TABLE aguas.muestras_attachments (
        id          UUID         NOT NULL,
        muestra_id UUID         NOT NULL,
        file_name   VARCHAR(255) NOT NULL,
        mime_type   VARCHAR(128) NOT NULL,
        size_bytes  INT          NOT NULL,
        storage_key UUID         NOT NULL,
        uploaded_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT pk_muestras_attachments PRIMARY KEY (id),
        CONSTRAINT fk_muestras_attachments_muestra FOREIGN KEY (muestra_id)
          REFERENCES aguas.muestras (id) ON DELETE CASCADE
      )
    `)

    await queryRunner.query(`
      CREATE INDEX idx_muestras_attachments_muestra_id ON aguas.muestras_attachments (muestra_id)
    `)

    await queryRunner.query(`
      CREATE INDEX idx_muestras_attachments_file_name ON aguas.muestras_attachments (file_name)
    `)

    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS aguas`)

    await queryRunner.query(`
      CREATE TABLE aguas.parametros (
        id           UUID NOT NULL,
        codigo       VARCHAR(200) NOT NULL,
        nombre       VARCHAR(200) NOT NULL DEFAULT '',
        metodo       VARCHAR(200) NOT NULL DEFAULT '',
        limite_legal NUMERIC(15, 2) NOT NULL DEFAULT 0,
        precio       NUMERIC(15, 2) NOT NULL DEFAULT 0,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
        deleted_at   TIMESTAMPTZ NULL,
        deleted_op   UUID NULL,
        CONSTRAINT   pk_parametros PRIMARY KEY (id)
      )
    `)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS aguas.parametros`)
    await queryRunner.query(`DROP TABLE IF EXISTS aguas.muestras_attachments`)
    await queryRunner.query(`DROP TABLE IF EXISTS aguas.muestras`)
    await queryRunner.query(`DROP TABLE IF EXISTS aguas.puntos`)
    await queryRunner.query(`DROP TABLE IF EXISTS aguas.clientes`)
  }
}
