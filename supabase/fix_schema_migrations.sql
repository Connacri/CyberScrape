-- =====================================================================
-- CYBER-VACUUM // Résolution de l'erreur SQLSTATE 23505 (schema_migrations_pkey)
-- Message d'erreur : duplicate key value violates unique constraint "schema_migrations_pkey"
--                    Key (version)=(001) already exists.
-- =====================================================================

-- Cause : Une migration avec la clé version '001' a déjà été enregistrée
-- dans la table interne de migration Supabase (supabase_migrations.schema_migrations).
-- Lorsque le CLI ou un script tente de réinsérer '001', PostgreSQL lève l'erreur 23505.

-- SOLUTION 1 (Recommandée dans Supabase SQL Editor) :
-- Nettoyer la version en conflit pour permettre au script de repasser proprement :
DELETE FROM supabase_migrations.schema_migrations WHERE version = '001';

-- SOLUTION 2 (Si vous utilisez le CLI Supabase en local) :
-- Exécutez dans votre terminal :
--   supabase migration repair --status applied 001
-- ou pour forcer le recalcul :
--   supabase db reset

-- SOLUTION 3 : Rendre l'insertion idempotente (si vous utilisez un script custom de migration) :
-- INSERT INTO supabase_migrations.schema_migrations(version, name, statements)
-- VALUES ('001', 'initial_schema', ARRAY['...'])
-- ON CONFLICT (version) DO NOTHING;
