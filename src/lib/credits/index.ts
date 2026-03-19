import { createClient } from '@/lib/supabase/server'

export class InsufficientCreditsError extends Error {
  constructor() {
    super('INSUFFICIENT_CREDITS')
    this.name = 'InsufficientCreditsError'
  }
}

export async function consumeCredits(
  userId: string,
  amount: number,
  actionType: string,
  projectId?: string
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('consume_credits', {
    p_user_id: userId,
    p_amount: amount,
    p_action: actionType,
    p_project_id: projectId ?? null,
  })

  if (error) throw new Error(`consumeCredits error: ${error.message}`)
  return data as boolean
}
