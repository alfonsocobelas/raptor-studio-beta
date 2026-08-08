import { MigrationInterface, QueryRunner } from 'typeorm'

/** Esquema inicial derivado de los modelos: propiedades, visitas, agentes. */
export class InitialSchema1790000000000 implements MigrationInterface {
  name = 'InitialSchema1790000000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS fincaraiz`)

    await queryRunner.query(`
      CREATE TABLE fincaraiz.agentes (
        id                  UUID NOT NULL,
        nombre              VARCHAR(200) NOT NULL,
        email               VARCHAR(200) NOT NULL DEFAULT '',
        telefono            VARCHAR(200) NOT NULL DEFAULT '',
        comision_porcentaje NUMERIC(15, 2) NOT NULL DEFAULT 0,
        activo              BOOLEAN NOT NULL DEFAULT false,
        created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT          pk_agentes PRIMARY KEY (id)
      )
    `)

    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS fincaraiz`)

    await queryRunner.query(`
      CREATE TABLE fincaraiz.propiedades (
        id               UUID NOT NULL,
        titulo           VARCHAR(200) NOT NULL,
        zona             VARCHAR(200) NOT NULL DEFAULT '',
        estado           VARCHAR(40) NOT NULL,
        metros_cuadrados INTEGER NOT NULL DEFAULT 0,
        habitaciones     INTEGER NOT NULL DEFAULT 0,
        precio           NUMERIC(15, 2) NOT NULL DEFAULT 0,
        fecha_alta       DATE NOT NULL,
        exclusiva        BOOLEAN NOT NULL DEFAULT false,
        agente_id        UUID NOT NULL,
        agente_name      VARCHAR(200) NOT NULL,
        created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT       pk_propiedades PRIMARY KEY (id),
        CONSTRAINT       fk_propiedades_agente FOREIGN KEY (agente_id) REFERENCES fincaraiz.agentes (id) ON DELETE RESTRICT
      )
    `)

    await queryRunner.query(`
      CREATE INDEX idx_propiedades_agente_id ON fincaraiz.propiedades (agente_id)
    `)

    await queryRunner.query(`
      CREATE TABLE fincaraiz.propiedades_attachments (
        id          UUID         NOT NULL,
        propiedad_id UUID         NOT NULL,
        file_name   VARCHAR(255) NOT NULL,
        mime_type   VARCHAR(128) NOT NULL,
        size_bytes  INT          NOT NULL,
        storage_key UUID         NOT NULL,
        uploaded_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT pk_propiedades_attachments PRIMARY KEY (id),
        CONSTRAINT fk_propiedades_attachments_propiedad FOREIGN KEY (propiedad_id)
          REFERENCES fincaraiz.propiedades (id) ON DELETE CASCADE
      )
    `)

    await queryRunner.query(`
      CREATE INDEX idx_propiedades_attachments_propiedad_id ON fincaraiz.propiedades_attachments (propiedad_id)
    `)

    await queryRunner.query(`
      CREATE INDEX idx_propiedades_attachments_file_name ON fincaraiz.propiedades_attachments (file_name)
    `)

    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS fincaraiz`)

    await queryRunner.query(`
      CREATE TABLE fincaraiz.visitas (
        id             UUID NOT NULL,
        referencia     VARCHAR(200) NOT NULL,
        fecha          DATE NOT NULL,
        interesado     VARCHAR(200) NOT NULL DEFAULT '',
        observaciones  VARCHAR(2000) NOT NULL DEFAULT '',
        confirmada     BOOLEAN NOT NULL DEFAULT false,
        propiedad_id   UUID NOT NULL,
        propiedad_name VARCHAR(200) NOT NULL,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT     pk_visitas PRIMARY KEY (id),
        CONSTRAINT     fk_visitas_propiedad FOREIGN KEY (propiedad_id) REFERENCES fincaraiz.propiedades (id) ON DELETE RESTRICT
      )
    `)

    await queryRunner.query(`
      CREATE INDEX idx_visitas_propiedad_id ON fincaraiz.visitas (propiedad_id)
    `)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS fincaraiz.visitas`)
    await queryRunner.query(`DROP TABLE IF EXISTS fincaraiz.propiedades_attachments`)
    await queryRunner.query(`DROP TABLE IF EXISTS fincaraiz.propiedades`)
    await queryRunner.query(`DROP TABLE IF EXISTS fincaraiz.agentes`)
  }
}
