import { create } from 'zustand';
import { Node, Edge } from '@xyflow/react';
import { saveMap, loadMap } from '@/services/storage/indexedDBService';

// 定义节点和边的数据结构
export interface ConceptNodeData {
  title?: string;
  content?: string;
  brightness?: number;
  icon?: string;
}

export interface ConceptEdgeData {
  strength: number;
}

interface MapState {
  id: string | null;
  title: string;
  nodes: Node[];
  edges: Edge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  
  // 操作方法
  setMapData: (data: any) => void;
  setNodes: (nodes: any[]) => void;
  setEdges: (edges: any[]) => void;
  addNode: (node: any) => void;
  updateNodeData: (nodeId: string, data: ConceptNodeData) => void;
  updateNodePosition: (nodeId: string, position: { x: number, y: number }) => void;
  removeNode: (nodeId: string) => void;
  addEdge: (edge: any) => void;
  removeEdge: (edgeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;
  saveCurrentMap: () => Promise<string>;
  loadMap: (mapId?: string) => Promise<void>;
}

// 添加默认地图数据
const DEFAULT_MAP = {
  id: '0',
  title: '默认地图',
  nodes: [
    {
      id: 'default-node',
      type: 'conceptNode',
      position: { x: 250, y: 200 },
      data: {
        title: '开始',
        content: '这是你的第一个概念节点',
        brightness: 50
      }
    }
  ],
  edges: []
};

// 添加一个工具函数来处理自动保存
const autoSave = async (store: MapState) => {
  try {
    await store.saveCurrentMap();
  } catch (error) {
    console.error('自动保存失败:', error);
    // 这里可以添加错误提示UI
  }
};

export const useMapStore = create<MapState>((set, get) => ({
  id: '0',
  title: '新地图',
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  
  setMapData: (data) => set(data),
  
  setNodes: (nodes) => set({ nodes }),
  
  setEdges: (edges) => set({ edges }),
  
  addNode: (node) => {
    set((state) => ({ nodes: [...state.nodes, node] }));
    autoSave(get());
  },
  
  updateNodeData: (nodeId, data) => {
    set((state) => ({
      nodes: state.nodes.map((node) => 
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      )
    }));
    autoSave(get());
  },
  
  updateNodePosition: (nodeId, position) => {
    set((state) => ({
      nodes: state.nodes.map((node) => 
        node.id === nodeId ? { ...node, position } : node
      )
    }));
    autoSave(get());
  },
  
  removeNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
      selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId
    }));
    autoSave(get());
  },
  
  addEdge: (edge) => {
    set((state) => ({ edges: [...state.edges, edge] }));
    autoSave(get());
  },
  
  removeEdge: (edgeId) => {
    set((state) => ({
      edges: state.edges.filter((edge) => edge.id !== edgeId),
      selectedEdgeId: state.selectedEdgeId === edgeId ? null : state.selectedEdgeId
    }));
    autoSave(get());
  },
  
  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
  
  selectEdge: (edgeId) => set({ selectedEdgeId: edgeId }),
  
  // 保存当前地图
  saveCurrentMap: async () => {
    const state = get();
    const mapData = {
      id: state.id || crypto.randomUUID(),
      title: state.title,
      nodes: state.nodes,
      edges: state.edges,
    };
    
    try {
      const savedId = await saveMap(mapData);
      set({ id: savedId });
      return savedId;
    } catch (error) {
      console.error('保存地图失败:', error);
      throw error;
    }
  },
  
  // 加载地图
  loadMap: async (mapId?: string) => {
    try {
      if (!mapId) {
        mapId = '0';
      }
      
      let mapData = await loadMap(mapId);

      // 如果是默认地图且不存在，则创建它
      if (mapId === '0' && !mapData) {
        await saveMap(DEFAULT_MAP);
        mapData = DEFAULT_MAP;
      }

      if (mapData) {
        set({
          id: mapData.id,
          title: mapData.title,
          nodes: mapData.nodes || [],
          edges: mapData.edges || [],
          selectedNodeId: null,
          selectedEdgeId: null
        });
      }
    } catch (error) {
      console.error('加载地图失败:', error);
      // 如果加载失败，使用默认地图
      set({
        id: DEFAULT_MAP.id,
        title: DEFAULT_MAP.title,
        nodes: DEFAULT_MAP.nodes,
        edges: DEFAULT_MAP.edges,
        selectedNodeId: null,
        selectedEdgeId: null
      });
    }
  }
}));
