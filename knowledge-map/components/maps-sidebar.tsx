"use client"

import { useState } from "react"
import { Plus, FileText, ChevronLeft, ChevronRight, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import useKnowledgeMapStore from "@/store/use-knowledge-map-store"

export default function MapsSidebar() {
  const { maps, activeMapId, createMap, switchMap, renameMap, deleteMap } = useKnowledgeMapStore()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false)
  const [newMapName, setNewMapName] = useState("")
  const [mapToRename, setMapToRename] = useState<{ id: string; name: string } | null>(null)

  // 处理创建新地图
  const handleCreateMap = () => {
    if (newMapName.trim()) {
      createMap(newMapName.trim())
      setNewMapName("")
      setIsCreateDialogOpen(false)
    }
  }

  // 处理重命名地图
  const handleRenameMap = () => {
    if (mapToRename && mapToRename.name.trim()) {
      renameMap(mapToRename.id, mapToRename.name.trim())
      setMapToRename(null)
      setIsRenameDialogOpen(false)
    }
  }

  // 打开重命名对话框
  const openRenameDialog = (id: string, currentName: string) => {
    setMapToRename({ id, name: currentName })
    setIsRenameDialogOpen(true)
  }

  // 处理删除地图
  const handleDeleteMap = (id: string) => {
    if (maps.length > 1) {
      deleteMap(id)
    } else {
      alert("至少需要保留一张知识地图")
    }
  }

  return (
    <>
      <div
        className={cn(
          "h-full bg-gray-800 border-r border-gray-700 transition-all duration-300 flex flex-col",
          isCollapsed ? "w-12" : "w-64",
        )}
      >
        {/* 侧边栏头部 */}
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          {!isCollapsed && <h3 className="font-medium text-white">知识地图</h3>}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-400 hover:text-white ml-auto"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* 地图列表 */}
        <div className="flex-1 overflow-y-auto py-2">
          {maps.map((map) => (
            <div
              key={map.id}
              className={cn(
                "flex items-center px-3 py-2 cursor-pointer group",
                map.id === activeMapId
                  ? "bg-gray-700 text-white"
                  : "text-gray-300 hover:bg-gray-700/50 hover:text-white",
              )}
              onClick={() => switchMap(map.id)}
            >
              <FileText className="h-4 w-4 mr-3 flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="truncate flex-1">{map.name}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-gray-800 text-gray-200 border-gray-700">
                      <DropdownMenuItem
                        className="flex items-center cursor-pointer hover:bg-gray-700"
                        onClick={(e) => {
                          e.stopPropagation()
                          openRenameDialog(map.id, map.name)
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        重命名
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center cursor-pointer text-red-400 hover:bg-gray-700 hover:text-red-400"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteMap(map.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          ))}
        </div>

        {/* 添加新地图按钮 */}
        <div className="p-3 border-t border-gray-700">
          <Button
            variant="outline"
            size={isCollapsed ? "icon" : "default"}
            className={cn(
              "w-full bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:text-white",
              isCollapsed && "h-8 w-8",
            )}
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <Plus className={cn("h-4 w-4", !isCollapsed && "mr-2")} />
            {!isCollapsed && "新建知识地图"}
          </Button>
        </div>
      </div>

      {/* 创建新地图对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>创建新知识地图</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newMapName}
              onChange={(e) => setNewMapName(e.target.value)}
              placeholder="输入知识地图名称"
              className="bg-gray-700 border-gray-600 text-white"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateMap()
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsCreateDialogOpen(false)}
              className="text-gray-300 hover:text-white"
            >
              取消
            </Button>
            <Button
              onClick={handleCreateMap}
              disabled={!newMapName.trim()}
              className="bg-emerald-700 hover:bg-emerald-600 text-white"
            >
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重命名地图对话框 */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>重命名知识地图</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={mapToRename?.name || ""}
              onChange={(e) => setMapToRename((prev) => (prev ? { ...prev, name: e.target.value } : null))}
              placeholder="输入新名称"
              className="bg-gray-700 border-gray-600 text-white"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameMap()
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsRenameDialogOpen(false)}
              className="text-gray-300 hover:text-white"
            >
              取消
            </Button>
            <Button
              onClick={handleRenameMap}
              disabled={!mapToRename?.name.trim()}
              className="bg-emerald-700 hover:bg-emerald-600 text-white"
            >
              重命名
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
