"use client"

import { useEffect, useRef } from "react"
import { Trash2 } from "lucide-react"

interface ContextMenuProps {
  x: number
  y: number
  onDelete: () => void
  onClose: () => void
  type: "edge" | "node" // 添加类型区分是节点还是边
}

export default function ContextMenu({ x, y, onDelete, onClose, type }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // 处理点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  // 处理ESC键关闭菜单
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscKey)
    return () => {
      document.removeEventListener("keydown", handleEscKey)
    }
  }, [onClose])

  return (
    <div
      ref={menuRef}
      className="absolute z-50 bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1 min-w-[120px]"
      style={{
        left: x,
        top: y,
      }}
    >
      <button
        className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 flex items-center"
        onClick={() => {
          onDelete()
          onClose()
        }}
      >
        <Trash2 className="h-4 w-4 mr-2 text-red-400" />
        删除{type === "edge" ? "连线" : "节点"}
      </button>
    </div>
  )
}
