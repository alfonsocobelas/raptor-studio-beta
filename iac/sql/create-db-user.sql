-- Usuario individual (con login) miembro de un grupo de permisos creado
-- previamente (spec 41, TASK-07). Es agnóstico del grupo: los permisos viven en
-- el grupo, aquí solo se crea la persona y se le concede la membresía.
--
--   create-readonly-group.sql   -> grupo de solo lectura (todos los entornos)
--   create-readwrite-group.sql  -> grupo de lectura y escritura (solo dev/qa)
--
-- Ejecución manual, una vez por persona y entorno, conectado con el admin:
--
--   psql "host=<server>.postgres.database.azure.com dbname=acelerador user=<admin> sslmode=require" \
--     -v user_name=<usuario> -v group_name=sap_licensing_readers -v user_password='<password>' \
--     -f iac/sql/create-db-user.sql
--
-- La contraseña NO va en el repo: se pasa con -v y se guarda donde el resto de
-- secretos del entorno. Revocar acceso a una persona = DROP ROLE <usuario>;
-- los permisos del grupo quedan intactos.

CREATE ROLE :"user_name" LOGIN PASSWORD :'user_password';

GRANT :"group_name" TO :"user_name";
