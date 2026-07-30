-- Concede escritura TEMPORAL a una persona metiéndola en el grupo de lectura/escritura.
--
-- El caso de uso es el mantenimiento puntual: un compañero necesita correr un script que
-- corrige datos y, al terminar, deja de necesitarlo. Los permisos viven en el grupo
-- (create-readwrite-group.sql), así que dar y quitar el acceso es añadir y sacar la
-- membresía — sin tocar permisos y sin borrar al usuario, que conserva su lectura.
--
-- Al terminar el mantenimiento: revoke-write-access.sql. NO dejar la membresía puesta
-- "por si acaso"; en producción ese "por si acaso" es acceso de escritura permanente a
-- datos de clientes.
--
-- El REVOKE posterior afecta a las sesiones ya abiertas: los permisos se comprueban en
-- cada sentencia, así que no hace falta cerrarle la conexión.
--
-- Ojo, esto no basta para que llegue al servidor: su IP tiene que estar en
-- `postgres_allowed_ips` del TF_VARS_JSON del entorno y Terraform aplicado. Quitarla al
-- acabar es la otra mitad del control de acceso.
--
-- Ejecución, conectado a la BD de la app con el admin:
--
--   psql "host=<server>.postgres.database.azure.com dbname=acelerador user=<admin> sslmode=require" \
--     -v user_name=<usuario> -v group_name=sap_licensing_rw \
--     -f iac/sql/grant-write-access.sql

GRANT :"group_name" TO :"user_name";

-- Quién tiene ahora mismo la membresía, para ver el efecto y no fiarse del "creo que sí".
SELECT member.rolname AS usuario, grp.rolname AS grupo
FROM pg_auth_members am
JOIN pg_roles grp ON grp.oid = am.roleid
JOIN pg_roles member ON member.oid = am.member
WHERE grp.rolname = :'group_name'
ORDER BY member.rolname;
