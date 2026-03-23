import { createHash } from 'crypto'
import { unzipSync } from 'fflate'
import { getPrimaryStack } from '@/lib/stacks/primary'

export interface ExtractedFile {
  path: string
  content: string
  language: string | null
  sizeBytes: number
}

const ZIP_MAGIC_BYTES = [0x50, 0x4b, 0x03, 0x04]
const MAX_EXTRACTED_TOTAL_BYTES = 100 * 1024 * 1024
const MAX_EXTRACTED_FILES = 3000
const MAX_EXTRACTED_FILE_BYTES = 2 * 1024 * 1024
const MAX_PATH_LENGTH = 240
const MAX_PATH_DEPTH = 12

const EXCLUDE_PATTERNS = [
  /^node_modules\//,
  /\/node_modules\//,
  /^\.git\//,
  /\/\.git\//,
  /^\.next\//,
  /\/\.next\//,
  /^dist\//,
  /\/dist\//,
  /^build\//,
  /\/build\//,
  /^out\//,
  /\/out\//,
  /\.lock$/,
  /\.map$/,
  /\.min\.js$/,
  /\.min\.css$/,
]

const SECRET_FILE_PATTERNS = [
  /(^|\/)\.env(\..+)?$/i,
  /(^|\/)\.npmrc$/i,
  /(^|\/)\.yarnrc(\.yml)?$/i,
  /(^|\/)id_(rsa|dsa|ecdsa|ed25519)$/i,
  /\.(pem|key|p12|pfx|crt|cer)$/i,
  /(^|\/)(credentials|service-account|firebase-adminsdk)[^/]*\.json$/i,
]

const SECRET_CONTENT_PATTERNS = [
  /sk-ant-[a-z0-9\-_]+/i,
  /sk-[a-z0-9]{20,}/i,
  /SUPABASE_SERVICE_ROLE_KEY\s*=/,
  /ANTHROPIC_API_KEY\s*=/,
  /OPENAI_API_KEY\s*=/,
  /AWS_SECRET_ACCESS_KEY\s*=/,
  /BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY/,
]

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico',
  '.woff', '.woff2', '.ttf', '.eot',
  '.zip', '.tar', '.gz',
  '.pdf', '.doc', '.docx',
  '.mp4', '.mp3', '.mov',
])

const LANGUAGE_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'tsx',
  '.js': 'javascript',
  '.jsx': 'jsx',
  '.dart': 'dart',
  '.swift': 'swift',
  '.rb': 'ruby',
  '.py': 'python',
  '.vue': 'vue',
  '.svelte': 'svelte',
  '.css': 'css',
  '.json': 'json',
  '.md': 'markdown',
  '.mdx': 'mdx',
  '.html': 'html',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.sql': 'sql',
  '.sh': 'shell',
}

function getExtension(path: string): string {
  const parts = path.split('.')
  return parts.length > 1 ? `.${parts[parts.length - 1].toLowerCase()}` : ''
}

function getLanguage(path: string): string | null {
  return LANGUAGE_MAP[getExtension(path)] ?? null
}

function shouldExclude(path: string): boolean {
  if (path.startsWith('__MACOSX/') || path.includes('/__MACOSX/')) return true
  if (path.endsWith('.DS_Store')) return true
  if (EXCLUDE_PATTERNS.some(p => p.test(path))) return true
  if (BINARY_EXTENSIONS.has(getExtension(path))) return true
  return false
}

function isUnsafeArchivePath(path: string): boolean {
  if (path.length > MAX_PATH_LENGTH) return true
  if (path.startsWith('/') || path.startsWith('\\')) return true
  if (path.includes('..') || path.includes('\0')) return true

  const segments = path.split('/').filter(Boolean)
  if (segments.length > MAX_PATH_DEPTH) return true
  if (segments.some(segment => segment === '.' || segment === '..')) return true

  return false
}

export function shouldExcludeFromAI(path: string, content: string): boolean {
  if (SECRET_FILE_PATTERNS.some(pattern => pattern.test(path))) return true
  if (SECRET_CONTENT_PATTERNS.some(pattern => pattern.test(content))) return true
  return false
}

export function hasZipMagicBytes(buffer: Buffer): boolean {
  return ZIP_MAGIC_BYTES.every((byte, index) => buffer[index] === byte)
}

export function estimateTokens(content: string): number {
  return Math.ceil(content.length * 0.5)
}

