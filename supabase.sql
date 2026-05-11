--
-- 【Supabaseコンソールで実行すべき追加操作】
--
-- 1. Storageバケット作成
--    - バケット名: slides
--    - アクセス: public（スライド画像用）
--
-- 2. Database > テーブル > Realtime有効化
--    - scores, slide_state, score_state テーブルでRealtimeを有効化
--
-- 3. API > テーブルごとの自動生成APIエンドポイント確認
--    - 必要に応じてAPIキーやエンドポイントを確認
--
-- 4. サービスロールキーの管理
--    - 必要に応じて.env.local等で管理
--
-- 5. 必要に応じてStorageバケットのCORS設定
--
-- Supabase用DB設計・初期化SQL
-- 実行順・依存関係・RLS有効化に注意

-- 1. チームテーブル
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text,
  created_at timestamptz DEFAULT now()
);

-- 2. スライドテーブル
CREATE TABLE IF NOT EXISTS slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  "order" int NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. 得点テーブル
CREATE TABLE IF NOT EXISTS scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  score int NOT NULL DEFAULT 0,
  visible boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT one_score_per_team UNIQUE (team_id)
);

-- 4. スライド状態同期用テーブル
CREATE TABLE IF NOT EXISTS slide_state (
  id int PRIMARY KEY DEFAULT 1,
  current_slide uuid REFERENCES slides(id),
  effect text,
  updated_at timestamptz DEFAULT now()
);

-- 5. 得点状態同期用テーブル
CREATE TABLE IF NOT EXISTS score_state (
  id int PRIMARY KEY DEFAULT 1,
  visible boolean NOT NULL DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

-- 6. RLS有効化
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE slides ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE slide_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_state ENABLE ROW LEVEL SECURITY;

-- 7. RLSポリシー（全員読み書き可: 必要に応じて制限を追加）
CREATE POLICY "Allow all select" ON teams FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON teams FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON teams FOR DELETE USING (true);

CREATE POLICY "Allow all select" ON slides FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON slides FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON slides FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON slides FOR DELETE USING (true);

CREATE POLICY "Allow all select" ON scores FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON scores FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON scores FOR DELETE USING (true);

CREATE POLICY "Allow all select" ON slide_state FOR SELECT USING (true);
CREATE POLICY "Allow all update" ON slide_state FOR UPDATE USING (true);

CREATE POLICY "Allow all select" ON score_state FOR SELECT USING (true);
CREATE POLICY "Allow all update" ON score_state FOR UPDATE USING (true);

-- 8. 初期データ投入例（必要に応じて）
-- INSERT INTO teams (name, color) VALUES ('赤組', '#ff0000'), ('白組', '#ffffff'), ('青組', '#0000ff');
-- INSERT INTO slide_state (id, current_slide, effect) VALUES (1, NULL, NULL);
-- INSERT INTO score_state (id, visible) VALUES (1, true);
