-- ============================================================
-- LEARNOVA — Table courses + notes + modifications sessions
-- Colle dans Supabase → SQL Editor → Run
-- ============================================================

-- TABLE COURSES
CREATE TABLE IF NOT EXISTS courses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre         TEXT NOT NULL,
  description   TEXT,
  categorie     TEXT DEFAULT 'Formation',
  difficulte    TEXT DEFAULT 'Débutant',
  duree_totale  TEXT,
  resume        TEXT,
  chapitres     JSONB DEFAULT '[]',
  quiz          JSONB DEFAULT '[]',
  concepts_cles JSONB DEFAULT '[]',
  objectifs     JSONB DEFAULT '[]',
  nb_apprenants INT DEFAULT 0,
  statut        TEXT DEFAULT 'publie',
  cree_par      UUID,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE NOTES (notes personnelles des apprenants)
CREATE TABLE IF NOT EXISTS notes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL,
  course_id  TEXT NOT NULL,
  content    TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter course_id dans sessions si absent
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS course_id UUID;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS plan JSONB DEFAULT '[]';

-- SÉCURITÉ
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes   ENABLE ROW LEVEL SECURITY;

-- Cours visibles par tout le monde
DROP POLICY IF EXISTS "Cours visibles" ON courses;
CREATE POLICY "Cours visibles" ON courses FOR SELECT USING (true);
DROP POLICY IF EXISTS "Cours créables" ON courses;
CREATE POLICY "Cours créables" ON courses FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Cours modifiables" ON courses;
CREATE POLICY "Cours modifiables" ON courses FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Cours supprimables" ON courses;
CREATE POLICY "Cours supprimables" ON courses FOR DELETE USING (true);

-- Notes visibles par le propriétaire
DROP POLICY IF EXISTS "Notes lisibles" ON notes;
CREATE POLICY "Notes lisibles" ON notes FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Notes créables" ON notes;
CREATE POLICY "Notes créables" ON notes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Notes modifiables" ON notes;
CREATE POLICY "Notes modifiables" ON notes FOR UPDATE USING (auth.uid() = user_id);

-- TEMPS RÉEL
ALTER PUBLICATION supabase_realtime ADD TABLE courses;

-- VÉRIFICATION
SELECT 'OK — Tables créées !' as message;
SELECT COUNT(*) as nb_courses FROM courses;
