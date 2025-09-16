"use client"

import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { UnderstandingLevel } from "@/types/knowledge-map"

function CustomNode({ data, isConnectable }: NodeProps) {
  // 从HTML内容中提取纯文本用于预览
  const getTextPreview = (html: string) => {
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = html
    const text = tempDiv.textContent || tempDiv.innerText || ""
    return text.length > 50 ? text.substring(0, 50) + "..." : text
  }

  // 根据理解程度获取节点样式
  const getNodeStyle = () => {
    const level = data.understandingLevel || UnderstandingLevel.NotStarted

    // 使用亮色主题的自然元素色调
    switch (level) {
      case UnderstandingLevel.NotStarted:
        return "bg-gray-100 border-gray-300 text-gray-900" // 浅灰色
      case UnderstandingLevel.Basic:
        return "bg-blue-50 border-blue-200 text-blue-900" // 浅蓝色
      case UnderstandingLevel.Intermediate:
        return "bg-amber-50 border-amber-200 text-amber-900" // 浅琥珀色
      case UnderstandingLevel.Advanced:
        return "bg-orange-50 border-orange-200 text-orange-900" // 浅橙色
      case UnderstandingLevel.Mastered:
        return "bg-emerald-50 border-emerald-200 text-emerald-900" // 浅绿色
      default:
        return "bg-gray-100 border-gray-300 text-gray-900"
    }
  }

  // 获取理解程度指示器样式
  const getIndicatorStyle = () => {
    const level = data.understandingLevel || UnderstandingLevel.NotStarted

    switch (level) {
      case UnderstandingLevel.NotStarted:
        return "bg-gray-400" // 灰色指示器
      case UnderstandingLevel.Basic:
        return "bg-blue-400" // 蓝色指示器
      case UnderstandingLevel.Intermediate:
        return "bg-amber-400" // 琥珀色指示器
      case UnderstandingLevel.Advanced:
        return "bg-orange-400" // 橙色指示器
      case UnderstandingLevel.Mastered:
        return "bg-emerald-400" // 绿色指示器
      default:
        return "bg-gray-400"
    }
  }

  // 获取理解程度标签
  const getUnderstandingLabel = () => {
    const level = data.understandingLevel || UnderstandingLevel.NotStarted

    switch (level) {
      case UnderstandingLevel.NotStarted:
        return "未开始"
      case UnderstandingLevel.Basic:
        return "基础理解"
      case UnderstandingLevel.Intermediate:
        return "中等理解"
      case UnderstandingLevel.Advanced:
        return "高级理解"
      case UnderstandingLevel.Mastered:
        return "已精通"
      default:
        return "未开始"
    }
  }

  // 获取节点阴影样式
  const getNodeShadow = () => {
    const level = data.understandingLevel || UnderstandingLevel.NotStarted

    // 根据理解程度调整阴影颜色和强度
    switch (level) {
      case UnderstandingLevel.NotStarted:
        return "rgba(0, 0, 0, 0.1)" // 轻微阴影
      case UnderstandingLevel.Basic:
        return "rgba(59, 130, 246, 0.15)" // 蓝色阴影
      case UnderstandingLevel.Intermediate:
        return "rgba(245, 158, 11, 0.15)" // 琥珀色阴影
      case UnderstandingLevel.Advanced:
        return "rgba(249, 115, 22, 0.15)" // 橙色阴影
      case UnderstandingLevel.Mastered:
        return "rgba(16, 185, 129, 0.15)" // 绿色阴影
      default:
        return "rgba(0, 0, 0, 0.1)"
    }
  }

  // 连接点样式
  const handleStyle = {
    width: 8,
    height: 8,
    backgroundColor: "#d1d5db",
    border: "1px solid #9ca3af",
  }

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-md min-w-[180px] max-w-[280px] hover:shadow-xl transition-all ${getNodeStyle()}`}
      style={{
        boxShadow: `0 4px 12px ${getNodeShadow()}`,
      }}
    >
      <div className="flex flex-col">
        <div className="font-bold text-lg mb-1 truncate">{data.label || "无标题"}</div>
        <div className="text-sm line-clamp-2">
          {data.content ? getTextPreview(data.content) : "空白内容..."}
        </div>
        <div className="text-xs mt-2 flex items-center">
          <div className={`w-2 h-2 rounded-full mr-1 ${getIndicatorStyle()}`}></div>
          {getUnderstandingLabel()}
        </div>
      </div>

      {/* 四个方向的连接点 */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        isConnectable={isConnectable}
        style={handleStyle}
        className="!transform !-translate-y-[1px] hover:!bg-blue-300"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        isConnectable={isConnectable}
        style={handleStyle}
        className="!transform !translate-x-[1px] hover:!bg-blue-300"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        isConnectable={isConnectable}
        style={handleStyle}
        className="!transform !translate-y-[1px] hover:!bg-blue-300"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        isConnectable={isConnectable}
        style={handleStyle}
        className="!transform !-translate-x-[1px] hover:!bg-blue-300"
      />
    </div>
  )
}

export default memo(CustomNode)
