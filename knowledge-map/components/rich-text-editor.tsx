"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Highlight from "@tiptap/extension-highlight"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import { Bold, Italic, List, ListOrdered, Heading1, Heading2, Code, CheckSquare, Quote, Undo, Redo } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toggle } from "@/components/ui/toggle"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  darkMode?: boolean
  minimalist?: boolean
}

export default function RichTextEditor({
  content,
  onChange,
  darkMode = false,
  minimalist = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: "开始输入内容...",
      }),
      Highlight,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    autofocus: "end",
  })

  if (!editor) {
    return null
  }

  const toolbarBgClass = darkMode
    ? minimalist
      ? "bg-gray-800/50"
      : "bg-gray-700"
    : minimalist
      ? "bg-white/50"
      : "bg-muted/50"

  const toolbarBorderClass = darkMode
    ? minimalist
      ? "border-gray-700/30"
      : "border-gray-600"
    : minimalist
      ? "border-gray-200/30"
      : "border-gray-200"

  const editorBgClass = darkMode ? "bg-gray-800 text-gray-100" : "bg-white text-gray-900"

  const toggleClass = minimalist
    ? "opacity-50 hover:opacity-100 data-[state=on]:opacity-100 data-[state=on]:bg-transparent"
    : ""

  return (
    <div
      className={cn(
        "border-0 overflow-hidden",
        minimalist ? "border-0" : "border rounded-md",
        darkMode ? "border-gray-700" : "border-gray-200",
      )}
    >
      <div
        className={cn(
          "flex flex-wrap gap-1 p-1",
          minimalist ? "border-0 px-4 pt-3 pb-1" : "border-b",
          toolbarBgClass,
          toolbarBorderClass,
        )}
      >
        <Toggle
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="Bold"
          className={cn(darkMode ? "data-[state=on]:bg-gray-600" : "", toggleClass, "h-8 w-8")}
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Italic"
          className={cn(darkMode ? "data-[state=on]:bg-gray-600" : "", toggleClass, "h-8 w-8")}
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 1 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          aria-label="Heading 1"
          className={cn(darkMode ? "data-[state=on]:bg-gray-600" : "", toggleClass, "h-8 w-8")}
        >
          <Heading1 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 2 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          aria-label="Heading 2"
          className={cn(darkMode ? "data-[state=on]:bg-gray-600" : "", toggleClass, "h-8 w-8")}
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("bulletList")}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Bullet List"
          className={cn(darkMode ? "data-[state=on]:bg-gray-600" : "", toggleClass, "h-8 w-8")}
        >
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("orderedList")}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="Ordered List"
          className={cn(darkMode ? "data-[state=on]:bg-gray-600" : "", toggleClass, "h-8 w-8")}
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("taskList")}
          onPressedChange={() => editor.chain().focus().toggleTaskList().run()}
          aria-label="Task List"
          className={cn(darkMode ? "data-[state=on]:bg-gray-600" : "", toggleClass, "h-8 w-8")}
        >
          <CheckSquare className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("codeBlock")}
          onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
          aria-label="Code Block"
          className={cn(darkMode ? "data-[state=on]:bg-gray-600" : "", toggleClass, "h-8 w-8")}
        >
          <Code className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("blockquote")}
          onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
          aria-label="Quote"
          className={cn(darkMode ? "data-[state=on]:bg-gray-600" : "", toggleClass, "h-8 w-8")}
        >
          <Quote className="h-4 w-4" />
        </Toggle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={cn("h-8 w-8", minimalist ? "opacity-50 hover:opacity-100 hover:bg-transparent" : "")}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={cn("h-8 w-8", minimalist ? "opacity-50 hover:opacity-100 hover:bg-transparent" : "")}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent
        editor={editor}
        className={cn(
          "prose prose-lg max-w-none focus:outline-none min-h-[250px] max-h-[500px] overflow-y-auto",
          minimalist ? "p-4 pt-3" : "p-4",
          editorBgClass,
          darkMode ? "prose-invert" : "",
        )}
      />
    </div>
  )
}
