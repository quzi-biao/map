import { useState } from 'react';
import { Handle, Position, Node, NodeProps } from '@xyflow/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type LightPointNode = Node<LightPointNodeData, 'lightPoint'>;

type LightPointNodeData = {
  label: string;
  content: string;
  updateContent?: (nodeId: string, content: string) => void;
}

function LightPointNode({ data, id }: NodeProps<LightPointNode>) {
  const typedData = data as LightPointNodeData;
  const [isExpanded, setIsExpanded] = useState(false);
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card className={`min-w-[200px] shadow-md transition-all duration-300 ${isExpanded ? 'min-h-[150px]' : 'h-auto'}`}>
      <Handle 
        type="target" 
        position={Position.Top} 
        className="w-3 h-3 bg-blue-500" 
      />
      
      <CardHeader className="p-3 cursor-pointer flex flex-row items-center justify-between" onClick={toggleExpand}>
        <h3 className="text-sm font-medium">{typedData.label || '概念'}</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
          {isExpanded ? 
            <ChevronDown className="h-4 w-4" /> : 
            <ChevronRight className="h-4 w-4" />
          }
        </Button>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="p-3 pt-0">
          <Textarea
            value={typedData.content || ''}
            onChange={(e) => typedData.updateContent && typedData.updateContent(id, e.target.value)}
            placeholder="输入内容..."
            className="min-h-[80px] text-sm resize-y"
            onClick={(e) => e.stopPropagation()}
          />
        </CardContent>
      )}
      
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="w-3 h-3 bg-blue-500" 
      />
    </Card>
  );
}

export default LightPointNode; 