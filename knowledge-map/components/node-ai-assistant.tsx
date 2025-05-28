"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import type { Node } from "reactflow"
import { Send, Loader2, Bot, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { type Message, sendStreamingChatRequest } from "@/services/ai"
import MarkdownRenderer from "./markdown-renderer"
import { KNOWLEDGE_MAP_SYSTEM_PROMPT } from "@/services/prompts"

interface NodeAiAssistantProps {
  node: Node | null
  isCollapsed: boolean
  toggleCollapse: () => void
}

export default function NodeAiAssistant({ node, isCollapsed, toggleCollapse }: NodeAiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [tempMessage, setTempMessage] = useState<Message | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 当节点变化时重置状态
  useEffect(() => {
    if (node) {
      setMessages([
        {
          id: "welcome",
          content: `你好，老朋友`,
          role: "assistant",
          timestamp: new Date(),
        },
      ])
      setInput("")
      setTempMessage(null)

      // 聚焦输入框
      setTimeout(() => {
        inputRef.current?.focus()
      }, 300)
    }
  }, [node])

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, tempMessage])

  // 处理消息发送
  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || !node) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input.trim(),
      role: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      // 准备发送给API的消息
      const messagesToSend = [
        {
          role: "system" as const,
          content: `${KNOWLEDGE_MAP_SYSTEM_PROMPT}

你正在帮助用户完善一个关于"${node.data.label}"的知识节点。节点当前内容是：

${node.data.content}`,
        },
        ...messages.slice(-5).map(({ role, content }) => ({ role, content })),
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

      // 流式响应完成后，将完整消息添加到历史
      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: fullText,
        role: "assistant",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
      setTempMessage(null)
    } catch (error) {
      console.error("AI响应错误:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          content: "抱歉，我遇到了一些问题。请稍后再试。",
          role: "assistant",
          timestamp: new Date(),
        },
      ])
      setTempMessage(null)
    } finally {
      setIsLoading(false)
    }
  }

  // 处理按键事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!node) return null

  return (
    <div
      className={`transition-all duration-300 bg-gray-800 border border-gray-700 rounded-lg shadow-xl flex flex-col overflow-hidden ${
        isCollapsed ? "w-[50px]" : "w-[350px]"
      } h-[500px]`}
    >
      {/* 面板头部 */}
      <div className="p-3 border-b border-gray-700/50 flex items-center justify-between">
        <div className="flex items-center">
          <Bot className="h-5 w-5 text-emerald-400 mr-2" />
          {!isCollapsed && <h3 className="font-medium text-white">AI 助手</h3>}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapse}
          className="h-8 w-8 p-0 text-gray-400 hover:text-white"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* 聊天区域 - 只在展开时显示 */}
      {!isCollapsed && (
        <>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-3">
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

          {/* 输入区域 */}
          <div className="p-3 border-t border-gray-700/50">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="询问关于这个概念的问题..."
                className="bg-gray-700 border-gray-600 text-white text-sm"
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
      )}
    </div>
  )
}
