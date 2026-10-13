-- Rol de aplicación dedicado, NO superusuario.
-- Contexto: la imagen Docker crea el usuario bootstrap como SUPERUSER y
-- PostgreSQL impide degradarlo ("The bootstrap superuser must have the
-- SUPERUSER attribute"). Los superusuarios ignoran Row-Level Security
-- incluso con FORCE ROW LEVEL SECURITY, así que la API se conecta con
-- `bienestarpro_app` (sujeto a las políticas) mientras las migraciones y el
-- seed usan el rol propietario (MIGRATIONS_DATABASE_URL).
-- Hallazgo: la prueba de aislamiento M9 detectó visibilidad cruzada entre
-- centros cuando la API usaba el superusuario; evidencia en las suites de
-- integración de la rebanada 2.
-- Credencial: valor de DESARROLLO (base ligada a 127.0.0.1). En producción
-- se rota con un secreto real (gestor de secretos del despliegue).

DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'bienestarpro_app') THEN
    CREATE ROLE bienestarpro_app LOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
  END IF;
END
$$;
--> statement-breakpoint
ALTER ROLE bienestarpro_app PASSWORD 'bienestarpro_app_dev';
--> statement-breakpoint
GRANT USAGE ON SCHEMA public TO bienestarpro_app;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bienestarpro_app;
--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bienestarpro_app;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES FOR ROLE bienestarpro IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO bienestarpro_app;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES FOR ROLE bienestarpro IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO bienestarpro_app;
