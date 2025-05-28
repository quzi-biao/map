import { create } from "zustand"
import {
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  addEdge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow"
import { UnderstandingLevel } from "@/types/knowledge-map"
import { v4 as uuidv4 } from "uuid"
import { dbService } from "@/services/db"
import type { Message } from "@/services/ai"

// 知识地图类型
export interface KnowledgeMap {
  id: string
  name: string
  nodes: Node[]
  edges: Edge[]
  chatHistory: Message[] // 添加聊天历史记录
  tokenCount: number // 添加token计数
}

// 初始节点数据
const initialNodes: Node[] = [
  {
    id: "1",
    type: "custom",
    data: {
      label: "知识点 1",
      content: "<h2>主要概念</h2><p>这是关于知识点1的详细描述内容。</p><ul><li>要点一</li><li>要点二</li></ul>",
      understandingLevel: UnderstandingLevel.Advanced,
    },
    position: { x: 250, y: 5 },
  },
  {
    id: "2",
    type: "custom",
    data: {
      label: "知识点 2",
      content: "<p>这是关于知识点2的详细描述内容。</p><blockquote>引用的内容</blockquote>",
      understandingLevel: UnderstandingLevel.Basic,
    },
    position: { x: 100, y: 100 },
  },
  {
    id: "3",
    type: "custom",
    data: {
      label: "知识点 3",
      content: "<p>这是关于知识点3的详细描述内容。</p><pre><code>console.log('代码示例');</code></pre>",
      understandingLevel: UnderstandingLevel.Intermediate,
    },
    position: { x: 400, y: 100 },
  },
  {
    id: "4",
    type: "custom",
    data: {
      label: "知识点 4",
      content:
        "<p>这是关于知识点4的详细描述内容。</p><ul class='task-list'><li data-type='taskItem' data-checked='true'>已完成任务</li><li data-type='taskItem' data-checked='false'>未完成任务</li></ul>",
      understandingLevel: UnderstandingLevel.NotStarted,
    },
    position: { x: 250, y: 200 },
  },
  {
    id: "5",
    type: "custom",
    data: {
      label: "知识点 5",
      content: "<p>这是一个已经完全掌握的知识点。</p>",
      understandingLevel: UnderstandingLevel.Mastered,
    },
    position: { x: 400, y: 200 },
  },
]

// 初始连接数据 - 使用自然色调的连接线
const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    sourceHandle: "bottom",
    targetHandle: "top",
    animated: true,
    style: { stroke: "#a8a29e" },
    interactionWidth: 15,
  }, // 石色
  {
    id: "e1-3",
    source: "1",
    target: "3",
    sourceHandle: "right",
    targetHandle: "top",
    animated: true,
    style: { stroke: "#a8a29e" },
    interactionWidth: 15,
  }, // 石色
  {
    id: "e2-4",
    source: "2",
    target: "4",
    sourceHandle: "bottom",
    targetHandle: "left",
    style: { stroke: "#d6d3d1" },
    interactionWidth: 15,
  }, // 浅石色
  {
    id: "e3-4",
    source: "3",
    target: "4",
    sourceHandle: "bottom",
    targetHandle: "top",
    style: { stroke: "#d6d3d1" },
    interactionWidth: 15,
  }, // 浅石色
  {
    id: "e1-5",
    source: "1",
    target: "5",
    sourceHandle: "right",
    targetHandle: "left",
    style: { stroke: "#a3e635" },
    interactionWidth: 15,
  }, // 绿叶色
]

// 初始欢迎消息
const initialChatHistory: Message[] = [
  {
    id: "welcome",
    content: "你好！我是你的AI助手，可以帮你解答关于知识地图的问题，或者提供学习建议。",
    role: "assistant",
    timestamp: new Date(),
  },
]

// 创建默认知识地图
const createDefaultMap = (): KnowledgeMap => ({
  id: uuidv4(),
  name: "默认知识地图",
  nodes: initialNodes,
  edges: initialEdges,
  chatHistory: [...initialChatHistory],
  tokenCount: 0, // 初始token计数为0
})

// 上下文菜单类型
interface ContextMenu {
  visible: boolean
  x: number
  y: number
  edgeId: string | null
  nodeId: string | null
}

