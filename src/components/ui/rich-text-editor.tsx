import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Quote, Heading1, Heading2 } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Viết nội dung bài viết của bạn...',
  className,
  disabled = false
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateValue();
  };

  const updateValue = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    updateValue();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      execCommand('insertLineBreak');
    }
  };

  const toolbarButtons = [
    { id: 'bold', icon: Bold, command: 'bold', label: 'In đậm' },
    { id: 'italic', icon: Italic, command: 'italic', label: 'In nghiêng' },
    { id: 'underline', icon: Underline, command: 'underline', label: 'Gạch chân' },
    { id: 'heading-1', icon: Heading1, command: 'formatBlock', value: '<h1>', label: 'Tiêu đề 1' },
    { id: 'heading-2', icon: Heading2, command: 'formatBlock', value: '<h2>', label: 'Tiêu đề 2' },
    { id: 'unordered-list', icon: List, command: 'insertUnorderedList', label: 'Danh sách không thứ tự' },
    { id: 'ordered-list', icon: ListOrdered, command: 'insertOrderedList', label: 'Danh sách có thứ tự' },
    { id: 'blockquote', icon: Quote, command: 'formatBlock', value: '<blockquote>', label: 'Trích dẫn' },
  ];

  return (
    <div className={cn('border rounded-lg', className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/50">
        {toolbarButtons.map((button) => (
          <Button
            key={button.id}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => execCommand(button.command, button.value)}
            disabled={disabled}
            className="h-8 w-8 p-0"
            title={button.label}
          >
            <button.icon className="h-4 w-4" />
          </Button>
        ))}
      </div>

              {/* Editor */}
        <div
          ref={editorRef}
          contentEditable={!disabled}
          onInput={updateValue}
          onBlur={() => setIsFocused(false)}
          onFocus={() => setIsFocused(true)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          className={cn(
            'min-h-[200px] p-4 outline-none text-sm leading-relaxed',
            'focus:ring-2 focus:ring-ring focus:ring-offset-0',
            isFocused && 'ring-2 ring-ring ring-offset-0',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          style={{
            minHeight: '200px',
            wordWrap: 'break-word'
          }}
          data-placeholder={placeholder}
        />
        

      
      {/* Placeholder */}
      {!value && (
        <div className="absolute pointer-events-none text-muted-foreground p-4 mt-[-80px]">
          {placeholder}
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
