"use client"

import { useState } from "react"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table"
import { ListItemNode, ListNode } from "@lexical/list"
import { CodeHighlightNode, CodeNode } from "@lexical/code"
import { AutoLinkNode, LinkNode } from "@lexical/link"
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin"
import { TRANSFORMERS } from "@lexical/markdown"
import LexicalErrorBoundary from "@lexical/react/LexicalErrorBoundary"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { $generateHtmlFromNodes } from "@lexical/html"
import type { EditorState } from "lexical"
import { ToolbarPlugin } from "./toolbar-plugin"

interface LexicalEditorProps {
  content: string
  onChange: (content: string) => void
}

export default function LexicalEditor({ content, onChange }: LexicalEditorProps) {
  const [htmlString, setHtmlString] = useState("")

  // 初始化编辑器配置
  const initialConfig = {
    namespace: "KnowledgeMapEditor",
    theme: {
      root: "p-0 focus:outline-none min-h-[200px] max-h-[500px] overflow-y-auto",
      link: "text-blue-500 underline",
      text: {
        bold: "font-bold",
        italic: "italic",
        underline: "underline",
        strikethrough: "line-through",
        underlineStrikethrough: "underline line-through",
      },
    },
    onError(error: Error) {
      console.error(error)
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      CodeNode,
      CodeHighlightNode,
      TableNode,
      TableCellNode,
      TableRowNode,
      AutoLinkNode,
      LinkNode,
    ],
    editorState: () => {
      // 如果有初始内容，可以在这里设置
      return null
    },
  }

  // 处理编辑器内容变化
  const handleEditorChange = (editorState: EditorState) => {
    editorState.read(() => {
      const htmlOutput = $generateHtmlFromNodes(editorState)
      setHtmlString(htmlOutput)
      onChange(htmlOutput)
    })
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="editor-container">
        <ToolbarPlugin />
        <div className="editor-inner p-4">
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor-input" />}
            placeholder={<div className="editor-placeholder text-gray-400">开始输入内容...</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <ListPlugin />
          <LinkPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <OnChangePlugin onChange={handleEditorChange} />
        </div>
      </div>
    </LexicalComposer>
  )
}