// 最大token限制
const MAX_TOKEN_LIMIT = 300000 // 300k tokens

// 估算消息的token数量（简单实现，实际应根据模型进行更精确的计算）
export function estimateTokenCount(text: string): number {
  // 粗略估计：每4个字符约为1个token
  return Math.ceil(text.length / 4)
}

// 定义 store 的状态类型
interface KnowledgeMapState {
  // 多地图支持
  maps: KnowledgeMap[]
  activeMapId: string
  isLoading: boolean

  // 当前选中的节点和对话框状态
  selectedNode: Node | null
  isDialogOpen: boolean
  contextMenu: ContextMenu

  // 初始化
  initialize: () => Promise<void>

  // 地图操作
  createMap: (name: string) => Promise<void>
  switchMap: (id: string) => Promise<void>
  renameMap: (id: string, name: string) => Promise<void>
  deleteMap: (id: string) => Promise<void>

  // 节点和边的操作
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  updateNodeContent: (id: string, label: string, content: string) => Promise<void>
  updateNodeUnderstandingLevel: (id: string, level: UnderstandingLevel) => Promise<void>
  addNewNode: () => Promise<void>
  deleteNode: (nodeId: string) => Promise<void>
  deleteEdge: (edgeId: string) => Promise<void>

  // 对话框操作
  openNodeDialog: (node: Node) => void
  closeNodeDialog: () => void

  // 上下文菜单操作
  openContextMenu: (x: number, y: number, edgeId?: string | null, nodeId?: string | null) => void
  closeContextMenu: () => void

  // 聊天记录操作
  getChatHistory: () => Message[]
  addChatMessage: (message: Message) => Promise<void>
  clearChatHistory: () => Promise<void>
  getTokenCount: () => number

  // 添加新方法
  createNodesFromAI: (nodes: Node[], edges: Edge[]) => Promise<void>
}

