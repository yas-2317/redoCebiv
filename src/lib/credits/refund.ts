import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js'

type RefundClient = SupabaseClient

type RefundCreditsArgs = {
  userId: string
  amount: number
  projectId?: string | null
}

type RefundCreditsResult = {
  error: { message: string } | null
}

function callRefundCreditsRpc(
  client: RefundClient,
  args: RefundCreditsArgs
): Promise<RefundCreditsResult> {
  return (client.rpc as unknown as (
    fn: 'refund_credits',
    params: {
      p_user_id: string
      p_amount: number
      p_project_id: string | null
    }
  ) => Promise<RefundCreditsResult>)('refund_credits', {
    p_user_id: args.userId,
    p_amount: args.amount,
    p_project_id: args.projectId ?? null,
  })
}

export function createRefundClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function refundCredits(
  client: RefundClient,
  args: RefundCreditsArgs
) {
  return callRefundCreditsRpc(client, args)
}
