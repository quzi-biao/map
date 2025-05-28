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

    // 使用自然元素色调 - 从石头(灰褐色)到木头(暖棕色)到绿叶(鲜绿色)
    switch (level) {
      case UnderstandingLevel.NotStarted:
        return "bg-stone-700 border-stone-600 text-stone-100" // 深石色
      case UnderstandingLevel.Basic:
        return "bg-stone-600 border-stone-500 text-stone-50" // 中石色
      case UnderstandingLevel.Intermediate:
        return "bg-amber-800 border-amber-700 text-amber-50" // 深木色
      case UnderstandingLevel.Advanced:
        return "bg-amber-700 border-amber-600 text-amber-50" // 中木色
      case UnderstandingLevel.Mastered:
        return "bg-emerald-700 border-emerald-600 text-emerald-50" // 绿叶色
      default:
        return "bg-stone-700 border-stone-600 text-stone-100"
    }
  }

  // 获取理解程度指示器样式
  const getIndicatorStyle = () => {
    const level = data.understandingLevel || UnderstandingLevel.NotStarted

    switch (level) {
      case UnderstandingLevel.NotStarted:
        return "bg-stone-300" // 浅石色
      case UnderstandingLevel.Basic:
        return "bg-stone-200" // 更浅石色
      case UnderstandingLevel.Intermediate:
        return "bg-amber-300" // 浅木色
      case UnderstandingLevel.Advanced:
        return "bg-amber-200" // 更浅木色
      case UnderstandingLevel.Mastered:
        return "bg-emerald-300" // 浅绿叶色
      default:
        return "bg-stone-300"
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
        return "rgba(68, 64, 60, 0.3)" // 石色阴影
      case UnderstandingLevel.Basic:
        return "rgba(68, 64, 60, 0.35)" // 石色阴影
      case UnderstandingLevel.Intermediate:
        return "rgba(146, 64, 14, 0.35)" // 木色阴影
      case UnderstandingLevel.Advanced:
        return "rgba(146, 64, 14, 0.4)" // 木色阴影
      case UnderstandingLevel.Mastered:
        return "rgba(4, 120, 87, 0.4)" // 绿色阴影
      default:
        return "rgba(68, 64, 60, 0.3)"
    }
  }

  // 连接点样式
  const handleStyle = {
    width: 8,
    height: 8,
    backgroundColor: "#a8a29e",
    border: "1px solid #78716c",
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
        <div className="text-sm opacity-80 line-clamp-2">
          {data.content ? getTextPreview(data.content) : "空白内容..."}
        </div>
        <div className="text-xs mt-2 opacity-70 flex items-center">
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
        className="!transform !-translate-y-[1px] hover:!bg-amber-300"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        isConnectable={isConnectable}
        style={handleStyle}
        className="!transform !translate-x-[1px] hover:!bg-amber-300"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        isConnectable={isConnectable}
        style={handleStyle}
        className="!transform !translate-y-[1px] hover:!bg-amber-300"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        isConnectable={isConnectable}
        style={handleStyle}
        className="!transform !-translate-x-[1px] hover:!bg-amber-300"
      />
    </div>
  )
}

export default memo(CustomNode)
