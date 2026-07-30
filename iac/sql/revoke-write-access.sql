-- Retira la escritura a una persona sacándola del grupo de lectura/escritura.
--
-- Contrapartida de grant-write-access.sql. El usuario NO se borra: sigue existiendo y
-- conserva la membresía de lectura (sap_licensing_readers), así que no hay que volver a
-- crearlo la próxima vez ni repartir una contraseña nueva.
--
-- Efecto inmediato incluso con su sesión abierta: Postgres comprueba los permisos en cada
-- sentencia, así que su siguiente UPDATE falla sin necesidad de pg_terminate_backend.
--
-- Acuérdate de quitar también su IP de `postgres_allowed_ips` en el TF_VARS_JSON del
-- entorno y aplicar Terraform.
--
-- Ejecución, conectado a la BD de la app con el admin:
--
--   psql "host=<server>.postgres.database.azure.com dbname=acelerador user=<admin> sslmode=require" \
--     -v user_name=<usuario> -v group_name=sap_licensing_rw \
--     -f iac/sql/revoke-write-access.sql

REVOKE :"group_name" FROM :"user_name";

-- Debe devolver 0 filas para ese usuario. Si sigue apareciendo, la escritura NO se ha ido.
SELECT member.rolname AS usuario, grp.rolname AS grupo
FROM pg_auth_members am
JOIN pg_roles grp ON grp.oid = am.roleid
JOIN pg_roles member ON member.oid = am.member
WHERE grp.rolname = :'group_name'
ORDER BY member.rolname;
