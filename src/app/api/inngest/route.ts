import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { analyzeProject, analyzeProjectOnFailure } from '@/lib/inngest/functions/analyze-project'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [analyzeProject, analyzeProjectOnFailure],
})
