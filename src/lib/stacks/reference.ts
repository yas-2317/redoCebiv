export type StackRole =
  | 'Meta framework'
  | 'UI library'
  | 'UI framework'
  | 'Web framework'
  | 'Mobile framework'
  | 'Language'
  | 'Apple platform language'
  | 'Build tool'
  | 'Backend framework'
  | 'ORM'
  | 'BaaS'

export type StackAlternative = {
  label: string
  slug: string
  vs: string
}

export type StackEntry = {
  label: string
  slug: string
  role: StackRole
  description: string
  bestFor: string
  alternatives: StackAlternative[]
}

export const STACK_REFERENCE: StackEntry[] = [
  // ── Meta frameworks ──────────────────────────────────────────
  {
    label: 'Next.js',
    slug: 'nextjs',
    role: 'Meta framework',
    description:
      'A full-stack framework built on React. With App Router, layouts, file-based routing, Server Components / Client Components, Route Handlers, and Server Functions can all be managed in one repository.',
    bestFor:
      'Web apps where SEO matters, when you want to manage front-end and back-end in the same repo, or when you want to use the React ecosystem alongside SSR and server-side processing.',
    alternatives: [
      {
        label: 'Remix',
        slug: 'remix',
        vs: 'Also offers a React-based full-stack experience. Remix-style loader/action data flow and a Web Standards-oriented design can be more intuitive.',
      },
      {
        label: 'Vite',
        slug: 'vite',
        vs: 'A build tool. For SPAs without SSR, setup is minimal and simple. Server-side features need to be added separately.',
      },
    ],
  },
  {
    label: 'Nuxt',
    slug: 'nuxt',
    role: 'Meta framework',
    description:
      'A full-stack framework built on Vue. Provides file-based routing, SSR/SSG, and server features; Nitro makes it easy to deploy to Node.js, serverless, and edge environments.',
    bestFor:
      'When you want SSR or full-stack development while using Vue. Teams familiar with the Vue ecosystem.',
    alternatives: [
      {
        label: 'Vue',
        slug: 'vue',
        vs: 'Vue alone is simpler if you want to start light with an SPA without SSR or conventions. Nuxt provides a ready-made structure that makes it easy to set up a production-ready foundation from the start.',
      },
    ],
  },
  {
    label: 'SvelteKit',
    slug: 'sveltekit',
    role: 'Meta framework',
    description:
      'A full-stack framework built on Svelte. Comes with file-based routing, SSR, form handling, and server features, letting you build apps that take advantage of Svelte\'s lightweight runtime characteristics.',
    bestFor:
      'When performance is a priority, when you want to avoid virtual DOM overhead, or when you want to build web apps with relatively less code.',
    alternatives: [
      {
        label: 'Next.js',
        slug: 'nextjs',
        vs: 'React-based, with a broader ecosystem and third-party libraries. SvelteKit\'s strength is its lightweight nature and concise syntax.',
      },
    ],
  },
  {
    label: 'Remix',
    slug: 'remix',
    role: 'Meta framework',
    description:
      'A React-based framework experience that inherits the Remix philosophy. The latest framework features are now integrated into React Router v7, enabling loader/action-based data flow, server rendering, pre-rendering, streaming, and type generation.',
    bestFor:
      'Form-heavy apps, when you want to prioritize Web standards, when you want clear separation of data fetching and submission concerns, or when you want to leverage nested routing.',
    alternatives: [
      {
        label: 'Next.js',
        slug: 'nextjs',
        vs: 'Next.js has more resources and integrations. Remix-style excels in its Web Standards-oriented design and the clarity of loader/action data flow.',
      },
    ],
  },
  {
    label: 'Astro',
    slug: 'astro',
    role: 'Meta framework',
    description:
      'A framework for content-focused websites. Adopts Islands Architecture that minimizes JavaScript by default, outputting mostly static HTML for fast page loads. React/Vue/Svelte components can be mixed together.',
    bestFor:
      'Content-centric sites like blogs, documentation sites, and marketing pages. When SEO and performance are the top priority.',
    alternatives: [
      {
        label: 'Next.js',
        slug: 'nextjs',
        vs: 'Next.js is suited for interactive apps. Astro is ideal for static-content-heavy sites where only specific parts need to be interactive.',
      },
    ],
  },

  // ── UI libraries / frameworks ────────────────────────────────
  {
    label: 'React',
    slug: 'react',
    role: 'UI library',
    description:
      'A library for building UIs using a component-based approach. With a clear model for state management and rendering, it serves as the foundation for many frameworks including Next.js, Remix, and React Native.',
    bestFor:
      'When you want to leverage a rich ecosystem. When the team has React experience. When you want to build with plain React without committing to a specific framework.',
    alternatives: [
      {
        label: 'Vue',
        slug: 'vue',
        vs: 'Vue\'s template syntax is more familiar to traditional HTML/CSS developers and easier to adopt incrementally. React\'s strength is its JS/TS-centric design and broad ecosystem.',
      },
      {
        label: 'Svelte',
        slug: 'svelte',
        vs: 'Svelte is optimized at compile time for a lightweight runtime. React has more resources and library choices.',
      },
    ],
  },
  {
    label: 'Vue',
    slug: 'vue',
    role: 'UI framework',
    description:
      'A progressive JavaScript UI framework. While based on standard HTML/CSS/JavaScript, it makes it easy to build UIs with Single File Components (.vue) and reactive state management.',
    bestFor:
      'Developers with an HTML/CSS background, when you want to incrementally add interactivity to existing HTML pages, or when you prefer less complex syntax.',
    alternatives: [
      {
        label: 'React',
        slug: 'react',
        vs: 'React has a larger ecosystem and more adoption. Vue\'s strength is its approachable syntax and ease of incremental adoption.',
      },
    ],
  },
  {
    label: 'Svelte',
    slug: 'svelte',
    role: 'UI framework',
    description:
      'A UI framework that uses a compiler. Components are optimized at build time and converted into small, efficient JavaScript, resulting in minimal browser-side overhead.',
    bestFor:
      'When bundle size and performance matter. Small to medium projects. When you want to build UIs with less code.',
    alternatives: [
      {
        label: 'React',
        slug: 'react',
        vs: 'React has more resources and libraries. Svelte is more concise and achieves a lighter runtime.',
      },
    ],
  },
  {
    label: 'Angular',
    slug: 'angular',
    role: 'Web framework',
    description:
      'A web framework with Google-led development. Components, dependency injection (DI), routing, forms, and HTTP functionality are all integrated, making it easy to maintain structure in large-scale apps.',
    bestFor:
      'Large-scale enterprise apps, teams that need strong conventions and standardization, developers with a Java/C# background.',
    alternatives: [
      {
        label: 'React',
        slug: 'react',
        vs: 'React is a UI-focused library with more flexibility. Angular is a fully integrated framework that\'s easy to develop with convention-based approaches.',
      },
    ],
  },

  // ── Mobile ───────────────────────────────────────────────────
  {
    label: 'React Native',
    slug: 'react-native',
    role: 'Mobile framework',
    description:
      'A framework for building iOS/Android apps with React. Renders using native UI components rather than WebView. Often used in combination with Expo.',
    bestFor:
      'When you want to leverage React knowledge to build mobile apps, or when you want to cover iOS/Android with a single codebase.',
    alternatives: [
      {
        label: 'Flutter',
        slug: 'flutter',
        vs: 'Uses Dart and renders with its own engine, making it easier to maintain visual consistency. React Native is better for leveraging existing React/JS assets.',
      },
      {
        label: 'Swift',
        slug: 'swift',
        vs: 'Native iOS development. Strong integration with Apple platforms and latest API support, but primarily iOS-focused.',
      },
    ],
  },
  {
    label: 'Flutter',
    slug: 'flutter',
    role: 'Mobile framework',
    description:
      'A framework for building iOS/Android/Web/desktop apps using Google\'s Dart language. Its custom rendering engine makes it easy to create consistent UIs that aren\'t dependent on the platform.',
    bestFor:
      'When you want a strongly unified look across iOS and Android, when UI expressiveness is a priority, or when you want to expand to platforms beyond mobile (Web/desktop).',
    alternatives: [
      {
        label: 'React Native',
        slug: 'react-native',
        vs: 'Can leverage React/JavaScript knowledge. Uses native components, so it naturally fits the OS\'s visual style.',
      },
    ],
  },
  {
    label: 'Swift',
    slug: 'swift',
    role: 'Apple platform language',
    description:
      'A programming language developed by Apple. Core to Apple platform development across iOS, iPadOS, macOS, watchOS, and tvOS; can be combined with SwiftUI to build declarative UIs.',
    bestFor:
      'When you want deep integration with Apple\'s latest features (SwiftUI, Core ML, WidgetKit, etc.) for iOS apps. When you prioritize the best Apple platform experience.',
    alternatives: [
      {
        label: 'React Native',
        slug: 'react-native',
        vs: 'Enables cross-platform iOS/Android development. Can leverage the JavaScript ecosystem, but Apple-specific feature integration is less direct than with Swift.',
      },
      {
        label: 'Flutter',
        slug: 'flutter',
        vs: 'Well-suited for iOS/Android cross-platform development. Visual consistency is high, but it\'s more distant from Apple native APIs than Swift.',
      },
    ],
  },

  // ── Language / Runtime ───────────────────────────────────────
  {
    label: 'TypeScript',
    slug: 'typescript',
    role: 'Language',
    description:
      'A language that adds a static type system to JavaScript. Detects type errors at compile time, significantly improving bug detection and IDE code completion. Compiles down to JavaScript.',
    bestFor:
      'Medium to large projects, team development, projects requiring long-term maintenance. Also works well with AI code generation.',
    alternatives: [
      {
        label: 'JavaScript',
        slug: 'javascript',
        vs: 'Can be written quickly without type definitions, but lack of type safety becomes a problem at scale. Sufficient for prototypes or small scripts.',
      },
    ],
  },
  {
    label: 'Python',
    slug: 'python',
    role: 'Language',
    description:
      'A highly readable general-purpose programming language. Used widely for web backends, data processing, machine learning, and scripting. Particularly strong ecosystem in the AI/ML space.',
    bestFor:
      'AI/ML projects, data processing, backend APIs (FastAPI/Django), prototyping.',
    alternatives: [
      {
        label: 'TypeScript',
        slug: 'typescript',
        vs: 'TypeScript is stronger for web frontends and Node.js backends. Python has a rich library ecosystem for AI/ML and data processing.',
      },
    ],
  },
  {
    label: 'Ruby on Rails',
    slug: 'ruby-on-rails',
    role: 'Web framework',
    description:
      'A full-stack web framework written in Ruby. Its "convention over configuration" philosophy enables a lot of functionality with minimal code. MVC structure, ORM (Active Record), and migrations are integrated.',
    bestFor:
      'Rapid prototyping and MVP development, CRUD-heavy web apps, early-stage startup products.',
    alternatives: [
      {
        label: 'Next.js',
        slug: 'nextjs',
        vs: 'Next.js is a strong choice for full-stack development in the TypeScript/JavaScript ecosystem. Rails excels in its convention strength and development speed.',
      },
    ],
  },

  // ── CSS ──────────────────────────────────────────────────────
  {
    label: 'Tailwind',
    slug: 'tailwind',
    role: 'UI framework',
    description:
      'A utility-first CSS framework. Style by combining small classes like `flex`, `pt-4`, and `text-gray-700` directly. Reduces the amount of custom CSS you need to write.',
    bestFor:
      'When combining with component-based UI frameworks (React/Vue). When you want flexible customization of a design system. Also works well with AI code generation.',
    alternatives: [
      {
        label: 'CSS Modules',
        slug: 'css-modules',
        vs: 'Writes scoped CSS per component. Regular CSS syntax can be used as-is, but tends to require more styling code than Tailwind.',
      },
    ],
  },

  // ── Build tools ──────────────────────────────────────────────
  {
    label: 'Vite',
    slug: 'vite',
    role: 'Build tool',
    description:
      'A fast front-end build tool leveraging ES Modules. Dev server starts fast, and HMR (Hot Module Replacement) is snappy. Templates for major frameworks like React, Vue, and Svelte are available.',
    bestFor:
      'SPA development without SSR, when you want to build with just React/Vue without a meta-framework, when you want a fast development experience.',
    alternatives: [
      {
        label: 'Next.js',
        slug: 'nextjs',
        vs: 'Next.js is an integrated framework with SSR/SSG/server processing. Vite is suitable for when you want to start front-end development simply.',
      },
    ],
  },

  // ── Backend ──────────────────────────────────────────────────
  {
    label: 'Express',
    slug: 'express',
    role: 'Backend framework',
    description:
      'One of the most widely used web frameworks for Node.js. Provides minimal structure only, building APIs and web servers by stacking middleware. Highly flexible, but conventions need to be defined yourself.',
    bestFor:
      'Lightweight API servers, maintaining existing Express codebases, when you want fine-grained control over Node.js.',
    alternatives: [
      {
        label: 'Hono',
        slug: 'hono',
        vs: 'Hono has a more modern API design and strong edge support. Express has years of proven use and many surrounding middlewares.',
      },
      {
        label: 'NestJS',
        slug: 'nestjs',
        vs: 'NestJS has strong conventions and structure, easier to align in large team development. Express can be started more lightly.',
      },
    ],
  },
  {
    label: 'Hono',
    slug: 'hono',
    role: 'Backend framework',
    description:
      'A lightweight and fast web framework. Runs on many runtimes including Cloudflare Workers, Deno, Bun, and Node.js. Works well with TypeScript and is suited for lightweight API servers and edge deployments.',
    bestFor:
      'APIs on Edge Runtime (Cloudflare Workers / Vercel Edge), when lightweight APIs are needed, when you want simple TypeScript-first configuration.',
    alternatives: [
      {
        label: 'Express',
        slug: 'express',
        vs: 'Express has a wealth of proven track record and resources. Hono\'s strengths are its lightweight nature, cross-runtime compatibility, and edge suitability.',
      },
    ],
  },
  {
    label: 'NestJS',
    slug: 'nestjs',
    role: 'Backend framework',
    description:
      'A TypeScript-first Node.js framework. Adopts DI (dependency injection) and decorator syntax similar to Angular, making it easy to unify code structure in large-scale apps. Can use Express or Fastify internally.',
    bestFor:
      'Large-scale backend APIs, when you want to unify conventions in team development, or when you need modular structure or enterprise-oriented design.',
    alternatives: [
      {
        label: 'Express',
        slug: 'express',
        vs: 'Express is simple with high flexibility. NestJS has strong structure and conventions, maintaining clarity even at scale.',
      },
    ],
  },
  {
    label: 'Fastify',
    slug: 'fastify',
    role: 'Backend framework',
    description:
      'A high-performance web framework for Node.js. Strong in low overhead and plugin architecture, and works well with JSON Schema-based validation and serialization.',
    bestFor:
      'API servers where performance is critical, when type-safe validation is needed, when you want a lighter implementation than Express.',
    alternatives: [
      {
        label: 'Express',
        slug: 'express',
        vs: 'Express is easy to get started with and has many learning resources. Fastify\'s strengths are low overhead and schema-driven design.',
      },
    ],
  },

  // ── ORM / DB ─────────────────────────────────────────────────
  {
    label: 'Prisma',
    slug: 'prisma',
    role: 'ORM',
    description:
      'A type-safe ORM for Node.js / TypeScript. Define your DB schema in `schema.prisma` and TypeScript types with a Prisma Client are auto-generated. Also handles migration management.',
    bestFor:
      'When you want type safety for DB access in TypeScript projects, when you want schema-first DB design, or when you want to manage migrations in code.',
    alternatives: [
      {
        label: 'Drizzle',
        slug: 'drizzle',
        vs: 'Drizzle uses a more SQL-like syntax and is lightweight. Also easier to handle in serverless/edge environments. Prisma excels in type generation and schema management experience.',
      },
      {
        label: 'Supabase',
        slug: 'supabase',
        vs: 'Supabase is a BaaS, not an ORM. Great if you want auth, storage, and more all bundled together. Prisma offers more flexibility for custom designs.',
      },
    ],
  },
  {
    label: 'Drizzle',
    slug: 'drizzle',
    role: 'ORM',
    description:
      'A lightweight TypeScript-first ORM. You can write queries in SQL-like syntax, making it approachable for those familiar with raw SQL. Small bundle size and works well with serverless/edge configurations.',
    bestFor:
      'When you know SQL and don\'t need heavy ORM abstraction, DB connections in Edge Runtime, or when you want a lighter solution than Prisma.',
    alternatives: [
      {
        label: 'Prisma',
        slug: 'prisma',
        vs: 'Prisma has powerful schema-driven type generation and migration management. Drizzle is lighter and closer to SQL.',
      },
    ],
  },
  {
    label: 'Supabase',
    slug: 'supabase',
    role: 'BaaS',
    description:
      'A development platform centered on PostgreSQL, integrating authentication, storage, Realtime, Edge Functions, and APIs. Lets you quickly assemble backend functionality starting from the database.',
    bestFor:
      'When you want to minimize backend code, when you want to quickly set up auth and a database, or when you need real-time features. Also works well with AI code generation.',
    alternatives: [
      {
        label: 'Prisma',
        slug: 'prisma',
        vs: 'Prisma is ORM-only, used in combination with your own DB and backend setup. Supabase provides auth, storage, and more in one integrated platform.',
      },
      {
        label: 'Drizzle',
        slug: 'drizzle',
        vs: 'Drizzle is often used to connect to Supabase\'s Postgres. Supabase is the full BaaS, Drizzle is the DB access layer.',
      },
    ],
  },
]

export function getStackEntry(slug: string): StackEntry | undefined {
  return STACK_REFERENCE.find(s => s.slug === slug)
}

export function labelToSlug(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

export function getStackByLabel(label: string): StackEntry | undefined {
  const normalized = labelToSlug(label)
  return STACK_REFERENCE.find(
    s => s.label === label || s.slug === normalized || labelToSlug(s.label) === normalized
  )
}
