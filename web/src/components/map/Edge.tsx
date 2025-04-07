import { EdgeProps, getBezierPath, Edge } from '@xyflow/react';
import { useMapStore } from '@/store/mapStore';

// Define edge data interface
interface LightRayEdgeData extends Record<string, unknown> {
  intensity?: number; // Controls the light intensity (0-100)
}

// Define edge type
export type LightRayEdge = Edge<LightRayEdgeData, 'lightRay'>;



export default function LightRayEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  selected,
}: EdgeProps<LightRayEdge>) {
  const { selectedEdgeId } = useMapStore();
  const isSelected = selected || selectedEdgeId === id;

  // Get the edge path
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Default intensity if not provided
  const intensity = data?.intensity || 60;
  
  return (
    <g className={`edge ${isSelected ? 'selected' : ''}`}>
      {/* Base edge with glow effect */}
      <path
        id={id}
        style={{
          ...style,
          strokeWidth: 3,
          stroke: '#FFDE59', // Yellow base color
          filter: 'blur(1px)',
        }}
        className="react-flow__edge-path"
        d={edgePath}
      />
      
      {/* Light halo effect */}
      <path
        id={`${id}-glow`}
        style={{
          ...style,
          strokeWidth: isSelected ? 12 : 8,
          stroke: isSelected ? '#FFE980' : '#FFDE59',
          opacity: isSelected ? (intensity + 20) / 100 : intensity / 100,
          filter: 'blur(4px)',
        }}
        className="react-flow__edge-path"
        d={edgePath}
      />
      
      {/* Bright center line */}
      <path
        id={`${id}-center`}
        style={{
          ...style,
          strokeWidth: isSelected ? 2 : 1,
          stroke: '#FFFFFF',
          opacity: isSelected ? 1 : 0.9,
        }}
        className="react-flow__edge-path"
        d={edgePath}
      />
    </g>
  );
} 