export function extractZip(buffer: Buffer): { files: ExtractedFile[]; hash: string } {
  if (!hasZipMagicBytes(buffer)) {
    throw new Error('Invalid ZIP signature')
  }

  const hash = createHash('sha256').update(buffer).digest('hex')

  const uint8 = new Uint8Array(buffer)
  const unzipped = unzipSync(uint8)

  const files: ExtractedFile[] = []
  let totalExtractedBytes = 0

  for (const [filePath, fileData] of Object.entries(unzipped)) {
    // ディレクトリエントリはスキップ（パスが / で終わる）
    if (filePath.endsWith('/')) continue
    if (isUnsafeArchivePath(filePath)) {
      throw new Error(`Unsafe ZIP entry path: ${filePath}`)
    }
    if (fileData.length > MAX_EXTRACTED_FILE_BYTES) {
      throw new Error(`ZIP entry too large: ${filePath}`)
    }

    totalExtractedBytes += fileData.length
    if (totalExtractedBytes > MAX_EXTRACTED_TOTAL_BYTES) {
      throw new Error('ZIP extracted payload too large')
    }

    if (shouldExclude(filePath)) continue

    const content = Buffer.from(fileData).toString('utf-8')
    // null byte があればバイナリとみなしてスキップ
    if (content.includes('\x00')) continue

    files.push({
      path: filePath,
      content,
      language: getLanguage(filePath),
      sizeBytes: fileData.length,
    })

    if (files.length > MAX_EXTRACTED_FILES) {
      throw new Error('Too many files in ZIP archive')
    }
  }

  return { files, hash }
}

export function selectFilesForAnalysis(
  files: ExtractedFile[],
  maxTokens = 150_000,
  projectStack: string[] = []
): ExtractedFile[] {
  const EXCLUDE_FOR_AI = [
    /\.test\.(ts|tsx|js|jsx|dart|py|rb)$/,
    /\.spec\.(ts|tsx|js|jsx|dart|py|rb)$/,
    /\.d\.ts$/,
    /\.stories\.(ts|tsx)$/,
    /(^|\/)tests?\//,
    /(^|\/)__tests__\//,
    /(^|\/)spec\//,
  ]

  const priority1: ExtractedFile[] = []
  const priority2: ExtractedFile[] = []
  const priority3: ExtractedFile[] = []
  const primaryStack = getPrimaryStack(projectStack)

  // The primary stack is resolved once and then reused so file selection stays
  // aligned with prompt selection when multiple stacks are detected.
  const isPriority1 = (path: string) => {
    if (primaryStack === 'Flutter') {
      return /^(lib|bin)\/.*\.dart$/.test(path)
    }
    if (primaryStack === 'Swift') {
      return /(^|\/)(Sources|Views|ViewModels|Models|Services|Features)\//.test(path) || /\.swift$/.test(path)
    }
    if (primaryStack === 'Ruby on Rails') {
      return /^(app|config)\/.+/.test(path) || path === 'config/routes.rb' || path === 'db/schema.rb'
    }
    if (primaryStack === 'Python') {
      return /^(app|src|project|templates)\/.+/.test(path) || /\.py$/.test(path)
    }
    if (primaryStack === 'Vue' || primaryStack === 'Nuxt') {
      return /^(pages|components|composables|stores|layouts|app)\/.+\.(vue|ts|js)$/.test(path) || /\.vue$/.test(path)
    }
    if (primaryStack === 'Svelte' || primaryStack === 'SvelteKit') {
      return /^(src|routes)\/.+\.(svelte|ts|js)$/.test(path) || /\.svelte$/.test(path)
    }
    return /^(src|app)\/.*\.(tsx?|jsx?)$/.test(path)
  }

  const isPriority2 = (path: string) => {
    if (primaryStack === 'Flutter') {
      return path === 'pubspec.yaml' || path === 'pubspec.lock' || /^analysis_options\.yaml$/.test(path)
    }
    if (primaryStack === 'Swift') {
      return path === 'Package.swift' || /\.plist$/.test(path) || path.endsWith('.xcodeproj/project.pbxproj')
    }
    if (primaryStack === 'Ruby on Rails') {
      return path === 'Gemfile' || path === 'Gemfile.lock' || /^config\/(application|environment|database)\.rb$/.test(path)
    }
    if (primaryStack === 'Python') {
      return path === 'pyproject.toml' || path === 'requirements.txt' || path === 'Pipfile'
    }
    if (primaryStack === 'Vue' || primaryStack === 'Nuxt') {
      return /^(nuxt\.config|vite\.config)\.(ts|js|mjs)$/.test(path) || path === 'package.json'
    }
    if (primaryStack === 'Svelte' || primaryStack === 'SvelteKit') {
      return /^(svelte\.config|vite\.config)\.(ts|js|mjs)$/.test(path) || path === 'package.json'
    }
    return /\.(config\.(ts|js|mjs)|json)$/.test(path) && !path.includes('/')
  }

  for (const file of files) {
    if (EXCLUDE_FOR_AI.some(p => p.test(file.path))) continue
    if (shouldExcludeFromAI(file.path, file.content)) continue

    if (isPriority1(file.path)) {
      priority1.push(file)
    } else if (isPriority2(file.path)) {
      priority2.push(file)
    } else {
      priority3.push(file)
    }
  }

  const selected: ExtractedFile[] = []
  let totalTokens = 0

  for (const file of [...priority1, ...priority2, ...priority3]) {
    const tokens = estimateTokens(file.content)
    if (totalTokens + tokens > maxTokens) break
    selected.push(file)
    totalTokens += tokens
  }

  return selected
}

