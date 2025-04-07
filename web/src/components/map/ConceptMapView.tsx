import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  useKeyPress,
  Background,
  Panel,
  NodeChange,
  Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ConceptNodeComponent from './Node';
import ConceptEdgeComponent from './Edge';
import { useMapStore } from '@/store/mapStore';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Define node and edge types for ReactFlow
const nodeTypes = {
  conceptNode: ConceptNodeComponent,
};

const edgeTypes = {
  conceptEdge: ConceptEdgeComponent,
};

// Styling for the flow
const rfStyle = {
  background: `radial-gradient(
    circle at 50% 50%,
    rgba(71, 85, 105, 0.55) 0%,   // slate-600 更亮的起始色
    rgba(51, 65, 85, 0.75) 100%   // slate-700 更亮的结束色
  )`,
  boxShadow: `
    inset 0 0 140px rgba(203, 213, 225, 0.07),  // 顶部柔和光晕
    inset 0 0 60px rgba(148, 163, 184, 0.05)    // 整体柔和光感
  `,
};

export function ConceptMapView() {
  const {
    nodes,
    edges,
    selectedNodeId,
    selectedEdgeId,
    selectNode,
    selectEdge,
    loadMap,
    updateNodePosition,
    removeNode,
    removeEdge,
    addNode,
    setEdges,
    addEdge
  } = useMapStore();
  
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    changes.forEach(change => {
      if (change.type === 'position' && change.position) {
        updateNodePosition(change.id, change.position);
      }
    });
  }, [nodes, updateNodePosition]);
  
  const onEdgesChange = useCallback(() => {
    const edgesCopy = [...edges];
    setEdges(edgesCopy);
  }, [edges, setEdges]);
  
  const onConnect = useCallback((connection: Connection) => {
    const newEdge = {
      id: `edge-${Date.now()}`,
      source: connection.source || '',
      target: connection.target || '',
      type: 'conceptEdge',
    };
    addEdge(newEdge);
  }, [addEdge]);
  
  useEffect(() => {
    loadMap();
  }, [loadMap]);
  
  // Delete key press detection
  const deleteKeyPressed = useKeyPress('Delete');

  // Handle edge selection
  const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    selectNode(null);
    selectEdge(edge.id === selectedEdgeId ? null : edge.id);
  }, [selectedEdgeId, selectEdge]);

  // Handle node selection
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    selectEdge(null);
    selectNode(node.id);
  }, [selectNode, selectEdge]);
  
  // Handle delete key
  useEffect(() => {
    if (deleteKeyPressed) {
      if (selectedNodeId) {
        removeNode(selectedNodeId);
      } else if (selectedEdgeId) {
        removeEdge(selectedEdgeId);
      }
    }
  }, [deleteKeyPressed, selectedNodeId, selectedEdgeId, removeNode, removeEdge]);

  // Function to add a new node at center of viewport
  const addNewNode = useCallback(() => {
    // 创建一个新的节点
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'conceptNode',
      position: { x: 250, y: 200 + Math.random() * 100 },
      data: {
        title: '新概念',
        content: '',
        brightness: 50
      }
    };
    
    addNode(newNode);
  }, [addNode]);

  return (
    <div className="flex-grow h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        style={rfStyle}
        deleteKeyCode="Delete"
      >
        <Background 
          color="rgba(255, 255, 255, 0.12)"  // 更清晰但仍然柔和的网格线
          gap={16}
          size={1}
        />
        
        <Panel position="bottom-center" className="mb-8">
          <Button 
            onClick={addNewNode}
            className="px-6 py-3 bg-blue-400/25 hover:bg-blue-300/35 shadow-lg backdrop-blur-sm"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" /> 添加光点节点
          </Button>
        </Panel>
      </ReactFlow>
    </div>
  );
} 