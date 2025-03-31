import { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Controls,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import LightPointNode from './components/LightPointNode';
import LightRayEdge, { LightRayEdge as LightRayEdgeType } from './components/LightRayEdge';


const nodeTypes = {
  lightPoint: LightPointNode,
};

const edgeTypes = {
  lightRay: LightRayEdge,
};

const rfStyle = {
  backgroundColor: '#B8CEFF',
};

const initialNodes: LightPointNode[] = [
  { 
    id: '1', 
    type: 'lightPoint',
    position: { x: 250, y: 100 }, 
    data: { 
      label: '概念一',
      content: '这是概念一的详细内容...',
    } 
  },
  { 
    id: '2', 
    type: 'lightPoint',
    position: { x: 250, y: 300 }, 
    data: { 
      label: '概念二',
      content: '这是概念二的详细内容...',
    } 
  },
];

const initialEdges: LightRayEdgeType[] = [
  { 
    id: 'e1-2', 
    source: '1', 
    target: '2', 
    type: 'lightRay',
    data: { 
      intensity: 70 // Adjust intensity as needed (0-100)
    } 
  }
];


export default function App() {
  const [nodes, setNodes] = useState<LightPointNode[]>(initialNodes);
  const [edges, setEdges] = useState<LightRayEdgeType[]>(initialEdges);

  // Function to update node content
  const updateNodeContent = useCallback((nodeId: string, content: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              content,
            },
          };
        }
        return node;
      })
    );
  }, []);

  // Add the update function to each node's data
  useEffect(() => {
    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          updateContent: updateNodeContent,
        },
      }))
    );
  }, [updateNodeContent]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds) as LightPointNode[]),
    [setNodes],
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds) as LightRayEdgeType[]),
    [setEdges],
  );
  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge({
      ...connection,
      type: 'lightRay',
      data: { intensity: 70 }
    }, eds) as LightRayEdgeType[]),
    [setEdges],
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        style={rfStyle}
      >
        <Controls />
      </ReactFlow>
    </div>
  );
}