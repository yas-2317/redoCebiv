-- ============================================================
-- 011_rate_limits.sql
-- rate_limits テーブル + check_rate_limit RPC を追加
-- ============================================================

CREATE TABLE IF NOT EXISTS rate_limits (
  scope         TEXT NOT NULL,
  actor_key     TEXT NOT NULL,
  window_start  TIMESTAMPTZ NOT NULL,
  count         INTEGER NOT NULL DEFAULT 0 CHECK (count >= 0),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (scope, actor_key, window_start)
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_updated_at
  ON rate_limits(updated_at DESC);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON rate_limits FROM anon, authenticated;

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_scope          TEXT,
  p_actor_key      TEXT,
  p_limit          INTEGER,
  p_window_seconds INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_bucket_start TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  IF p_scope IS NULL OR p_scope = '' THEN
    RAISE EXCEPTION 'scope is required';
  END IF;

  IF p_actor_key IS NULL OR p_actor_key = '' THEN
    RAISE EXCEPTION 'actor_key is required';
  END IF;

  IF p_limit <= 0 THEN
    RAISE EXCEPTION 'limit must be positive';
  END IF;

  IF p_window_seconds <= 0 THEN
    RAISE EXCEPTION 'window_seconds must be positive';
  END IF;

  v_bucket_start := to_timestamp(
    floor(extract(epoch from NOW()) / p_window_seconds) * p_window_seconds
  );

  INSERT INTO rate_limits (scope, actor_key, window_start, count, created_at, updated_at)
  VALUES (p_scope, p_actor_key, v_bucket_start, 1, NOW(), NOW())
  ON CONFLICT (scope, actor_key, window_start)
  DO UPDATE SET
    count = rate_limits.count + 1,
    updated_at = NOW()
  RETURNING count INTO v_count;

  DELETE FROM rate_limits
  WHERE updated_at < NOW() - INTERVAL '7 days';

  RETURN v_count <= p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_rate_limit(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
