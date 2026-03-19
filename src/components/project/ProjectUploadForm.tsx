'use client'

import { useState, useRef, DragEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const MAX_SIZE = 20 * 1024 * 1024

export default function ProjectUploadForm() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(f: File) {
    setError(null)
    if (!f.name.endsWith('.zip')) {
      setError('Only ZIP files are supported')
      return
    }
    if (f.size > MAX_SIZE) {
      setError('File size limit is 20MB (please exclude node_modules before zipping)')
      return
    }
    setFile(f)
    if (!name) setName(f.name.replace(/\.zip$/, ''))
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function onDragLeave() {
    setDragging(false)
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', name)

    const res = await fetch('/api/projects', { method: 'POST', body: formData })
    const json = await res.json()

    if (!res.ok) {
      const messages: Record<string, string> = {
        FILE_TOO_LARGE: 'File exceeds 20MB limit',
        INVALID_FILE: 'Please select a ZIP file',
        INSUFFICIENT_CREDITS: 'Insufficient credits',
        UPLOAD_FAILED: 'Upload failed. Please try again',
      }
      setError(messages[json.error] ?? 'An error occurred')
      setLoading(false)
      return
    }

    router.push(`/projects/${json.projectId}/analyzing`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ドラッグ&ドロップゾーン */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition-colors ${
          dragging ? 'border-gray-900 bg-gray-50' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".zip"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
          }}
        />
        {file ? (
          <div className="space-y-1">
            <p className="font-medium text-gray-900">{file.name}</p>
            <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-gray-600">Drag & drop your ZIP here</p>
            <p className="text-sm text-gray-400">or click to select</p>
          </div>
        )}
      </div>

      {/* 注意書き */}
      <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
        <p className="font-medium">⚠️ Exclude node_modules before zipping</p>
        <p className="mt-1 font-mono text-xs text-amber-700">
          zip -r app.zip . --exclude &apos;node_modules/*&apos; &apos;.git/*&apos; &apos;.next/*&apos;
        </p>
        <p className="mt-1 text-xs">Supported: Next.js / React / TypeScript / Tailwind　Max: 20MB</p>
      </div>

      {/* プロジェクト名 */}
      <div className="space-y-1">
        <Label htmlFor="name">Project name</Label>
        <Input
          id="name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="my-app"
          required
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" disabled={!file || loading} className="w-full">
        {loading ? 'Starting analysis...' : 'Start analysis (−5 credits)'}
      </Button>
    </form>
  )
}
