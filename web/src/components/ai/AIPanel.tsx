import React, { useState, useRef, useEffect } from 'react';
import { Message, sendStreamingChatRequest } from '@/services/ai/openrouterService';
import { useMapStore } from '@/store/mapStore';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2 } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AIProps {
  selectedNodeId: string | null;
}

export function AIPanel({ selectedNodeId }: AIProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingResponse] = useState('');
  const [selectedModel, setSelectedModel] = useState('deepseek/deepseek-r1');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { nodes } = useMapStore();
  
  useEffect(() => {
  }, [selectedNodeId]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingResponse]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      let contextPrompt = '';
      if (selectedNodeId) {
        const selectedNode = nodes.find(node => node.id === selectedNodeId);
        if (selectedNode) {
          contextPrompt = `参考节点: 标题「${selectedNode.data.title || '未命名'}」，内容「${selectedNode.data.content || '无内容'}」\n\n`;
        }
      }
      
      const systemPrompt: Message = { 
        role: 'system', 
        content: '我希望你扮演一个深入本质的人与我交流。你重视第一性原理，多维度思考，重视事实。你的语言风格自然质朴，说人话。'
      };
      
      const chatMessages = [
        systemPrompt,
        ...messages,
        { role: 'user', content: contextPrompt + input }
      ];
      
      // 先添加一个空的助手回复
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      
      let accumulatedContent = ''; // 用于累积内容

      // 使用流式API
      await sendStreamingChatRequest(
        chatMessages as Message[],
        (chunk) => {
          // 累积新的内容
          accumulatedContent += chunk;
          // 更新最后一条消息，使用完整的累积内容而不是追加
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage.role === 'assistant') {
              lastMessage.content = accumulatedContent;
            }
            return newMessages;
          });
        },
        selectedModel,
        0.7
      );
      
    } catch (error) {
      console.error('AI对话错误:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，发生了错误，请重试。' }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="h-full flex flex-col bg-gray-950/50">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-lg font-medium">AI 助手</h3>
        {selectedNodeId && (
          <div className="mt-2">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-full !bg-gray-900 !text-white border-gray-700">
              <SelectValue placeholder="选择AI模型" />
            </SelectTrigger>
            <SelectContent className="!bg-gray-900 border-gray-700">
              <SelectItem value="deepseek/deepseek-r1" className="!text-gray-200 focus:!bg-gray-800 focus:!text-white">Deepseek R1</SelectItem>
              <SelectItem value="deepseek/deepseek-r1:online" className="!text-gray-200 focus:!bg-gray-800 focus:!text-white">Deepseek r1 online</SelectItem>
              <SelectItem value="anthropic/claude-3.7-sonnet:thinking" className="!text-gray-200 focus:!bg-gray-800 focus:!text-white">Claude 3.7 thinking</SelectItem>
              <SelectItem value="perplexity/sonar-deep-research" className="!text-gray-200 focus:!bg-gray-800 focus:!text-white">perplexity/sonar-deep-research</SelectItem>
            </SelectContent>
          </Select>
        </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-grow overflow-y-auto">
        {selectedNodeId ? (
          <div className="flex flex-col gap-3 p-4">
            {messages.map((msg, index) => (
              <div 
                key={index}
                className={`p-2 rounded-md text-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-900/30 ml-4' 
                    : 'bg-gray-800/50 mr-4'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
            
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">
              选择一个节点来与 AI 助手对话
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {selectedNodeId && (
        <div className="border-t border-gray-800 p-4">
          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="向AI助手发送消息..."
              className="min-h-[80px] text-sm resize-none bg-gray-800/50 border-gray-700"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className={`h-10 px-3 ${isLoading ? 'bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isLoading ? 
                <Loader2 className="h-4 w-4 animate-spin" /> : 
                <Send className="h-4 w-4" />
              }
            </Button>
          </form>
        </div>
      )}
    </div>
  );
} 