export function buildFileContext(files: ExtractedFile[]): string {
  return files.map(f => `=== ${f.path} ===\n${f.content}`).join('\n\n')
}

const PACKAGE_JSON_RULES: Array<{ label: string; packages: string[] }> = [
  // Meta frameworks (React/Vueより先に判定)
  { label: 'Next.js',     packages: ['next'] },
  { label: 'Nuxt',        packages: ['nuxt'] },
  { label: 'SvelteKit',   packages: ['@sveltejs/kit'] },
  { label: 'Remix',       packages: ['@remix-run/react'] },
  { label: 'Astro',       packages: ['astro'] },
  // UI libraries
  { label: 'React',       packages: ['react'] },
  { label: 'Vue',         packages: ['vue'] },
  { label: 'Svelte',      packages: ['svelte'] },
  { label: 'Angular',     packages: ['@angular/core'] },
  // Mobile
  { label: 'React Native', packages: ['react-native'] },
  // CSS
  { label: 'Tailwind',    packages: ['tailwindcss'] },
  // Build
  { label: 'Vite',        packages: ['vite'] },
  // Backend
  { label: 'Express',     packages: ['express'] },
  { label: 'Hono',        packages: ['hono'] },
  { label: 'NestJS',      packages: ['@nestjs/core'] },
  { label: 'Fastify',     packages: ['fastify'] },
  // ORM / DB
  { label: 'Prisma',      packages: ['@prisma/client', 'prisma'] },
  { label: 'Drizzle',     packages: ['drizzle-orm'] },
  { label: 'Supabase',    packages: ['@supabase/supabase-js'] },
  // Language
  { label: 'TypeScript',  packages: ['typescript'] },
]

// React がすでに検出されている場合に除外するメタフレームワーク依存ラベル
const REACT_IMPLIES: Set<string> = new Set(['Next.js', 'Remix', 'React Native'])

export function detectStack(files: ExtractedFile[]): string[] {
  const rootFiles = new Map<string, string>()
  for (const f of files) {
    const depth = f.path.split('/').length
    // ルート直下 or ZIPが単一ディレクトリにまとまっている場合（depth<=2）
    if (depth <= 2) rootFiles.set(f.path.split('/').pop()!, f.content)
  }

  const detected = new Set<string>()

  // package.json からの判定
  const pkgRaw = rootFiles.get('package.json')
  if (pkgRaw) {
    try {
      const pkg = JSON.parse(pkgRaw) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies }
      for (const { label, packages } of PACKAGE_JSON_RULES) {
        if (packages.some(p => p in allDeps)) detected.add(label)
      }
    } catch { /* parse失敗は無視 */ }
  }

  // React はメタフレームワークに内包される場合は除外
  if ([...REACT_IMPLIES].some(fw => detected.has(fw))) detected.delete('React')
  // Svelte は SvelteKit に内包される場合は除外
  if (detected.has('SvelteKit')) detected.delete('Svelte')

  // tsconfig.json の存在で TypeScript を補完
  if (!detected.has('TypeScript') && rootFiles.has('tsconfig.json')) {
    detected.add('TypeScript')
  }

  // ファイルパターンでの判定（他言語）
  const hasSwift   = files.some(f => f.path.endsWith('.swift') || f.path.endsWith('Package.swift'))
  const hasFlutter = rootFiles.has('pubspec.yaml')
  const hasPython  = rootFiles.has('requirements.txt') || rootFiles.has('pyproject.toml')
  const hasRails   = (() => {
    const gemfile = rootFiles.get('Gemfile')
    return gemfile ? /gem ['"]rails['"]/.test(gemfile) : false
  })()

  if (hasSwift)   detected.add('Swift')
  if (hasFlutter) detected.add('Flutter')
  if (hasPython)  detected.add('Python')
  if (hasRails)   detected.add('Ruby on Rails')

  return [...detected]
}
