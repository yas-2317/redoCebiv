const PRIMARY_STACK_ORDER = [
  'Flutter',
  'Swift',
  'Ruby on Rails',
  'Python',
  'Vue',
  'Nuxt',
  'Svelte',
  'SvelteKit',
  'Next.js',
  'React',
] as const

export function getPrimaryStack(projectStack: string[] = []): string | null {
  for (const label of PRIMARY_STACK_ORDER) {
    if (projectStack.includes(label)) return label
  }

  return projectStack[0] ?? null
}
