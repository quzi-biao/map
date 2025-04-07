import { useEffect, useState } from 'react';
import '@xyflow/react/dist/style.css';
import { ConceptMapView } from './components/map/ConceptMapView';
import { AIPanel } from './components/ai/AIPanel';
import { useMapStore } from './store/mapStore';
import { Toaster } from 'sonner';
import { Sidebar, SidebarBody, SidebarLink } from './components/ui/sidebar';
import { ChevronRight } from 'lucide-react';

export default function App() {
  const { selectedNodeId } = useMapStore();
  const [aiPanelWidth, setAiPanelWidth] = useState(256); // 默认宽度
  const [isResizing, setIsResizing] = useState(false);

  // Initialize app
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  // 处理拖动事件
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';

  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      // 计算新的宽度（窗口宽度减去鼠标位置）
      const newWidth = window.innerWidth - e.clientX;
      // 限制最小和最大宽度
      const clampedWidth = Math.min(Math.max(newWidth, 200), 600);
      setAiPanelWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div 
      className="flex h-screen w-screen overflow-hidden"
      style={{
        background: `
          linear-gradient(to bottom right, 
            rgba(17, 24, 39, 0.95), 
            rgba(10, 15, 24, 0.98)
          )
        `,
        backdropFilter: 'blur(40px)',
      }}
    >
      {/* Sidebar */}
      <Sidebar>
        <SidebarBody>
          <SidebarLink
            link={{
              label: "工具栏",
              href: "#",
              icon: <ChevronRight className="w-5 h-5 text-neutral-400" />
            }}
          />
        </SidebarBody>
      </Sidebar>
      
      <ConceptMapView />
      
      {/* Resizable border - 优化分割线 */}
      <div
        className={`w-1 transition-colors ${
          isResizing 
            ? 'bg-blue-500/30' 
            : 'bg-gray-800 hover:bg-blue-500/20'
        }`}
        onMouseDown={handleMouseDown}
      />
      
      {/* AI assistance panel - 优化面板背景 */}
      <div 
        style={{ 
          width: `${aiPanelWidth}px`,
          background: 'linear-gradient(to bottom, rgba(17, 24, 39, 0.95), rgba(10, 15, 24, 0.98))',
          borderLeft: '1px solid rgba(75, 85, 99, 0.2)',
        }}
        className={`h-full transition-all duration-75 ${
          isResizing ? 'select-none' : ''
        }`}
      >
        <AIPanel selectedNodeId={selectedNodeId} />
      </div>
      
      <Toaster position="top-right" richColors />
    </div>
  );
}