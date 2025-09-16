import type { Node, Edge } from "reactflow"
import { UnderstandingLevel } from "@/types/knowledge-map"

// Opacity constants
const FULLY_OPAQUE = 1.0
const CONNECTED_NOT_STARTED_OPACITY = 0.7
const ISOLATED_NOT_STARTED_OPACITY = 0.7

const EDGE_FULLY_OPAQUE = 1.0
const EDGE_CONNECTED_NOT_STARTED_OPACITY = 0.7
const EDGE_ISOLATED_NOT_STARTED_OPACITY = 0.1

interface ProcessedMapElements {
  processedNodes: Node[]
  processedEdges: Edge[]
}

export function processMapElementsForDisplay(currentNodes: Node[], currentEdges: Edge[]): ProcessedMapElements {
  if (!currentNodes || !currentEdges) {
    return { processedNodes: [], processedEdges: [] }
  }

  const understoodNodeIds = new Set<string>()
  const notStartedNodeIds = new Set<string>()

  currentNodes.forEach((node) => {
    const level = node.data?.understandingLevel
    if (level !== undefined && level !== UnderstandingLevel.NotStarted) {
      understoodNodeIds.add(node.id)
    } else {
      // Covers NotStarted and undefined/null levels
      notStartedNodeIds.add(node.id)
    }
  })

  const allNodesEffectivelyNotStarted = currentNodes.length > 0 && understoodNodeIds.size === 0
  let firstFocusNodeId: string | null = null

  if (allNodesEffectivelyNotStarted && currentNodes.length > 0) {
    // 找出距离(0,0)最近的节点作为焦点
    firstFocusNodeId =
      currentNodes.reduce(
        (closest, node) => {
          // 计算当前节点到原点的距离
          const currentDistance = Math.sqrt(Math.pow(node.position.x, 2) + Math.pow(node.position.y, 2))

          // 计算目前最近节点到原点的距离
          const closestDistance = closest
            ? Math.sqrt(Math.pow(closest.position.x, 2) + Math.pow(closest.position.y, 2))
            : Number.POSITIVE_INFINITY

          // 返回距离更近的节点
          return currentDistance < closestDistance ? node : closest
        },
        null as Node | null,
      )?.id || null
  }

  const notStartedConnectedToFocusIds = new Set<string>()

  if (!allNodesEffectivelyNotStarted && understoodNodeIds.size > 0) {
    // Original logic: focus on understood nodes
    currentEdges.forEach((edge) => {
      const sourceIsUnderstood = understoodNodeIds.has(edge.source)
      const targetIsUnderstood = understoodNodeIds.has(edge.target)
      const sourceIsNotStarted = notStartedNodeIds.has(edge.source)
      const targetIsNotStarted = notStartedNodeIds.has(edge.target)

      if (sourceIsUnderstood && targetIsNotStarted) {
        notStartedConnectedToFocusIds.add(edge.target)
      }
      if (targetIsUnderstood && sourceIsNotStarted) {
        notStartedConnectedToFocusIds.add(edge.source)
      }
    })
  } else if (allNodesEffectivelyNotStarted && firstFocusNodeId) {
    // New logic: all NotStarted, focus on a primary node
    currentEdges.forEach((edge) => {
      if (edge.source === firstFocusNodeId && notStartedNodeIds.has(edge.target) && edge.target !== firstFocusNodeId) {
        notStartedConnectedToFocusIds.add(edge.target)
      }
      if (edge.target === firstFocusNodeId && notStartedNodeIds.has(edge.source) && edge.source !== firstFocusNodeId) {
        notStartedConnectedToFocusIds.add(edge.source)
      }
    })
    // The firstFocusNodeId itself should be fully opaque
    if (firstFocusNodeId) {
      notStartedConnectedToFocusIds.add(firstFocusNodeId) // Ensure the focus node is treated as "connected" for opacity
    }
  }

  const processedNodes: Node[] = currentNodes.map((node) => {
    let opacity
    if (understoodNodeIds.has(node.id)) {
      opacity = FULLY_OPAQUE
    } else if (allNodesEffectivelyNotStarted && node.id === firstFocusNodeId) {
      opacity = FULLY_OPAQUE // The main focus node when all are not started
    } else if (notStartedNodeIds.has(node.id)) {
      if (notStartedConnectedToFocusIds.has(node.id)) {
        opacity = CONNECTED_NOT_STARTED_OPACITY
      } else {
        opacity = ISOLATED_NOT_STARTED_OPACITY
      }
    } else {
      // Fallback for nodes that might not fit other categories (e.g., undefined level but not in notStartedNodeIds)
      opacity = FULLY_OPAQUE
    }
    return {
      ...node,
      style: { ...node.style, opacity },
    }
  })

  const processedEdges: Edge[] = currentEdges.map((edge) => {
    let opacity
    const sourceIsUnderstood = understoodNodeIds.has(edge.source)
    const targetIsUnderstood = understoodNodeIds.has(edge.target)
    const sourceIsNotStarted = notStartedNodeIds.has(edge.source)
    const targetIsNotStarted = notStartedNodeIds.has(edge.target)

    const sourceIsFirstFocus = allNodesEffectivelyNotStarted && edge.source === firstFocusNodeId
    const targetIsFirstFocus = allNodesEffectivelyNotStarted && edge.target === firstFocusNodeId

    if (sourceIsUnderstood && targetIsUnderstood) {
      opacity = EDGE_FULLY_OPAQUE
    } else if ((sourceIsUnderstood && targetIsNotStarted) || (targetIsUnderstood && sourceIsNotStarted)) {
      opacity = EDGE_CONNECTED_NOT_STARTED_OPACITY
    } else if (allNodesEffectivelyNotStarted && (sourceIsFirstFocus || targetIsFirstFocus)) {
      // If connected to the first focus node (when all are NotStarted)
      opacity = EDGE_CONNECTED_NOT_STARTED_OPACITY
    } else if (sourceIsNotStarted && targetIsNotStarted) {
      // If both nodes of an edge are "Not Started" AND neither is the firstFocusNode (when all are not started)
      // AND neither is connected to an understood node (covered by other conditions)
      // then this edge connects two "isolated" or "secondary not started" nodes.
      const sourceIsConnectedToFocus = notStartedConnectedToFocusIds.has(edge.source)
      const targetIsConnectedToFocus = notStartedConnectedToFocusIds.has(edge.target)

      if (
        allNodesEffectivelyNotStarted &&
        (sourceIsConnectedToFocus || targetIsConnectedToFocus) &&
        !(sourceIsFirstFocus || targetIsFirstFocus)
      ) {
        // Edge connected to a node that is connected to the primary focus (but not the primary focus itself)
        opacity = EDGE_CONNECTED_NOT_STARTED_OPACITY
      } else if (allNodesEffectivelyNotStarted && !(sourceIsFirstFocus || targetIsFirstFocus)) {
        opacity = EDGE_ISOLATED_NOT_STARTED_OPACITY
      } else {
        // General case for two not-started nodes not part of the initial focus logic
        opacity = EDGE_ISOLATED_NOT_STARTED_OPACITY
      }
    } else {
      // Fallback for edges that don't fit other categories
      opacity = EDGE_FULLY_OPAQUE
    }
    return {
      ...edge,
      style: { ...edge.style, strokeOpacity: opacity, opacity }, // also apply to general opacity for consistency
    }
  })

  return { processedNodes, processedEdges }
}
