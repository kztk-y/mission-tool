-- Google Calendar連携トークン管理テーブル
-- Supabase SQL Editorで実行してください

-- google_tokensテーブル作成
CREATE TABLE IF NOT EXISTS public.google_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expiry_date BIGINT,
  token_type TEXT,
  scope TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 1ユーザーにつき1トークンのみ
  CONSTRAINT unique_user_token UNIQUE (user_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_google_tokens_user_id ON public.google_tokens(user_id);

-- RLS (Row Level Security) 有効化
ALTER TABLE public.google_tokens ENABLE ROW LEVEL SECURITY;

-- RLSポリシー: ユーザーは自分のトークンのみアクセス可能
CREATE POLICY "Users can view own tokens"
  ON public.google_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tokens"
  ON public.google_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tokens"
  ON public.google_tokens
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tokens"
  ON public.google_tokens
  FOR DELETE
  USING (auth.uid() = user_id);

-- updated_at自動更新用トリガー
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_google_tokens_updated_at
  BEFORE UPDATE ON public.google_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- コメント追加
COMMENT ON TABLE public.google_tokens IS 'Google Calendar連携用のOAuth 2.0トークン保存テーブル';
COMMENT ON COLUMN public.google_tokens.user_id IS 'トークンの所有者（auth.usersへの外部キー）';
COMMENT ON COLUMN public.google_tokens.access_token IS 'Google APIアクセストークン';
COMMENT ON COLUMN public.google_tokens.refresh_token IS 'トークン更新用のリフレッシュトークン';
COMMENT ON COLUMN public.google_tokens.expiry_date IS 'トークンの有効期限（Unix timestamp）';
COMMENT ON COLUMN public.google_tokens.scope IS '認可されたスコープ（カンマ区切り）';
