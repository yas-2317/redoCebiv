import { createHash } from 'crypto'
import { unzipSync } from 'fflate'

export interface ExtractedFile {
  path: string
  content: string
  language: string | null
  sizeBytes: number
}

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

export function estimateTokens(content: string): number {
  return Math.ceil(content.length * 0.5)
}

export function extractZip(buffer: Buffer): { files: ExtractedFile[]; hash: string } {
  const hash = createHash('sha256').update(buffer).digest('hex')

  const uint8 = new Uint8Array(buffer)
  const unzipped = unzipSync(uint8)

  const files: ExtractedFile[] = []

  for (const [filePath, fileData] of Object.entries(unzipped)) {
    // ディレクトリエントリはスキップ（パスが / で終わる）
    if (filePath.endsWith('/')) continue
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
  }

  return { files, hash }
}

export function selectFilesForAnalysis(
  files: ExtractedFile[],
  maxTokens = 150_000
): ExtractedFile[] {
  const EXCLUDE_FOR_AI = [
    /\.test\.(ts|tsx|js|jsx)$/,
    /\.spec\.(ts|tsx|js|jsx)$/,
    /\.d\.ts$/,
    /\.stories\.(ts|tsx)$/,
  ]

  const priority1: ExtractedFile[] = []
  const priority2: ExtractedFile[] = []
  const priority3: ExtractedFile[] = []

  for (const file of files) {
    if (EXCLUDE_FOR_AI.some(p => p.test(file.path))) continue

    if (/^(src|app)\/.*\.(tsx?|jsx?)$/.test(file.path)) {
      priority1.push(file)
    } else if (/\.(config\.(ts|js|mjs)|json)$/.test(file.path) && !file.path.includes('/')) {
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
