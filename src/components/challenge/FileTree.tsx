'use client'

import { useState } from 'react'

interface FileTreeProps {
  paths: string[]
  selected: string[]
  onChange: (selected: string[]) => void
}

interface TreeNode {
  name: string
  fullPath: string
  children: Record<string, TreeNode>
  isFile: boolean
}

function buildTree(paths: string[]): TreeNode {
  const root: TreeNode = { name: '', fullPath: '', children: {}, isFile: false }

  for (const path of paths) {
    const parts = path.split('/')
    let node = root
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const fullPath = parts.slice(0, i + 1).join('/')
      if (!node.children[part]) {
        node.children[part] = {
          name: part,
          fullPath,
          children: {},
          isFile: i === parts.length - 1,
        }
      }
      node = node.children[part]
    }
  }

  return root
}

function TreeNodeView({
  node,
  selected,
  onToggle,
  depth,
}: {
  node: TreeNode
  selected: string[]
  onToggle: (path: string) => void
  depth: number
}) {
  const [open, setOpen] = useState(depth < 2)
  const childKeys = Object.keys(node.children).sort((a, b) => {
    const aIsFile = node.children[a].isFile
    const bIsFile = node.children[b].isFile
    if (aIsFile !== bIsFile) return aIsFile ? 1 : -1
    return a.localeCompare(b)
  })

  if (node.isFile) {
    const checked = selected.includes(node.fullPath)
    return (
      <label
        className="flex cursor-pointer items-center gap-2 rounded px-2 py-0.5 text-sm hover:bg-gray-50"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(node.fullPath)}
          className="h-3.5 w-3.5 rounded border-gray-300"
        />
        <span className={checked ? 'font-medium text-blue-700' : 'text-gray-700'}>
          {node.name}
        </span>
      </label>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-1 rounded px-2 py-0.5 text-sm text-gray-500 hover:bg-gray-50"
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        <span className="w-3 text-xs">{open ? '▾' : '▸'}</span>
        <span>{node.name}/</span>
      </button>
      {open && childKeys.map(key => (
        <TreeNodeView
          key={key}
          node={node.children[key]}
          selected={selected}
          onToggle={onToggle}
          depth={depth + 1}
        />
      ))}
    </div>
  )
}

export function FileTree({ paths, selected, onChange }: FileTreeProps) {
  const tree = buildTree(paths)

  const handleToggle = (path: string) => {
    if (selected.includes(path)) {
      onChange(selected.filter(p => p !== path))
    } else {
      onChange([...selected, path])
    }
  }

  const rootKeys = Object.keys(tree.children).sort((a, b) => {
    const aIsFile = tree.children[a].isFile
    const bIsFile = tree.children[b].isFile
    if (aIsFile !== bIsFile) return aIsFile ? 1 : -1
    return a.localeCompare(b)
  })

  return (
    <div className="rounded-lg border border-gray-200 bg-white py-2 font-mono">
      {rootKeys.map(key => (
        <TreeNodeView
          key={key}
          node={tree.children[key]}
          selected={selected}
          onToggle={handleToggle}
          depth={0}
        />
      ))}
    </div>
  )
}
