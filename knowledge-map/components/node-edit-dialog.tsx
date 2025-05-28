"use client"

import { useState, useEffect } from "react"
import type { Node } from "reactflow"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import RichTextEditor from "./rich-text-editor"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { UnderstandingLevel } from "@/types/knowledge-map"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import NodeAiAssistant from "./node-ai-assistant"

interface NodeEditDialogProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  node: Node | null
  updateNodeContent: (id: string, label: string, content: string) => void
  updateNodeUnderstandingLevel: (id: string, level: UnderstandingLevel) => void
}

export default function NodeEditDialog({
  isOpen,
  setIsOpen,
  node,
  updateNodeContent,
  updateNodeUnderstandingLevel,
}: NodeEditDialogProps) {
  const [label, setLabel] = useState("")
  const [content, setContent] = useState("")
  const [understandingLevel, setUnderstandingLevel] = useState<UnderstandingLevel>(UnderstandingLevel.NotStarted)
  const [showAdvanced, setShowAdvanced] = useState(false)
  // 在组件内部添加一个新的状态来控制AI助手面板的展开/收起
  const [isAiPanelCollapsed, setIsAiPanelCollapsed] = useState(false)

  useEffect(() => {
    if (node) {
      setLabel(node.data.label || "")
      setContent(node.data.content || "")
      setUnderstandingLevel(node.data.understandingLevel || UnderstandingLevel.NotStarted)
    }
  }, [node])

  // 自动保存功能
  useEffect(() => {
    if (node && (label !== node.data.label || content !== node.data.content)) {
      const debounceTimer = setTimeout(() => {
        updateNodeContent(node.id, label, content)
      }, 500) // 500ms 防抖

      return () => clearTimeout(debounceTimer)
    }
  }, [label, content, node, updateNodeContent])

  // 理解程度变化时更新
  useEffect(() => {
    if (node && understandingLevel !== node.data.understandingLevel) {
      updateNodeUnderstandingLevel(node.id, understandingLevel)
    }
  }, [understandingLevel, node, updateNodeUnderstandingLevel])

  // 自动聚焦到标题输入框
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        const titleInput = document.getElementById("node-title")
        if (titleInput) {
          titleInput.focus()
        }
      }, 100)
    }
  }, [isOpen])

  // 获取理解程度选择器样式
  const getUnderstandingLevelStyle = (level: UnderstandingLevel) => {
    switch (level) {
      case UnderstandingLevel.NotStarted:
        return "text-stone-300" // 浅石色
      case UnderstandingLevel.Basic:
        return "text-stone-200" // 更浅石色
      case UnderstandingLevel.Intermediate:
        return "text-amber-300" // 浅木色
      case UnderstandingLevel.Advanced:
        return "text-amber-200" // 更浅木色
      case UnderstandingLevel.Mastered:
        return "text-emerald-300" // 浅绿叶色
      default:
        return "text-stone-300"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="p-0 gap-0 bg-transparent border-0 max-w-none">
        <DialogTitle className="sr-only">编辑节点</DialogTitle>
        {/* 在return语句中，修改布局以使编辑界面更大并居中 */}
        {/* 替换flex容器的样式和内部组件的布局 */}
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />

          <div className="flex items-start gap-4 z-50">
            {/* 编辑对话框 - 增加宽度 */}
            <div className="w-[800px] bg-gray-800 text-white overflow-hidden border border-gray-700 rounded-lg shadow-xl">
              <div className="flex items-center justify-between p-5 border-b border-gray-700/50">
                <Input
                  id="node-title"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="text-2xl font-medium border-none shadow-none focus-visible:ring-0 px-0 h-auto bg-transparent text-white"
                  placeholder="无标题"
                />
              </div>

              <div className="p-0">
                <RichTextEditor content={content} onChange={setContent} darkMode={true} minimalist={true} />
              </div>

              {/* 高级选项（默认隐藏） */}
              <div className="border-t border-gray-700/50">
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-center py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700/50"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  {showAdvanced ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" /> 隐藏高级选项
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" /> 显示高级选项
                    </>
                  )}
                </Button>

                {showAdvanced && (
                  <div className="p-4 bg-gray-800/80 border-t border-gray-700/50">
                    <div className="text-base font-medium mb-2 text-gray-300">理解程度</div>
                    <RadioGroup
                      value={understandingLevel.toString()}
                      onValueChange={(value) => setUnderstandingLevel(Number.parseInt(value) as UnderstandingLevel)}
                      className="flex flex-wrap gap-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={UnderstandingLevel.NotStarted.toString()}
                          id="not-started"
                          className={getUnderstandingLevelStyle(UnderstandingLevel.NotStarted)}
                        />
                        <Label
                          htmlFor="not-started"
                          className={`${getUnderstandingLevelStyle(UnderstandingLevel.NotStarted)} text-base`}
                        >
                          未开始
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={UnderstandingLevel.Basic.toString()}
                          id="basic"
                          className={getUnderstandingLevelStyle(UnderstandingLevel.Basic)}
                        />
                        <Label
                          htmlFor="basic"
                          className={`${getUnderstandingLevelStyle(UnderstandingLevel.Basic)} text-base`}
                        >
                          基础理解
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={UnderstandingLevel.Intermediate.toString()}
                          id="intermediate"
                          className={getUnderstandingLevelStyle(UnderstandingLevel.Intermediate)}
                        />
                        <Label
                          htmlFor="intermediate"
                          className={`${getUnderstandingLevelStyle(UnderstandingLevel.Intermediate)} text-base`}
                        >
                          中等理解
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={UnderstandingLevel.Advanced.toString()}
                          id="advanced"
                          className={getUnderstandingLevelStyle(UnderstandingLevel.Advanced)}
                        />
                        <Label
                          htmlFor="advanced"
                          className={`${getUnderstandingLevelStyle(UnderstandingLevel.Advanced)} text-base`}
                        >
                          高级理解
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem
                          value={UnderstandingLevel.Mastered.toString()}
                          id="mastered"
                          className={getUnderstandingLevelStyle(UnderstandingLevel.Mastered)}
                        />
                        <Label
                          htmlFor="mastered"
                          className={`${getUnderstandingLevelStyle(UnderstandingLevel.Mastered)} text-base`}
                        >
                          已精通
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </div>
            </div>

            {/* AI助手面板 - 添加可折叠功能 */}
            <NodeAiAssistant
              node={node}
              isCollapsed={isAiPanelCollapsed}
              toggleCollapse={() => setIsAiPanelCollapsed(!isAiPanelCollapsed)}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
