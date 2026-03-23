export const PLANS = {
  wanderer: {
    label: 'Wanderer',
    monthlyPrice: 0,
    monthlyCredits: 3,
    creditCap: 30,
    displayMax: 30,
    topUp: false,
  },
  tracer: {
    label: 'Tracer',
    monthlyPrice: 5,
    monthlyCredits: 80,
    creditCap: null,
    displayMax: 80,
    topUp: true,
  },
  navigator: {
    label: 'Navigator',
    monthlyPrice: 12,
    monthlyCredits: 250,
    creditCap: null,
    displayMax: 250,
    topUp: true,
  },
} as const

export type PlanKey = keyof typeof PLANS

export type BillingAction =
  | 'initial_analysis'
  | 'trace_generate'
  | 'change_proposal'
  | 'challenge_grade'

export const CREDIT_COSTS = {
  initial_analysis: 5,
  trace_generate: 1,
  change_proposal: 2,
  challenge_grade: 0,
} as const

export const TOP_UP = {
  credits: 100,
  priceUsd: 5,
}

export function getPlanInfo(plan: string) {
  return PLANS[plan as PlanKey] ?? PLANS.wanderer
}

export function getCreditCost(action: BillingAction) {
  return CREDIT_COSTS[action]
}
