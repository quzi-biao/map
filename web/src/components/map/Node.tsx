import { useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { ChevronDown, GripHorizontal, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useMapStore } from '@/store/mapStore';

function ConceptNodeComponent({ data, id }: NodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const updateNodeData = useMapStore(state => state.updateNodeData);
  const removeNode = useMapStore(state => state.removeNode);
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsTitleEditing(true);
  };

  const handleTitleBlur = () => {
    setIsTitleEditing(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsTitleEditing(false);
    }
  };

  // 使用明确的类型转换确保 brightness 是数字
  const brightness = Number(data.brightness ?? 50);
  
  // 高级视觉效果计算
  const baseOpacity = 0.95; // 提高基础不透明度
  const glowIntensity = brightness / 100; // 发光强度
  const blurRadius = Math.max(8, brightness / 10); // 动态模糊半径
  
  // 渐变色计算
  const getGradientColors = (brightness: number) => {
    // 基础颜色：从深邃的靛蓝到柔和的天青
    const baseGradient = {
      from: [10, 20, 30],      // 深邃的夜空色
      to: [100, 179, 191],     // 降低天青色的亮度到75%左右
    };
    
    // 根据亮度调整颜色，并稍微调整不透明度
    const mix = (brightness / 100);
    const r1 = Math.round(baseGradient.from[0] * (1 - mix) + baseGradient.to[0] * mix);
    const g1 = Math.round(baseGradient.from[1] * (1 - mix) + baseGradient.to[1] * mix);
    const b1 = Math.round(baseGradient.from[2] * (1 - mix) + baseGradient.to[2] * mix);
    
    return `linear-gradient(135deg, 
      rgba(${r1}, ${g1}, ${b1}, 0.9) 0%,
      rgba(${r1 + 10}, ${g1 + 10}, ${b1 + 15}, 0.95) 100%)`;
  };

  // 添加删除处理函数
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这个节点吗？')) {
      removeNode(id);
    }
  };

  return (
    <Card 
      className={`
        min-w-[240px] relative backdrop-blur-sm
        transition-all duration-300 ease-out
        ${isExpanded ? 'min-h-[220px]' : 'h-auto'}
      `}
      style={{
        background: getGradientColors(brightness),
        opacity: baseOpacity,
        boxShadow: `
          0 4px 12px rgba(0, 0, 0, 0.15),
          0 0 ${blurRadius * 1.5}px rgba(100, 179, 191, ${glowIntensity * 0.35}),
          inset 0 0 3px rgba(255, 255, 255, ${0.1 + glowIntensity * 0.15})
        `,
        borderColor: `rgba(100, 179, 191, ${glowIntensity * 0.2})`,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* 连接手柄 - 顶部 */}
      <Handle 
        type="target" 
        position={Position.Top} 
        className={`
          w-3 h-3 rounded-full border-2 border-white/20
          transition-all duration-300
          bg-gradient-to-r from-cyan-300/80 to-blue-400/80
          hover:scale-125 hover:border-white/40
          ${brightness > 70 ? 'shadow-glow' : ''}
        `}
      />
      
      {/* 标题栏 */}
      <CardHeader 
        className="p-3 cursor-pointer flex flex-row items-center justify-between group"
        onClick={toggleExpand}
      >
        <div className="flex items-center gap-2 flex-1">
          <GripHorizontal className="w-4 h-4 text-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
          {isTitleEditing ? (
            <Input
              autoFocus
              value={String(data.title || '')}
              onChange={(e) => updateNodeData(id, { title: e.target.value })}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-medium bg-black/20 border-white/20 text-white h-7 py-0 px-2"
            />
          ) : (
            <h3 
              className="text-sm font-medium text-white cursor-text truncate hover:text-white/90 transition-colors" 
              onClick={handleTitleClick}
            >
              {String(data.title) || '概念'}
            </h3>
          )}
        </div>
        
        {/* 操作按钮组 */}
        <div className="flex items-center gap-1">
          {/* 删除按钮 */}
          <div 
            className={`
              w-5 h-5 flex items-center justify-center
              opacity-0 group-hover:opacity-50 hover:!opacity-100
              transition-all duration-300 ease-out
              cursor-pointer
            `}
            onClick={handleDelete}
          >
            <Trash2 
              className="h-4 w-4 text-red-300 hover:text-red-400 transition-colors"
            />
          </div>

          {/* 展开按钮 */}
          <div 
            className={`
              w-5 h-5 flex items-center justify-center
              transition-all duration-300 ease-out
              opacity-50 group-hover:opacity-100
            `}
          >
            <ChevronDown 
              className={`
                h-4 w-4 text-white/70
                transform transition-transform duration-300
                ${isExpanded ? 'rotate-180' : 'rotate-0'}
              `}
            />
          </div>
        </div>
      </CardHeader>
      
      {/* 展开内容 */}
      {isExpanded && (
        <CardContent className="p-3 pt-0 flex flex-col gap-3">
          <Textarea
            value={String(data.content || '')}
            onChange={(e) => updateNodeData(id, { content: e.target.value })}
            placeholder="输入内容..."
            className="min-h-[80px] text-sm resize-y bg-black/20 border-white/20 text-white placeholder:text-white/50"
            onClick={(e) => e.stopPropagation()}
          />
          
          {/* <div className="mt-2">
            <label className="text-xs mb-1 block text-white/70">理解程度</label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Slider
                  value={[brightness]}
                  min={0}
                  max={100}
                  step={5}
                  className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-0 [&_[role=slider]]:shadow-md"
                  onValueChange={(values) => updateNodeData(id, { brightness: values[0] })}
                />
              </div>
              <span className="text-xs w-8 text-white/70">{brightness}%</span>
            </div>
          </div> */}
        </CardContent>
      )}
      
      {/* 连接手柄 - 底部 */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className={`
          w-3 h-3 rounded-full border-2 border-white/30
          transition-all duration-300
          bg-gradient-to-r from-sky-400 to-blue-500
          hover:scale-125 hover:border-white/50
        `}
      />
    </Card>
  );
}

export default ConceptNodeComponent; 