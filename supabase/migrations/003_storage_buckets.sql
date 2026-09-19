-- Ejecutar en el SQL Editor de Supabase después del schema.
-- Crea buckets privados para anexos. Storage vive en el schema storage, no en proyecto-universidad.

INSERT INTO storage.buckets (id, name, public)
VALUES ('excusas', 'excusas', false), ('convivencia', 'convivencia', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('excusas', 'excusas', false), ('convivencia', 'convivencia', false)
ON CONFLICT (id) DO NOTHING;
