import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"

export function RichTextEditor({
  value,
  onChange,
  disabled,
  placeholder,
}: {
  value: string
  onChange: (html: string) => void
  disabled?: boolean
  placeholder?: string
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder || "Nhập nội dung...",
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
  })

  if (!editor) return null

  return (
    <div className="border rounded-md p-2 min-h-[150px]">
      <EditorContent editor={editor} />
    </div>
  )
}
