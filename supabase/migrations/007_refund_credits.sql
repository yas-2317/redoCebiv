-- ============================================================
-- 007_refund_credits.sql
-- クレジット返金関数（Inngest enqueue 失敗時の補償）
-- ============================================================

CREATE OR REPLACE FUNCTION refund_credits(
  p_user_id    UUID,
  p_amount     INTEGER,
  p_project_id UUID DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET credit_balance = credit_balance + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO credit_transactions (user_id, amount, action_type, project_id)
  VALUES (p_user_id, p_amount, 'manual_adjustment', p_project_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
