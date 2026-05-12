-- 子画面への一時的な重ねレイヤー演出リクエスト用テーブル
CREATE TABLE IF NOT EXISTS overlay_effects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  effect_type text NOT NULL, -- 例: 'fever', 'warning', 'sakura', ...
  requested_at timestamptz DEFAULT now(),
  consumed boolean NOT NULL DEFAULT false -- 子画面で消化済みか
);

-- RLS有効化
ALTER TABLE overlay_effects ENABLE ROW LEVEL SECURITY;

-- 全員読み書き可（必要に応じて制限）
CREATE POLICY "Allow all select" ON overlay_effects FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON overlay_effects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON overlay_effects FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON overlay_effects FOR DELETE USING (true);
