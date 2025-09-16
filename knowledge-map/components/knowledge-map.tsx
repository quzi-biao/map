"use client"

import { useCallback, useMemo } from "react"
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  ConnectionLineType,
  ConnectionMode,
  type NodeMouseHandler,
  Panel,
  type EdgeMouseHandler,
  type NodeTypes,
  useReactFlow,
} from "reactflow"
import "reactflow/dist/style.css"
import CustomNode from "./custom-node"
import NodeEditDialog from "./node-edit-dialog"
import AiPanel from "./ai-panel"
import ContextMenu from "./context-menu"
import useKnowledgeMapStore from "@/store/use-knowledge-map-store"
import { UnderstandingLevel } from "@/types/knowledge-map"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Plus, ZoomIn, ZoomOut } from "lucide-react"
import { processMapElementsForDisplay } from "@/utils/map-processor"

// 注册自定义节点
const nodeTypes: NodeTypes = {
  custom: CustomNode,
}

// 缩放滑动条组件
function ZoomSlider() {
  const { zoomIn, zoomOut, setViewport, getViewport } = useReactFlow()
  const viewport = getViewport()
  const currentZoom = viewport.zoom
  
  const handleZoomChange = (value: number[]) => {
    const newZoom = value[0]
    setViewport({ 
      x: viewport.x, 
      y: viewport.y, 
      zoom: newZoom 
    }, { duration: 200 })
  }

  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-2 shadow-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => zoomOut({ duration: 200 })}
        className="h-8 w-8 p-0"
      >
        <ZoomOut className="h-4 w-4" />
      </Button>
      <div className="w-24">
        <Slider
          value={[currentZoom]}
          onValueChange={handleZoomChange}
          min={0.1}
          max={2}
          step={0.1}
          className="w-full"
        />
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => zoomIn({ duration: 200 })}
        className="h-8 w-8 p-0"
      >
        <ZoomIn className="h-4 w-4" />
      </Button>
      <span className="text-xs text-gray-500 min-w-[3rem]">
        {Math.round(currentZoom * 100)}%
      </span>
    </div>
  )
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
      <div className="w-full h-full bg-white relative">
        {/* Custom background pattern */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle, #d1d5db 1px, transparent 1px)`,
            backgroundSize: '12px 12px',
            backgroundPosition: '0 0',
            pointerEvents: 'none'
          }}
        />
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
          fitViewOptions={{ padding: 0.1, minZoom: 0.1, maxZoom: 2 }}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          className="light-theme"
          connectionLineType={ConnectionLineType.SmoothStep}
          connectionMode={ConnectionMode.Loose}
          defaultEdgeOptions={{
            type: "smoothstep",
            style: { strokeWidth: 2 },
          }}
          edgesUpdatable={true}
          elementsSelectable={true}
          preventScrolling={false}
          zoomOnScroll={true}
          zoomOnPinch={true}
          panOnScroll={false}
          panOnDrag={true}
        >
          {/* 将添加节点按钮移到左上角 */}
          <Panel position="top-left" className="ml-2 mt-2">
            <Button onClick={addNewNode} size="sm" className="gap-1 bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4" /> 添加节点
            </Button>
          </Panel>
          
          {/* 缩放滑动条 */}
          <Panel position="bottom-left" className="ml-2 mt-16">
            <ZoomSlider />
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
