-- Supabase用ダミーデータ投入SQL

-- チーム（春組・夏組・秋組・冬組）
INSERT INTO teams (id, name, color) VALUES
  ('11111111-1111-1111-1111-111111111111', '春組', '#ffb6c1'),
  ('22222222-2222-2222-2222-222222222222', '夏組', '#ffd700'),
  ('33333333-3333-3333-3333-333333333333', '秋組', '#ff8c00'),
  ('44444444-4444-4444-4444-444444444444', '冬組', '#87ceeb');

-- スライド（例）
INSERT INTO slides (id, filename, "order") VALUES
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', 'slide1.jpg', 1),
  ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaa2', 'slide2.jpg', 2),
  ('aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaa3', 'slide3.jpg', 3);

-- 得点（初期値）
INSERT INTO scores (id, team_id, score, visible) VALUES
  ('55555555-5555-5555-5555-555555555555', '11111111-1111-1111-1111-111111111111', 100, true),
  ('66666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', 120, true),
  ('77777777-7777-7777-7777-777777777777', '33333333-3333-3333-3333-333333333333', 80, true),
  ('88888888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-444444444444', 90, true);

-- スライド状態
INSERT INTO slide_state (id, current_slide, effect) VALUES
  (1, 'aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaa1', NULL)
  ON CONFLICT (id) DO UPDATE SET current_slide = EXCLUDED.current_slide, effect = EXCLUDED.effect;

-- 得点表示状態
INSERT INTO score_state (id, visible) VALUES
  (1, true)
  ON CONFLICT (id) DO UPDATE SET visible = EXCLUDED.visible;
