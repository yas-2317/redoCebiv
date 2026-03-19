/**
 * Anthropic API レスポンスから JSON を抽出する共通ユーティリティ
 * - まず直接 JSON.parse を試みる（Claudeがクリーンなjsonを返す場合）
 * - 失敗したら regex で JSON ブロックを抽出してパース
 */
export function extractJson<T>(text: string): T {
  const trimmed = text.trim()

  // 直接パース
  try {
    return JSON.parse(trimmed) as T
  } catch {
    // regex で JSON ブロックを抽出
    const match = trimmed.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('No JSON object found in response')
    return JSON.parse(match[0]) as T
  }
}
