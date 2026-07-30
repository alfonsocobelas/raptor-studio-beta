-- Rol de GRUPO (sin login) con permisos de solo lectura sobre UN esquema
-- concreto (spec 41, TASK-07). Los permisos viven aquí; las personas se crean
-- con create-db-user.sql y se les concede la membresía.
--
-- La BD tiene varios esquemas (sap_licensing, iam); cada grupo se limita al
-- esquema que se le pase — nunca a toda la base de datos. iam (sesiones,
-- tokens, hashes) no se concede a nadie.
--
-- El usuario de Alfonso NO se crea aquí: es el administrator_login del servidor
-- (Terraform), miembro de azure_pg_admin — el equivalente a superuser en
-- Flexible Server (superuser real no existe en el servicio gestionado).
--
-- Ejecución manual ÚNICA por entorno y esquema, conectado a la BD de la app con
-- el admin (el mismo que corre las migraciones, para que ALTER DEFAULT
-- PRIVILEGES aplique a las tablas futuras):
--
--   psql "host=<server>.postgres.database.azure.com dbname=acelerador user=<admin> sslmode=require" \
--     -v dbname=acelerador -v group_name=sap_licensing_readers -v schema=sap_licensing \
--     -f iac/sql/create-readonly-group.sql

CREATE ROLE :"group_name" NOLOGIN;

GRANT CONNECT ON DATABASE :"dbname" TO :"group_name";
GRANT USAGE ON SCHEMA :"schema" TO :"group_name";

-- Tablas existentes + tablas que cree en adelante el usuario que ejecuta esto
-- (el admin, que es quien corre las migraciones). Solo en este esquema.
GRANT SELECT ON ALL TABLES IN SCHEMA :"schema" TO :"group_name";
ALTER DEFAULT PRIVILEGES IN SCHEMA :"schema" GRANT SELECT ON TABLES TO :"group_name";
