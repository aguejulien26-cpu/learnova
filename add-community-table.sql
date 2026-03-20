-- ============================================================
-- LEARNOVA — Tables pour la communauté
-- Colle dans Supabase → SQL Editor → Run
-- ============================================================
-- TABLE: community_posts
CREATE TABLE IF NOT EXISTS community_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auteur_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  auteur_nom    TEXT,
  auteur_photo  TEXT,
  contenu       TEXT NOT NULL,
  type          TEXT DEFAULT 'avis', -- avis | question | ressource | experience
  note          INT DEFAULT 0,       -- étoiles (1 à 5)
  likes_count   INT DEFAULT 0,
  replies_count INT DEFAULT 0,
  liked_by      UUID[] DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
-- TABLE: community_replies
CREATE TABLE IF NOT EXISTS community_replies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id       UUID REFERENCES community_posts(id) ON DELETE CASCADE,
  auteur_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  auteur_nom    TEXT,
  auteur_photo  TEXT,
  contenu       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
-- SÉCURITÉ
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_replies ENABLE ROW LEVEL SECURITY;
-- Posts visibles par tous
DROP POLICY IF EXISTS "Posts visibles" ON community_posts;
CREATE POLICY "Posts visibles" ON community_posts FOR SELECT USING (true);
DROP POLICY IF EXISTS "Posts créables" ON community_posts;
CREATE POLICY "Posts créables" ON community_posts FOR INSERT WITH CHECK (auth.uid() = auteur_id);
DROP POLICY IF EXISTS "Posts modifiables" ON community_posts;
CREATE POLICY "Posts modifiables" ON community_posts FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Posts supprimables" ON community_posts;
CREATE POLICY "Posts supprimables" ON community_posts FOR DELETE USING (auth.uid() = auteur_id);
-- Réponses
DROP POLICY IF EXISTS "Replies visibles" ON community_replies;
CREATE POLICY "Replies visibles" ON community_replies FOR SELECT USING (true);
DROP POLICY IF EXISTS "Replies créables" ON community_replies;
CREATE POLICY "Replies créables" ON community_replies FOR INSERT WITH CHECK (auth.uid() = auteur_id);
DROP POLICY IF EXISTS "Replies supprimables" ON community_replies;
CREATE POLICY "Replies supprimables" ON community_replies FOR DELETE USING (auth.uid() = auteur_id);
-- TEMPS RÉEL
ALTER PUBLICATION supabase_realtime ADD TABLE community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE community_replies;
-- VÉRIFICATION
SELECT 'Tables communauté créées !' as message;
SELECT COUNT(*) as nb_posts FROM community_posts;