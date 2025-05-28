"use client"

import { useCallback, useMemo } from "react"
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  ConnectionLineType,
  ConnectionMode,
  type NodeMouseHandler,
  Panel,
  type EdgeMouseHandler,
  type NodeTypes,
} from "reactflow"
import "reactflow/dist/style.css"
import CustomNode from "./custom-node"
import NodeEditDialog from "./node-edit-dialog"
import AiPanel from "./ai-panel"
import ContextMenu from "./context-menu"
import useKnowledgeMapStore from "@/store/use-knowledge-map-store"
import { UnderstandingLevel } from "@/types/knowledge-map"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { processMapElementsForDisplay } from "@/utils/map-processor"

// 注册自定义节点
const nodeTypes: NodeTypes = {
  custom: CustomNode,
}

export default function KnowledgeMap() {
  // 使用 Zustand store
  const {
    maps,
    activeMapId,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectedNode,
    isDialogOpen,
    contextMenu,
    updateNodeContent,
    updateNodeUnderstandingLevel,
    addNewNode,
    deleteNode,
    deleteEdge,
    openNodeDialog,
    closeNodeDialog,
    openContextMenu,
    closeContextMenu,
  } = useKnowledgeMapStore()

  // 获取当前活动的地图
  const activeMap = maps.find((map) => map.id === activeMapId) || maps[0]
  const { nodes: originalNodes, edges: originalEdges } = activeMap

  // 使用 processMapElementsForDisplay 处理节点和边的透明度
  const { processedNodes, processedEdges } = useMemo(
    () => processMapElementsForDisplay(originalNodes, originalEdges),
    [originalNodes, originalEdges],
  )

  // 处理节点点击
  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      openNodeDialog(node)
    },
    [openNodeDialog],
  )

  // 处理节点右键点击
  const onNodeContextMenu: NodeMouseHandler = useCallback(
    (event, node) => {
      // 阻止默认的上下文菜单
      event.preventDefault()

      // 显示自定义上下文菜单
      openContextMenu(event.clientX, event.clientY, null, node.id)
    },
    [openContextMenu],
  )

  // 修改 onEdgeContextMenu 处理函数，确保它正确捕获事件
  const onEdgeContextMenu: EdgeMouseHandler = useCallback(
    (event, edge) => {
      // 阻止默认的上下文菜单
      event.preventDefault()
      event.stopPropagation()

      // 显示自定义上下文菜单
      openContextMenu(event.clientX, event.clientY, edge.id)

      // 添加日志以便调试
      console.log("Edge right-clicked:", edge.id)
    },
    [openContextMenu],
  )

  // 处理删除操作
  const handleDelete = useCallback(() => {
    if (contextMenu.edgeId) {
      deleteEdge(contextMenu.edgeId)
    } else if (contextMenu.nodeId) {
      deleteNode(contextMenu.nodeId)
    }
    closeContextMenu()
  }, [contextMenu.edgeId, contextMenu.nodeId, deleteEdge, deleteNode, closeContextMenu])

  return (
    <>
      <div className="w-full h-full bg-gray-900">
        <ReactFlow
          nodes={processedNodes}
          edges={processedEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          onNodeContextMenu={onNodeContextMenu}
          onEdgeContextMenu={onEdgeContextMenu}
          nodeTypes={nodeTypes}
          fitView
          className="dark-theme"
          connectionLineType={ConnectionLineType.SmoothStep}
          connectionMode={ConnectionMode.Loose}
          defaultEdgeOptions={{
            type: "smoothstep",
            style: { strokeWidth: 2 },
          }}
          edgesUpdatable={true}
          elementsSelectable={true}
        >
          <Controls className="bg-gray-800 border-gray-700 text-gray-300" />
          <MiniMap
            nodeColor={(node) => {
              const level = node.data.understandingLevel || UnderstandingLevel.NotStarted
              // 使用自然元素色调
              switch (level) {
                case UnderstandingLevel.NotStarted:
                  return "#57534e" // 深石色
                case UnderstandingLevel.Basic:
                  return "#78716c" // 中石色
                case UnderstandingLevel.Intermediate:
                  return "#92400e" // 深木色
                case UnderstandingLevel.Advanced:
                  return "#b45309" // 中木色
                case UnderstandingLevel.Mastered:
                  return "#047857" // 绿叶色
                default:
                  return "#57534e"
              }
            }}
            maskColor="#1f2937"
            className="bg-gray-800 border-gray-700"
          />
          <Background variant="dots" gap={12} size={1} color="#4b5563" />
          {/* 将添加节点按钮移到左上角 */}
          <Panel position="top-left" className="ml-2 mt-2">
            <Button onClick={addNewNode} size="sm" className="gap-1 bg-amber-700 hover:bg-amber-800">
              <Plus className="h-4 w-4" /> 添加节点
            </Button>
          </Panel>
        </ReactFlow>

        {/* 上下文菜单 */}
        {contextMenu.visible && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onDelete={handleDelete}
            onClose={closeContextMenu}
            type={contextMenu.nodeId ? "node" : "edge"}
          />
        )}
      </div>

      {/* AI面板 */}
      <AiPanel />

      <NodeEditDialog
        isOpen={isDialogOpen}
        setIsOpen={closeNodeDialog}
        node={selectedNode}
        updateNodeContent={updateNodeContent}
        updateNodeUnderstandingLevel={updateNodeUnderstandingLevel}
      />
    </>
  )
}
