
// 概念节点
export interface ConceptNode {
    id: string;
    data: {
      title: string;
      content: string;
      brightness: number;  // 0-100表示理解程度
      icon?: string;
    };
    position: { x: number; y: number };
  }
  
  // 概念连接
  export interface ConceptEdge {
    id: string;
    source: string;  // 源节点ID
    target: string;  // 目标节点ID
    type: 'conceptEdge';
    strength: number;      // 关联强度
  }