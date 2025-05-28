"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, X, Minimize2, Bot, Loader2, GripVertical, Trash2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { type Message, sendStreamingChatRequest } from "@/services/ai"
import MarkdownRenderer from "./markdown-renderer"
import { KNOWLEDGE_MAP_SYSTEM_PROMPT } from "@/services/prompts"
import useKnowledgeMapStore from "@/store/use-knowledge-map-store"
import { guidanceConversation, parseUserInfo, generateBaseKnowledgeMap } from "@/services/knowledge-map-ai"

// 默认、最小和最大宽度设置
const DEFAULT_WIDTH = 384 // 默认宽度 (w-96 = 24rem = 384px)
const MIN_WIDTH = 320 // 最小宽度 (w-80 = 20rem = 320px)
const MAX_WIDTH = 640 // 最大宽度 (40rem = 640px)

// 本地存储键名
const PANEL_WIDTH_KEY = "ai-panel-width"

// 引导状态枚举
enum GuidanceState {
  NotStarted = 0,
  InProgress = 1,
  Completed = 2,
  GeneratingMap = 3,
  Error = 4,
}

export default function AiPanel() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [tempMessage, setTempMessage] = useState<Message | null>(null)
  const [guidanceState, setGuidanceState] = useState<GuidanceState>(GuidanceState.NotStarted)
  const [guidanceMessages, setGuidanceMessages] = useState<Message[]>([])
  const [userInfo, setUserInfo] = useState<{ learning_goal: string; current_knowledge: string } | null>(null)

  // 从store获取聊天历史和操作方法
  const { getChatHistory, addChatMessage, clearChatHistory, getTokenCount, maps, activeMapId, createNodesFromAI } =
    useKnowledgeMapStore()

  const messages = getChatHistory()
  const tokenCount = getTokenCount()

  // 获取当前地图
  const currentMap = maps.find((map) => map.id === activeMapId)
  const isMapEmpty = currentMap?.nodes.length === 0

  // 面板宽度状态
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [initialWidth, setInitialWidth] = useState(DEFAULT_WIDTH)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // 从本地存储加载保存的宽度
  useEffect(() => {
    const savedWidth = localStorage.getItem(PANEL_WIDTH_KEY)
    if (savedWidth) {
      const width = Number.parseInt(savedWidth)
      if (!isNaN(width) && width >= MIN_WIDTH && width <= MAX_WIDTH) {
        setPanelWidth(width)
      }
    }
  }, [])

  // 当地图为空时，自动展开面板并开始引导
  useEffect(() => {
    if (isMapEmpty && guidanceState === GuidanceState.NotStarted) {
      setIsExpanded(true)
      startGuidance()
    }
  }, [isMapEmpty, guidanceState])

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, tempMessage, guidanceMessages])

  // 当面板展开时，聚焦输入框
  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 300)
    }
  }, [isExpanded])

  // 处理拖动
  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      // 计算新宽度 (从右侧向左侧减少)
      const deltaX = e.clientX - dragStartX
      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, initialWidth - deltaX))

      setPanelWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.body.classList.remove("dragging-active")

      // 保存到本地存储
      localStorage.setItem(PANEL_WIDTH_KEY, panelWidth.toString())
    }

    // 添加全局事件监听
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    // 添加拖动中的样式
    document.body.classList.add("dragging-active")

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.classList.remove("dragging-active")
    }
  }, [isDragging, dragStartX, initialWidth, panelWidth])

  // 开始拖动
  const startDragging = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setDragStartX(e.clientX)
    setInitialWidth(panelWidth)
  }

  // 开始引导对话
  const startGuidance = async () => {
    setGuidanceState(GuidanceState.InProgress)
    setGuidanceMessages([
      {
        id: "welcome",
        content: "你好！我注意到你的知识地图还是空的。你有想要学习的领域吗？我帮你创建一个基础的知识地图。",
        role: "assistant",
        timestamp: new Date(),
      },
    ])

    try {
      // 发送第一条引导消息
      const initialResponse = await guidanceConversation(
        [{ role: "user", content: "我想创建一个知识地图" }],
        (chunk) => {
          setTempMessage((prev) => {
            if (!prev) {
              return {
                id: `temp-${Date.now()}`,
                content: chunk,
                role: "assistant",
                timestamp: new Date(),
              }
            }
            return { ...prev, content: prev.content + chunk }
          })
        },
      )

      setTempMessage(null)
      setGuidanceMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          content: initialResponse,
          role: "assistant",
          timestamp: new Date(),
        },
      ])
    } catch (error) {
      console.error("引导对话初始化失败:", error)
      setGuidanceState(GuidanceState.Error)
      setGuidanceMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          content: "抱歉，启动引导对话时出现了问题。请稍后再试。",
          role: "assistant",
          timestamp: new Date(),
        },
      ])
    }
  }

  // 处理引导对话中的消息发送
  const handleGuidanceMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
    }

    setGuidanceMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // 添加用户消息到引导对话
      const updatedMessages = [...guidanceMessages, userMessage]

      // 创建一个临时消息用于流式更新
      setTempMessage({
        id: `temp-${Date.now()}`,
        content: "",
        role: "assistant",
        timestamp: new Date(),
      })

      // 使用流式API
      const response = await guidanceConversation(
        updatedMessages.map(({ role, content }) => ({ role, content })),
        (chunk) => {
          setTempMessage((prev) => (prev ? { ...prev, content: prev.content + chunk } : prev))
        },
      )

      // 流式响应完成后
      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: response,
        role: "assistant",
        timestamp: new Date(),
      }

      setGuidanceMessages((prev) => [...prev, assistantMessage])
      setTempMessage(null)

      // 检查是否包含用户信息总结
      const extractedUserInfo = parseUserInfo(response)
      if (extractedUserInfo) {
        setUserInfo(extractedUserInfo)
        setGuidanceState(GuidanceState.Completed)

        // 添加生成地图的消息
        setGuidanceMessages((prev) => [
          ...prev,
          {
            id: `generate-${Date.now()}`,
            content: "感谢你提供的信息！我现在将为你生成一个基础的知识地图。这可能需要一点时间，请稍候...",
            role: "assistant",
            timestamp: new Date(),
          },
        ])

        // 开始生成知识地图
        generateKnowledgeMap(extractedUserInfo)
      }
    } catch (error) {
      console.error("引导对话响应错误:", error)
      setGuidanceMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          content: "抱歉，我遇到了一些问题。请稍后再试。",
          role: "assistant",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // 生成知识地图
  const generateKnowledgeMap = async (info: { learning_goal: string; current_knowledge: string }) => {
    setGuidanceState(GuidanceState.GeneratingMap)

    try {
      // 生成基础知识地图
      const mapData = await generateBaseKnowledgeMap(info.learning_goal, info.current_knowledge)

      // 将生成的节点和边添加到地图中
      await createNodesFromAI(mapData.nodes, mapData.edges)

      // 添加成功消息
      setGuidanceMessages((prev) => [
        ...prev,
        {
          id: `success-${Date.now()}`,
          content: "✅ 知识地图已成功生成！你现在可以开始探索和编辑这些概念节点了。",
          role: "assistant",
          timestamp: new Date(),
        },
      ])

      // 重置引导状态
      setTimeout(() => {
        setGuidanceState(GuidanceState.NotStarted)
        setGuidanceMessages([])
      }, 5000)
    } catch (error) {
      console.error("生成知识地图失败:", error)
      setGuidanceState(GuidanceState.Error)
      setGuidanceMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          content: "抱歉，生成知识地图时出现了问题。请稍后再试。",
          role: "assistant",
          timestamp: new Date(),
        },
      ])
    }
  }

  // 处理常规聊天消息发送
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
    }

    // 添加用户消息到store
    await addChatMessage(userMessage)
    setInput("")
    setIsLoading(true)

    try {
      // 准备发送给API的消息
      const messagesToSend = [
        {
          role: "system" as const,
          content: KNOWLEDGE_MAP_SYSTEM_PROMPT,
        },
        ...messages.slice(-10).map(({ role, content }) => ({ role, content })),
        { role: userMessage.role, content: userMessage.content },
      ]

      // 创建一个临时消息用于流式更新
      const temp: Message = {
        id: `temp-${Date.now()}`,
        content: "",
        role: "assistant",
        timestamp: new Date(),
      }

      setTempMessage(temp)

      // 使用流式API
      const fullText = await sendStreamingChatRequest(messagesToSend, (chunk) => {
        setTempMessage((prev) => (prev ? { ...prev, content: prev.content + chunk } : prev))
      })

      // 流式响应完成后，将完整消息添加到store
      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: fullText,
        role: "assistant",
        timestamp: new Date(),
      }

      await addChatMessage(assistantMessage)
      setTempMessage(null)
    } catch (error) {
      console.error("AI响应错误:", error)

      // 添加错误消息到store
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: "抱歉，我遇到了一些问题。请稍后再试。",
        role: "assistant",
        timestamp: new Date(),
      }

      await addChatMessage(errorMessage)
      setTempMessage(null)
    } finally {
      setIsLoading(false)
    }
  }

  // 处理清空聊天历史
  const handleClearChat = async () => {
    if (window.confirm("确定要清空聊天历史吗？")) {
      await clearChatHistory()
    }
  }

  // 处理按键事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (isMapEmpty && guidanceState !== GuidanceState.NotStarted) {
        handleGuidanceMessage()
      } else {
        handleSendMessage()
      }
    }
  }

  // 渲染引导对话内容
  const renderGuidanceContent = () => {
    return (
      <>
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <div className="flex items-center">
            <Sparkles className="h-5 w-5 text-amber-400 mr-2" />
            <h3 className="font-medium text-white">知识地图引导</h3>
          </div>
          {guidanceState === GuidanceState.GeneratingMap && (
            <div className="flex items-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2 text-amber-400" />
              <span className="text-sm text-amber-400">生成中...</span>
            </div>
          )}
        </div>

        <ScrollArea className="flex-1 p-3">
          <div className="flex flex-col gap-3">
            {guidanceMessages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "rounded-lg p-3 max-w-[95%]",
                  message.role === "user" ? "bg-amber-700 text-white ml-auto" : "bg-gray-700 text-gray-100 mr-auto",
                )}
              >
                {message.role === "user" ? (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <div className="text-sm">
                    <MarkdownRenderer content={message.content} />
                  </div>
                )}
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))}
            {tempMessage && (
              <div className="bg-gray-700 text-gray-100 rounded-lg p-3 max-w-[95%] mr-auto">
                <div className="text-sm">
                  <MarkdownRenderer content={tempMessage.content || "..."} />
                </div>
                <p className="text-xs opacity-70 mt-1">
                  {tempMessage.timestamp?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            )}
            {isLoading && !tempMessage && (
              <div className="bg-gray-700 text-gray-100 rounded-lg p-3 max-w-[85%] mr-auto">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-3 border-t border-gray-700">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="回答问题..."
              className="bg-gray-700 border-gray-600 text-white"
              disabled={isLoading || guidanceState === GuidanceState.GeneratingMap}
            />
            <Button
              onClick={handleGuidanceMessage}
              disabled={!input.trim() || isLoading || guidanceState === GuidanceState.GeneratingMap}
              size="icon"
              className="bg-amber-700 hover:bg-amber-600 text-white"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </>
    )
  }

  // 渲染常规聊天内容
  const renderChatContent = () => {
    return (
      <>
        <div className="flex items-center justify-between p-3 border-b border-gray-700">
          <div className="flex items-center">
            <Bot className="h-5 w-5 text-emerald-400 mr-2" />
            <h3 className="font-medium text-white">AI 助手</h3>
            {isDragging && <span className="ml-2 text-xs text-emerald-400">宽度: {panelWidth}px</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-white"
              onClick={handleClearChat}
              title="清空聊天历史"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-white"
              onClick={() => setIsExpanded(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 p-3">
          <div className="flex flex-col gap-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "rounded-lg p-3 max-w-[95%]",
                  message.role === "user" ? "bg-amber-700 text-white ml-auto" : "bg-gray-700 text-gray-100 mr-auto",
                )}
              >
                {message.role === "user" ? (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                ) : (
                  <div className="text-sm">
                    <MarkdownRenderer content={message.content} />
                  </div>
                )}
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            ))}
            {tempMessage && (
              <div className="bg-gray-700 text-gray-100 rounded-lg p-3 max-w-[95%] mr-auto">
                <div className="text-sm">
                  <MarkdownRenderer content={tempMessage.content || "..."} />
                </div>
                <p className="text-xs opacity-70 mt-1">
                  {tempMessage.timestamp?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            )}
            {isLoading && !tempMessage && (
              <div className="bg-gray-700 text-gray-100 rounded-lg p-3 max-w-[85%] mr-auto">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="p-3 border-t border-gray-700">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入问题..."
              className="bg-gray-700 border-gray-600 text-white"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="bg-emerald-700 hover:bg-emerald-600 text-white"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </>
    )
  }

  return (
    <div
      ref={panelRef}
      className={cn(
        "fixed right-0 top-0 h-full z-10 transition-all duration-300 flex flex-col",
        isExpanded ? "" : "w-12",
      )}
      style={{
        width: isExpanded ? `${panelWidth}px` : "48px",
        transition: isDragging ? "none" : "opacity 0.3s, width 0.3s",
      }}
    >
      {/* 折叠按钮 */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-0 top-4 transform -translate-x-full bg-gray-800 hover:bg-gray-700 rounded-l-md rounded-r-none h-12 w-8 border-0"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </Button>

      {/* 拖动条 - 增加宽度并添加明显的视觉提示 */}
      {isExpanded && (
        <div
          className={cn(
            "absolute left-0 top-0 h-full w-4 cursor-ew-resize z-20",
            isDragging ? "bg-emerald-500/30" : "hover:bg-emerald-500/20",
          )}
          onMouseDown={startDragging}
          style={{ transform: "translateX(-2px)" }}
        >
          <div
            className={cn(
              "absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2 bg-gray-700 rounded-full p-1",
              isDragging ? "opacity-100" : "opacity-0 hover:opacity-100",
            )}
          >
            <GripVertical className="h-4 w-4 text-emerald-400" />
          </div>
        </div>
      )}

      {/* 面板内容 */}
      <div
        className={cn(
          "bg-gray-800 border-l border-gray-700 h-full flex flex-col",
          isExpanded ? "opacity-100" : "opacity-0",
        )}
      >
        {isMapEmpty && guidanceState !== GuidanceState.NotStarted ? renderGuidanceContent() : renderChatContent()}
      </div>
    </div>
  )
}
