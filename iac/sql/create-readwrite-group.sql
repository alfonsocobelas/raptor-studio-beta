-- Rol de GRUPO (sin login) con permisos de LECTURA Y ESCRITURA de datos sobre UN
-- esquema concreto, para compañeros que necesitan trabajar contra la BD haciendo
-- pruebas. Los permisos viven aquí; las personas se crean con
-- create-db-user.sql (es agnóstico del grupo: basta pasarle el group_name
-- de este grupo) y se les concede la membresía.
--
-- Alcance deliberado: solo DML (SELECT/INSERT/UPDATE/DELETE). NO es admin —
-- sin DDL (no puede crear/alterar/borrar tablas ni tocar el esquema) y sin
-- TRUNCATE (DELETE cubre la necesidad; TRUNCATE salta triggers y no es
-- reversible dentro de la sesión como un DELETE mal dado).
--
-- La BD tiene varios esquemas (sap_licensing, iam); cada grupo se limita al
-- esquema que se le pase — nunca a toda la base de datos. iam (sesiones,
-- tokens, hashes) no se concede a nadie.
--
-- En dev/qa la membresía puede ser permanente. En PRODUCCIÓN el grupo existe
-- (decisión 2026-07-28, para poder delegar mantenimientos puntuales) pero la
-- membresía es SIEMPRE temporal: se concede con grant-write-access.sql justo
-- antes del mantenimiento y se retira con revoke-write-access.sql al terminar.
-- En reposo, nadie es miembro en prod: allí solo lectura
-- (create-readonly-group.sql) y escribe la aplicación.
--
-- Nota: los IDs del proyecto son UUIDv7, no hay secuencias en los esquemas de
-- negocio. Si algún día se añade una columna serial/identity, este grupo
-- necesitará además GRANT USAGE ON ALL SEQUENCES IN SCHEMA para que el INSERT
-- funcione.
--
-- Ejecución manual ÚNICA por entorno y esquema, conectado a la BD de la app con
-- el admin (el mismo que corre las migraciones, para que ALTER DEFAULT
-- PRIVILEGES aplique a las tablas futuras):
--
--   psql "host=<server>.postgres.database.azure.com dbname=acelerador user=<admin> sslmode=require" \
--     -v dbname=acelerador -v group_name=sap_licensing_rw -v schema=sap_licensing \
--     -f iac/sql/create-readwrite-group.sql

CREATE ROLE :"group_name" NOLOGIN;

GRANT CONNECT ON DATABASE :"dbname" TO :"group_name";
GRANT USAGE ON SCHEMA :"schema" TO :"group_name";

-- Tablas existentes + tablas que cree en adelante el usuario que ejecuta esto
-- (el admin, que es quien corre las migraciones). Solo en este esquema.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA :"schema" TO :"group_name";
ALTER DEFAULT PRIVILEGES IN SCHEMA :"schema" GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :"group_name";