// 创建 store
const useKnowledgeMapStore = create<KnowledgeMapState>()((set, get) => ({
  // 初始化多地图支持
  maps: [],
  activeMapId: "",
  isLoading: true,

  // 当前选中的节点和对话框状态
  selectedNode: null,
  isDialogOpen: false,
  contextMenu: {
    visible: false,
    x: 0,
    y: 0,
    edgeId: null,
    nodeId: null,
  },

  // 初始化
  initialize: async () => {
    set({ isLoading: true })
    try {
      // 从IndexedDB加载所有地图
      const maps = await dbService.getAllMaps()

      // 如果没有地图，创建默认地图
      if (maps.length === 0) {
        const defaultMap = createDefaultMap()
        await dbService.saveMap(defaultMap)
        set({ maps: [defaultMap], activeMapId: defaultMap.id })
      } else {
        // 确保每个地图都有聊天历史和token计数
        const updatedMaps = maps.map((map) => ({
          ...map,
          chatHistory: map.chatHistory || [...initialChatHistory],
          tokenCount: map.tokenCount || 0,
        }))

        // 加载活动地图ID
        let activeMapId = await dbService.getActiveMapId()

        // 确保活动ID有效
        if (!activeMapId || !updatedMaps.some((map) => map.id === activeMapId)) {
          activeMapId = updatedMaps[0].id
          await dbService.saveActiveMapId(activeMapId)
        }

        set({ maps: updatedMaps, activeMapId })
      }
    } catch (error) {
      console.error("初始化知识地图失败:", error)
      // 如果加载失败，使用内存中的默认地图
      const defaultMap = createDefaultMap()
      set({ maps: [defaultMap], activeMapId: defaultMap.id })
    } finally {
      set({ isLoading: false })
    }
  },

  // 创建新地图
  createMap: async (name: string) => {
    const newMap: KnowledgeMap = {
      id: uuidv4(),
      name,
      nodes: [],
      edges: [],
      chatHistory: [...initialChatHistory],
      tokenCount: 0,
    }

    try {
      // 保存到IndexedDB
      await dbService.saveMap(newMap)
      await dbService.saveActiveMapId(newMap.id)

      // 更新状态
      set((state) => ({
        maps: [...state.maps, newMap],
        activeMapId: newMap.id,
      }))
    } catch (error) {
      console.error("创建知识地图失败:", error)
      throw new Error("创建知识地图失败")
    }
  },

  // 切换地图
  switchMap: async (id: string) => {
    try {
      await dbService.saveActiveMapId(id)
      set({ activeMapId: id })
    } catch (error) {
      console.error("切换知识地图失败:", error)
    }
  },

  // 重命名地图
  renameMap: async (id: string, name: string) => {
    try {
      // 更新状态
      set((state) => {
        const updatedMaps = state.maps.map((map) => (map.id === id ? { ...map, name } : map))

        // 保存到IndexedDB
        const mapToUpdate = updatedMaps.find((map) => map.id === id)
        if (mapToUpdate) {
          dbService.saveMap(mapToUpdate).catch(console.error)
        }

        return { maps: updatedMaps }
      })
    } catch (error) {
      console.error("重命名知识地图失败:", error)
      throw new Error("重命名知识地图失败")
    }
  },

  // 删除地图
  deleteMap: async (id: string) => {
    try {
      set((state) => {
        // 确保至少保留一张地图
        if (state.maps.length <= 1) {
          return state
        }

        const newMaps = state.maps.filter((map) => map.id !== id)
        const newActiveId = state.activeMapId === id ? newMaps[0].id : state.activeMapId

        // 从IndexedDB删除
        dbService.deleteMap(id).catch(console.error)

        // 如果活动ID改变，更新
        if (newActiveId !== state.activeMapId) {
          dbService.saveActiveMapId(newActiveId).catch(console.error)
        }

        return {
          maps: newMaps,
          activeMapId: newActiveId,
        }
      })
    } catch (error) {
      console.error("删除知识地图失败:", error)
      throw new Error("删除知识地图失败")
    }
  },

  // 获取当前活动地图
  getCurrentMap: () => {
    const state = get()
    return state.maps.find((map) => map.id === state.activeMapId) || state.maps[0]
  },

  // 更新当前活动地图
  updateCurrentMap: async (updater: (map: KnowledgeMap) => KnowledgeMap) => {
    try {
      set((state) => {
        const currentMap = state.maps.find((map) => map.id === state.activeMapId)
        if (!currentMap) return state

        const updatedMap = updater(currentMap)
        const updatedMaps = state.maps.map((map) => (map.id === state.activeMapId ? updatedMap : map))

        // 保存到IndexedDB
        dbService.saveMap(updatedMap).catch(console.error)

        return { maps: updatedMaps }
      })
    } catch (error) {
      console.error("更新知识地图失败:", error)
    }
  },

  // 节点变化处理
  onNodesChange: (changes: NodeChange[]) => {
    set((state) => {
      const currentMap = state.maps.find((map) => map.id === state.activeMapId)
      if (!currentMap) return state

      const updatedNodes = applyNodeChanges(changes, currentMap.nodes)
      const updatedMap = { ...currentMap, nodes: updatedNodes }

      // 保存到IndexedDB
      dbService.saveMap(updatedMap).catch(console.error)

      return {
        maps: state.maps.map((map) => (map.id === state.activeMapId ? updatedMap : map)),
      }
    })
  },

  // 边变化处理
  onEdgesChange: (changes: EdgeChange[]) => {
    set((state) => {
      const currentMap = state.maps.find((map) => map.id === state.activeMapId)
      if (!currentMap) return state

      const updatedEdges = applyEdgeChanges(changes, currentMap.edges)
      const updatedMap = { ...currentMap, edges: updatedEdges }

      // 保存到IndexedDB
      dbService.saveMap(updatedMap).catch(console.error)

      return {
        maps: state.maps.map((map) => (map.id === state.activeMapId ? updatedMap : map)),
      }
    })
  },

  // 连接处理
  onConnect: (connection: Connection) => {
    set((state) => {
      const currentMap = state.maps.find((map) => map.id === state.activeMapId)
      if (!currentMap) return state

      const updatedEdges = addEdge(
        {
          ...connection,
          style: { stroke: "#a8a29e" }, // 默认使用石色
          type: "smoothstep", // 使用平滑的阶梯线
          // 添加交互区域
          interactionWidth: 15,
        },
        currentMap.edges,
      )

      const updatedMap = { ...currentMap, edges: updatedEdges }

      // 保存到IndexedDB
      dbService.saveMap(updatedMap).catch(console.error)

      return {
        maps: state.maps.map((map) => (map.id === state.activeMapId ? updatedMap : map)),
      }
    })
  },

  // 更新节点内容
  updateNodeContent: async (id: string, label: string, content: string) => {
    try {
      set((state) => {
        const currentMap = state.maps.find((map) => map.id === state.activeMapId)
        if (!currentMap) return state

        const updatedNodes = currentMap.nodes.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              data: {
                ...node.data,
                label,
                content,
              },
            }
          }
          return node
        })

        const updatedMap = { ...currentMap, nodes: updatedNodes }

        // 保存到IndexedDB
        dbService.saveMap(updatedMap).catch(console.error)

        return {
          maps: state.maps.map((map) => (map.id === state.activeMapId ? updatedMap : map)),
        }
      })
    } catch (error) {
      console.error("更新节点内容失败:", error)
    }
  },

  // 更新节点理解程度
  updateNodeUnderstandingLevel: async (id: string, level: UnderstandingLevel) => {
    try {
      set((state) => {
        const currentMap = state.maps.find((map) => map.id === state.activeMapId)
        if (!currentMap) return state

        const updatedNodes = currentMap.nodes.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              data: {
                ...node.data,
                understandingLevel: level,
              },
            }
          }
          return node
        })

        const updatedMap = { ...currentMap, nodes: updatedNodes }

        // 保存到IndexedDB
        dbService.saveMap(updatedMap).catch(console.error)

        return {
          maps: state.maps.map((map) => (map.id === state.activeMapId ? updatedMap : map)),
        }
      })
    } catch (error) {
      console.error("更新节点理解程度失败:", error)
    }
  },

  // 添加新节点
  addNewNode: async () => {
    try {
      set((state) => {
        const currentMap = state.maps.find((map) => map.id === state.activeMapId)
        if (!currentMap) return state

        const newNodeId = `node-${currentMap.nodes.length + 1}`
        const newNode: Node = {
          id: newNodeId,
          type: "custom",
          data: {
            label: "新知识点",
            content: "<p>在此输入内容...</p>",
            understandingLevel: UnderstandingLevel.NotStarted,
          },
          position: {
            x: Math.random() * 300 + 50,
            y: Math.random() * 300 + 50,
          },
        }

        const updatedNodes = [...currentMap.nodes, newNode]
        const updatedMap = { ...currentMap, nodes: updatedNodes }

        // 保存到IndexedDB
        dbService.saveMap(updatedMap).catch(console.error)

        return {
          maps: state.maps.map((map) => (map.id === state.activeMapId ? updatedMap : map)),
          selectedNode: newNode,
          isDialogOpen: true,
        }
      })
    } catch (error) {
      console.error("添加新节点失败:", error)
    }
  },

  // 删除节点
  deleteNode: async (nodeId: string) => {
    try {
      set((state) => {
        const currentMap = state.maps.find((map) => map.id === state.activeMapId)
        if (!currentMap) return state

        // 删除节点
        const updatedNodes = currentMap.nodes.filter((node) => node.id !== nodeId)
        // 同时删除与该节点相关的所有边
        const updatedEdges = currentMap.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)

        const updatedMap = { ...currentMap, nodes: updatedNodes, edges: updatedEdges }

        // 保存到IndexedDB
        dbService.saveMap(updatedMap).catch(console.error)

        return {
          maps: state.maps.map((map) => (map.id === state.activeMapId ? updatedMap : map)),
        }
      })
    } catch (error) {
      console.error("删除节点失败:", error)
    }
  },

  // 删除边
  deleteEdge: async (edgeId: string) => {
    try {
      set((state) => {
        const currentMap = state.maps.find((map) => map.id === state.activeMapId)
        if (!currentMap) return state

        const updatedEdges = currentMap.edges.filter((edge) => edge.id !== edgeId)
        const updatedMap = { ...currentMap, edges: updatedEdges }

        // 保存到IndexedDB
        dbService.saveMap(updatedMap).catch(console.error)

        return {
          maps: state.maps.map((map) => (map.id === state.activeMapId ? updatedMap : map)),
        }
      })
    } catch (error) {
      console.error("删除边失败:", error)
    }
  },

  // 打开节点对话框
  openNodeDialog: (node: Node) => {
    set({
      selectedNode: node,
      isDialogOpen: true,
    })
  },

  // 关闭节点对话框
  closeNodeDialog: () => {
    set({
      isDialogOpen: false,
    })
  },

  // 打开上下文菜单
  openContextMenu: (x: number, y: number, edgeId = null, nodeId = null) => {
    set({
      contextMenu: {
        visible: true,
        x,
        y,
        edgeId,
        nodeId,
      },
    })
  },

  // 关闭上下文菜单
  closeContextMenu: () => {
    set({
      contextMenu: {
        ...get().contextMenu,
        visible: false,
      },
    })
  },

  // 获取当前地图的聊天历史
  getChatHistory: () => {
    const state = get()
    const currentMap = state.maps.find((map) => map.id === state.activeMapId)
    return currentMap?.chatHistory || []
  },

  // 获取当前地图的token计数
  getTokenCount: () => {
    const state = get()
    const currentMap = state.maps.find((map) => map.id === state.activeMapId)
    return currentMap?.tokenCount || 0
  },

  // 添加聊天消息
  addChatMessage: async (message: Message) => {
    try {
      set((state) => {
        const currentMap = state.maps.find((map) => map.id === state.activeMapId)
        if (!currentMap) return state

        // 估算新消息的token数量
        const messageTokens = estimateTokenCount(message.content)
        let newTokenCount = currentMap.tokenCount + messageTokens

        // 复制当前聊天历史
        let updatedChatHistory = [...currentMap.chatHistory, message]

        // 如果超过token限制，移除最早的消息直到低于限制
        // 保留系统消息和最新的用户-助手对话
        if (newTokenCount > MAX_TOKEN_LIMIT) {
          // 保留欢迎消息
          const welcomeMessage = updatedChatHistory[0]
          // 移除欢迎消息后的消息，直到token数量低于限制
          updatedChatHistory = updatedChatHistory.slice(1)

          while (newTokenCount > MAX_TOKEN_LIMIT && updatedChatHistory.length > 2) {
            const oldestMessage = updatedChatHistory.shift()
            if (oldestMessage) {
              newTokenCount -= estimateTokenCount(oldestMessage.content)
            }
          }

          // 重新添加欢迎消息
          updatedChatHistory = [welcomeMessage, ...updatedChatHistory]
        }

        const updatedMap = {
          ...currentMap,
          chatHistory: updatedChatHistory,
          tokenCount: newTokenCount,
        }

        // 保存到IndexedDB
        dbService.saveMap(updatedMap).catch(console.error)

        return {
          maps: state.maps.map((map) => (map.id === state.activeMapId ? updatedMap : map)),
        }
      })
    } catch (error) {
      console.error("添加聊天消息失败:", error)
    }
  },

  // 清空聊天历史
  clearChatHistory: async () => {
    try {
      set((state) => {
        const currentMap = state.maps.find((map) => map.id === state.activeMapId)
        if (!currentMap) return state

        const updatedMap = {
          ...currentMap,
          chatHistory: [...initialChatHistory],
          tokenCount: 0,
        }

        // 保存到IndexedDB
        dbService.saveMap(updatedMap).catch(console.error)

        return {
          maps: state.maps.map((map) => (map.id === state.activeMapId ? updatedMap : map)),
        }
      })
    } catch (error) {
      console.error("清空聊天历史失败:", error)
    }
  },

  // 从AI生成的数据创建节点和边
  createNodesFromAI: async (nodes: Node[], edges: Edge[]) => {
    try {
      set((state) => {
        const currentMap = state.maps.find((map) => map.id === state.activeMapId)
        if (!currentMap) return state

        const updatedMap = {
          ...currentMap,
          nodes: [...nodes],
          edges: [...edges],
        }

        // 保存到IndexedDB
        dbService.saveMap(updatedMap).catch(console.error)

        return {
          maps: state.maps.map((map) => (map.id === state.activeMapId ? updatedMap : map)),
        }
      })
    } catch (error) {
      console.error("从AI创建节点失败:", error)
    }
  },
}))

export default useKnowledgeMapStore
