import { MigrationInterface, QueryRunner } from 'typeorm'

/** Usuarios, sesiones y tokens de un solo uso (invitación y reset). */
export class CreateIamAuth1790000001000 implements MigrationInterface {
  name = 'CreateIamAuth1790000001000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS iam`)

    await queryRunner.query(`
      CREATE TABLE iam."user" (
        id                    UUID          NOT NULL,
        email                 VARCHAR(254)  NOT NULL,
        name                  VARCHAR(120)  NOT NULL,
        password_hash         VARCHAR(255)  NULL,
        role                  VARCHAR(20)   NOT NULL,
        status                VARCHAR(20)   NOT NULL,
        failed_login_attempts INTEGER       NOT NULL DEFAULT 0,
        locked_until          TIMESTAMPTZ   NULL,
        created_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
        updated_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
        CONSTRAINT pk_user PRIMARY KEY (id),
        CONSTRAINT uq_user_email UNIQUE (email),
        CONSTRAINT ck_user_role CHECK (role IN ('admin', 'user', 'viewer')),
        CONSTRAINT ck_user_status CHECK (status IN ('pending', 'active', 'disabled'))
      )
    `)

    await queryRunner.query(`
      CREATE TABLE iam.session (
        id           UUID         NOT NULL,
        user_id      UUID         NOT NULL,
        token_hash   VARCHAR(64)  NOT NULL,
        created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
        expires_at   TIMESTAMPTZ  NOT NULL,
        last_seen_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT pk_session PRIMARY KEY (id),
        CONSTRAINT uq_session_token_hash UNIQUE (token_hash)
      )
    `)
    await queryRunner.query(`CREATE INDEX idx_session_user_id ON iam.session (user_id)`)

    await queryRunner.query(`
      CREATE TABLE iam.auth_token (
        id         UUID         NOT NULL,
        user_id    UUID         NOT NULL,
        token_hash VARCHAR(64)  NOT NULL,
        type       VARCHAR(30)  NOT NULL,
        expires_at TIMESTAMPTZ  NOT NULL,
        used_at    TIMESTAMPTZ  NULL,
        created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
        CONSTRAINT pk_auth_token PRIMARY KEY (id),
        CONSTRAINT uq_auth_token_token_hash UNIQUE (token_hash)
      )
    `)
    await queryRunner.query(`CREATE INDEX idx_auth_token_user_id ON iam.auth_token (user_id)`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS iam.auth_token`)
    await queryRunner.query(`DROP TABLE IF EXISTS iam.session`)
    await queryRunner.query(`DROP TABLE IF EXISTS iam."user"`)
  }
}
