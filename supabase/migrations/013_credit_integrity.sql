-- ============================================================
-- 013_credit_integrity.sql
-- Sliding-window rate limits + RPC grants for credit operations
-- ============================================================

CREATE TABLE IF NOT EXISTS rate_limit_requests (
  id           BIGSERIAL PRIMARY KEY,
  scope        TEXT NOT NULL,
  actor_key    TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_requests_lookup
  ON rate_limit_requests(scope, actor_key, requested_at DESC);

ALTER TABLE rate_limit_requests ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON rate_limit_requests FROM anon, authenticated;

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_scope          TEXT,
  p_actor_key      TEXT,
  p_limit          INTEGER,
  p_window_seconds INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
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

  v_window_start := NOW() - make_interval(secs => p_window_seconds);

  DELETE FROM rate_limit_requests
  WHERE scope = p_scope
    AND actor_key = p_actor_key
    AND requested_at < NOW() - INTERVAL '7 days';

  SELECT COUNT(*) INTO v_count
  FROM rate_limit_requests
  WHERE scope = p_scope
    AND actor_key = p_actor_key
    AND requested_at > v_window_start;

  IF v_count >= p_limit THEN
    RETURN FALSE;
  END IF;

  INSERT INTO rate_limit_requests (scope, actor_key, requested_at)
  VALUES (p_scope, p_actor_key, NOW());

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_rate_limit(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION consume_credits(UUID, INTEGER, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION refund_credits(UUID, INTEGER, UUID) TO authenticated;
