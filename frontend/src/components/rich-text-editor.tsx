import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExtension from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading2,
  Quote,
  Undo,
  Redo,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function RichTextEditor({
  value,
  onChange,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      UnderlineExtension,
      Placeholder.configure({
        placeholder: placeholder || "Nhập nội dung...",
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  // Update editor content when value prop changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) return null;

  return (
    <div className="border rounded-md overflow-hidden mt-2">
      {/* Toolbar */}
      {!disabled && (
        <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/30">
          <Button
            type="button"
            variant={editor.isActive("bold") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`h-8 w-8 p-0 transition-all ${
              editor.isActive("bold")
                ? "bg-primary text-primary-foreground font-bold shadow-sm"
                : "hover:bg-muted"
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant={editor.isActive("italic") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`h-8 w-8 p-0 transition-all ${
              editor.isActive("italic")
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-muted"
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant={editor.isActive("underline") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`h-8 w-8 p-0 transition-all ${
              editor.isActive("underline")
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-muted"
            }`}
            title="Underline (Ctrl+U)"
          >
            <Underline className="h-4 w-4" />
          </Button>

          <div className="w-px h-8 bg-border mx-1" />

          <Button
            type="button"
            variant={
              editor.isActive("heading", { level: 2 }) ? "default" : "ghost"
            }
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={`h-8 px-3 transition-all ${
              editor.isActive("heading", { level: 2 })
                ? "bg-primary text-primary-foreground font-bold shadow-sm"
                : "hover:bg-muted"
            }`}
            title="Heading"
          >
            <Heading2 className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant={editor.isActive("bulletList") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`h-8 w-8 p-0 transition-all ${
              editor.isActive("bulletList")
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-muted"
            }`}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant={editor.isActive("orderedList") ? "default" : "ghost"}
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`h-8 w-8 p-0 transition-all ${
              editor.isActive("orderedList")
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-muted"
            }`}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant={editor.isActive("blockquote") ? "default" : "ghost"}
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              editor.chain().focus().toggleBlockquote().run();
            }}
            className={`h-8 w-8 p-0 transition-all ${
              editor.isActive("blockquote")
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-muted"
            }`}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </Button>

          <div className="w-px h-8 bg-border mx-1" />
        </div>
      )}

      {/* Editor Content */}
      <div className="px-3 min-h-[150px] max-h-[400px] overflow-y-auto prose prose-sm max-w-none">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
