import { EdgeProps, getBezierPath, Edge } from '@xyflow/react';

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
}: EdgeProps<LightRayEdge>) {
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
    <>
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
          strokeWidth: 8,
          stroke: '#FFDE59',
          opacity: intensity / 100,
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
          strokeWidth: 1,
          stroke: '#FFFFFF',
          opacity: 0.9,
        }}
        className="react-flow__edge-path"
        d={edgePath}
      />
    </>
  );
} 