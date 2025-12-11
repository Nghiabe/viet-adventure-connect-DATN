import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X, Send, Bot, User, Sparkles, ExternalLink, CalendarDays } from "lucide-react";
import { AIWizardModal } from "@/components/ai-planner/AIWizardModal";
import { TripCard, TripData } from "@/components/ai-assistant/TripCard";
import { TripBookingDialog } from "@/components/ai-assistant/TripBookingDialog";

interface AgentCardTour { type: 'tour'; data: { id: string; title: string; price?: number; rating?: number; destinationName?: string; slug?: string; image?: string } }
interface AgentCardStory { type: 'story'; data: { id: string; title: string; summary?: string; slug?: string; image?: string } }
type AgentCard = AgentCardTour | AgentCardStory;

interface ChatAction {
  type: string;
  label: string;
  description?: string;
}

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  cards?: AgentCard[];
  action?: ChatAction; // NEW: For planner redirect button
}

const suggestionChips = [
  "Gợi ý địa điểm du lịch ở Hà Nội",
  "Món ăn đặc sản miền Trung",
  "Lịch trình 3 ngày ở Đà Lạt"
];

// --- Rich Content Utilities ---
const parseBold = (text: string) => {
  // Bold: **text**
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // User requested "khung" (frame) and "màu" (color) to make it stand out
      return (
        <span key={i} className="font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md border border-primary/20 mx-0.5 text-[13px]">
          {part.slice(2, -2)}
        </span>
      );
    }
    return part;
  });
};

const TableRenderer = ({ markdown }: { markdown: string }) => {
  const lines = markdown.trim().split('\n');
  if (lines.length < 2) return null; // Need at least header and separator

  const headerLine = lines[0];
  const separatorLine = lines[1];

  // Basic check for table format
  if (!headerLine.startsWith('|') || !separatorLine.startsWith('|') || !separatorLine.includes('-')) {
    return null;
  }

  const headers = headerLine.split('|').map(h => h.trim()).filter(h => h);
  const alignment = separatorLine.split('|').map(s => s.trim()).filter(s => s).map(s => {
    if (s.startsWith(':') && s.endsWith(':')) return 'center';
    if (s.endsWith(':')) return 'right';
    return 'left';
  });

  const bodyRows = lines.slice(2);

  return (
    <div className="overflow-x-auto my-4">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted/50">
            {headers.map((header, i) => (
              <th key={i} className={`border border-border p-2 text-${alignment[i] || 'left'} font-semibold text-primary/80`}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, rowIndex) => {
            const cells = row.split('|').map(c => c.trim()).filter(c => c);
            if (cells.length === 0) return null;
            return (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                {cells.map((cell, cellIndex) => (
                  <td key={cellIndex} className={`border border-border p-2 text-${alignment[cellIndex] || 'left'} text-muted-foreground`}>
                    {cell}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const SimpleMarkdown = ({ text, onImageClick }: { text: string, onImageClick: (src: string, alt: string) => void }) => {
  // Regex to match ![alt](url) OR [Hình ảnh...](url) (AI fallback)
  const imageRegex = /(!\[.*?\]\(.*?\)|\[(?:Hình ảnh|Image).*?\]\(.*?\))/g;
  // Regex for markdown tables: starts with a line containing at least one '|' and a header separator line.
  // This regex tries to capture a block that looks like a table.
  const tableRegex = /(\|.*\|(?:\r?\n\|\s*[-=]+\s*\|(?:[-=]+\s*\|)*)?(?:\r?\n\|.*\|)*)/g;

  // Split the entire text by table blocks first
  const parts = text.split(tableRegex);

  return (
    <div className="text-sm leading-relaxed space-y-2">
      {parts.map((part, i) => {
        if (!part || part.trim() === '') return null;

        // Check if this part is a table (it will be a non-empty string that matches the table pattern)
        // The `split` method with a capturing group includes the matched delimiter in the result array.
        // So, if `part` itself matches the table regex, it's a table.
        if (part.match(/^\|.*\|(?:\r?\n\|\s*[-=]+\s*\|(?:[-=]+\s*\|)*)?(?:\r?\n\|.*\|)*$/)) {
          return <TableRenderer key={i} markdown={part} />;
        }

        // If not a table, process as regular markdown (headers, lists, images, plain text)
        return part.split('\n').map((line, j) => {
          const trimmed = line.trim();
          if (!trimmed) return null;

          // Check for Horizontal Rule (--- or ***)
          if (trimmed.match(/^[-*_]{3,}$/)) {
            return <hr key={`${i}-${j}`} className="my-4 border-t border-border/50" />;
          }

          // Check for Blockquote (> text)
          if (trimmed.startsWith('> ')) {
            return (
              <div key={`${i}-${j}`} className="border-l-4 border-primary/40 pl-3 py-1 my-2 bg-primary/5 rounded-r-lg text-muted-foreground italic text-sm">
                {parseBold(trimmed.slice(2))}
              </div>
            );
          }

          // Check for Headers
          if (trimmed.startsWith('#')) {
            return <div key={`${i}-${j}`} className="font-semibold text-primary/80 pt-1 border-l-4 border-primary/20 pl-2 my-2">{parseBold(trimmed.replace(/^#+\s*/, ''))}</div>;
          }

          // Check for Lists
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            // Calculate indentation based on leading spaces
            const leadingSpaces = line.search(/\S|$/);
            const indentClass = leadingSpaces >= 2 ? 'ml-6' : 'ml-1';

            return (
              <div key={`${i}-${j}`} className={`flex gap-2 ${indentClass} transition-all`}>
                <span className="text-primary font-bold mt-1.5 w-1.5 h-1.5 rounded-full bg-current flex-shrink-0 opacity-70" />
                <span className="text-muted-foreground">{parseBold(trimmed.replace(/^[-*]\s/, ''))}</span>
              </div>
            );
          }

          const lineParts = line.split(imageRegex);

          if (lineParts.length === 1) {
            return <div key={`${i}-${j}`} className="text-muted-foreground">{parseBold(line)}</div>;
          }

          return (
            <div key={`${i}-${j}`} className="text-muted-foreground">
              {lineParts.map((linePart, idx) => {
                // Match ![]() or []()
                const imgMatch = linePart.match(/^(!?)\[(.*?)\]\((.*?)\)$/);
                if (imgMatch) {
                  const altText = imgMatch[2];
                  const srcUrl = imgMatch[3];
                  return (
                    <div key={idx} className="group relative rounded-xl overflow-hidden my-3 border bg-muted/50 block shadow-sm hover:shadow-md transition-all cursor-zoom-in" onClick={() => onImageClick(srcUrl, altText)}>
                      <img
                        src={srcUrl}
                        alt={altText}
                        className="w-full h-48 object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
                        Click to view
                      </div>
                    </div>
                  );
                }
                if (!linePart.trim()) return null;
                return <span key={idx}>{parseBold(linePart)}</span>;
              })}
            </div>
          );
        });
      })}
    </div>
  );
};
const RichContentRenderer = ({ content, onImageClick, onTripBookClick }: { content: string, onImageClick: (src: string, alt: string) => void, onTripBookClick?: (trip: TripData) => void }) => {
  // 1. Extract Trip Cards JSON block
  const tripCardsRegex = /\[TRIP_CARDS_START\]([\s\S]*?)\[TRIP_CARDS_END\]/;
  const tripCardsMatch = content.match(tripCardsRegex);
  let tripCards: TripData[] = [];
  let contentWithoutTrips = content;

  if (tripCardsMatch) {
    try {
      // Remove possible markdown code blocks ```json ... ```
      const cleanJson = tripCardsMatch[1].replace(/```json|```/g, '').trim();
      tripCards = JSON.parse(cleanJson);
      contentWithoutTrips = content.replace(tripCardsRegex, '').trim();
    } catch (e) {
      console.error("Failed to parse trip cards", e);
    }
  }

  // 2. Extract Sources JSON block
  const sourceRegex = /\[SOURCES_START\]([\s\S]*?)\[SOURCES_END\]/;
  const sourceMatch = contentWithoutTrips.match(sourceRegex);
  let sources: any[] = [];
  let mainContent = contentWithoutTrips;

  if (sourceMatch) {
    try {
      const cleanJson = sourceMatch[1].replace(/```json|```/g, '').trim();
      sources = JSON.parse(cleanJson);
      mainContent = contentWithoutTrips.replace(sourceRegex, '').trim();
    } catch (e) {
      console.error("Failed to parse sources", e);
    }
  }

  // 2. Split content into Sections by header #, ##, or ###
  // Lookahead for any header level 1-3
  const rawSections = mainContent.split(/(?=(?:^|\n)#{1,3}\s)/g);
  // Filter out empty sections
  const sections = rawSections.filter(s => s.trim().length > 0);

  // If match failed or no sections, render plain
  if (sections.length === 0 && mainContent.trim()) {
    return <SimpleMarkdown text={mainContent} onImageClick={onImageClick} />;
  }

  return (
    <div className="space-y-4 w-full">
      {sections.map((sec, idx) => {
        const trimmed = sec.trim();

        // Handle Level 1 & 2 Headers (# / ##) -> SECTION DIVIDER
        if (trimmed.match(/^#{1,2}\s/)) {
          const lines = trimmed.split('\n');
          const title = lines[0].replace(/^#{1,2}\s*/, '').trim(); // Remove # or ##
          const body = lines.slice(1).join('\n').trim();

          return (
            <div key={idx} className="animate-in fade-in slide-in-from-bottom-3 duration-700">
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent text-primary font-bold py-2.5 px-4 rounded-lg mt-6 mb-3 border-l-4 border-primary shadow-sm flex items-center gap-2 uppercase tracking-wide">
                {title}
              </div>
              {body && <div className="px-1"><SimpleMarkdown text={body} onImageClick={onImageClick} /></div>}
            </div>
          );
        }

        // Handle Level 3 Headers (###) -> CARD
        if (trimmed.startsWith('###')) {
          const lines = trimmed.split('\n');
          const title = lines[0].replace(/###\s*/, '').trim();
          const body = lines.slice(1).join('\n').trim();

          return (
            <Card key={idx} className="bg-card/40 border-primary/10 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500 hover:border-primary/30 transition-colors">
              <div className="bg-primary/5 px-3 py-2 border-b border-primary/5">
                <h4 className="font-semibold text-sm text-primary flex items-center gap-2">
                  {title}
                </h4>
              </div>
              <CardContent className="p-3">
                <SimpleMarkdown text={body} onImageClick={onImageClick} />
              </CardContent>
            </Card>
          );
        }

        return (
          <div key={idx} className="px-1">
            <SimpleMarkdown text={trimmed} onImageClick={onImageClick} />
          </div>
        );
      })}

      {tripCards.length > 0 && (
        <div className="mt-4">
          <div className="flex flex-col gap-3">
            {tripCards.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onBookClick={(t) => onTripBookClick?.(t)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sources Footer */}
      {sources.length > 0 && (
        <div className="mt-6 pt-4 border-t border-dashed border-border/60">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Nguồn tham khảo</p>
          <div className="flex flex-wrap gap-2">
            {sources.map((src: any, i: number) => (
              <a key={i} href={src.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-muted hover:bg-muted/80 text-xs px-2 py-1 rounded-md text-muted-foreground transition-colors max-w-[200px] truncate" title={src.title}>
                <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary flex-shrink-0">{i + 1}</div>
                <span className="truncate">{src.title}</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-50" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Main Component ---

import { Maximize2, Minimize2, MoveDiagonal } from "lucide-react";

const AIFloatingWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showWizard, setShowWizard] = useState(false); // For planner redirect
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null);
  const [bookingTrip, setBookingTrip] = useState<TripData | null>(null); // For trip booking dialog

  // Resizable state
  const [size, setSize] = useState({ width: 600, height: 700 });
  const isResizingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const initialSizeRef = useRef({ width: 0, height: 0 });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle Resize Mouse Events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;

      const dx = lastMousePosRef.current.x - e.clientX; // Dragging left increases width
      const dy = lastMousePosRef.current.y - e.clientY; // Dragging up increases height

      setSize(prev => ({
        width: Math.min(Math.max(400, initialSizeRef.current.width + dx), 1200),
        height: Math.min(Math.max(400, initialSizeRef.current.height + dy), 1200)
      }));
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    if (isOpen) {
      // Cleanup just in case
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isOpen]);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    initialSizeRef.current = { width: size.width, height: size.height };

    document.body.style.cursor = 'nwse-resize';
    document.body.style.userSelect = 'none';

    window.addEventListener('mousemove', (e) => {
      if (!isResizingRef.current) return;
      const dx = lastMousePosRef.current.x - e.clientX;
      const dy = lastMousePosRef.current.y - e.clientY;
      setSize({
        width: Math.min(Math.max(400, initialSizeRef.current.width + dx), 1200),
        height: Math.min(Math.max(400, initialSizeRef.current.height + dy), 1200)
      });
    });
    window.addEventListener('mouseup', () => {
      isResizingRef.current = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    });
  };

  // Stream AI response in real-time from backend
  const streamAIResponse = async (content: string) => {
    try {
      const url = `/api/chat/stream`;
      const history = messages.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'ai',
        content: msg.content
      }));

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          user_id: 'web-user',
          context: { history: history }
        }),
      });
      if (!resp.body) throw new Error('No response body');
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let fullResponse = '';

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunk = decoder.decode(value || new Uint8Array(), { stream: !done });
        if (chunk) {
          fullResponse += chunk;
          setMessages(prev => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.type === 'ai') {
              last.content += chunk;
            }
            return next;
          });
        }
      }

      // After stream complete, check if response contains action marker
      // The planner_redirect node adds additional_kwargs with action
      // We need to detect if the message content indicates planner intent
      // For now, detect by key phrases in the response
      if (fullResponse.includes('nhấn nút bên dưới') || fullResponse.includes('Lập Kế Hoạch')) {
        setMessages(prev => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last && last.type === 'ai') {
            last.action = {
              type: 'open_planner',
              label: '🗓️ Lập kế hoạch chuyến đi',
              description: 'Mở công cụ lập lịch trình AI'
            };
          }
          return next;
        });
      }
    } catch (e) {
      setMessages(prev => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.type === 'ai') {
          last.content = last.content || 'Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.';
        }
        return next;
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    const aiMsgId = (Date.now() + 1).toString();
    const placeholder: Message = {
      id: aiMsgId,
      type: 'ai',
      content: '', // Start empty, will fill via stream
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, placeholder]);

    streamAIResponse(userMessage.content);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  const openChat = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        type: 'ai',
        content: "Xin chào! Tôi là trợ lý AI của VietTravel. Tôi có thể giúp bạn lên kế hoạch du lịch, tìm địa điểm thú vị và trả lời mọi câu hỏi về du lịch Việt Nam. Bạn cần hỗ trợ gì ạ?",
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  };

  // Render wizard modal independently - even when chat is closed
  const wizardModal = (
    <AIWizardModal isOpen={showWizard} onClose={() => setShowWizard(false)} />
  );

  if (!isOpen) {
    return (
      <>
        <button
          onClick={openChat}
          className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-50 hover:scale-105"
          aria-label="Mở trợ lý AI"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
        {wizardModal}
      </>
    );
  }


  return (
    <div
      className="fixed bottom-6 right-6 bg-card border rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-75 ease-out origin-bottom-right"
      style={{ width: `${size.width}px`, height: `${size.height}px`, maxHeight: '90vh', maxWidth: '95vw' }}
    >
      {/* Resize Handle (Top-Left) */}
      <div
        className="absolute top-0 left-0 w-6 h-6 z-50 cursor-nwse-resize flex items-center justify-center text-primary/30 hover:text-primary transition-colors hover:bg-white/20 rounded-br-lg"
        onMouseDown={startResize}
      >
        <MoveDiagonal className="w-4 h-4" />
      </div>

      {/* Header */}
      <div className="bg-primary text-primary-foreground p-3 flex items-center justify-between shadow-sm flex-shrink-0 pl-8">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm">Trợ lý Du lịch</h3>
            <div className="flex items-center gap-1 opacity-80">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <p className="text-[10px] font-medium tracking-wide uppercase">Online</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsOpen(false)}
            className="text-primary-foreground/80 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4 bg-muted/30">
        <div className="space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-2 max-w-[95%] min-w-0 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border ${message.type === 'user'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-white text-primary border-border'
                  }`}>
                  {message.type === 'user' ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-4 h-4" />
                  )}
                </div>

                <div className={`rounded-2xl p-4 min-w-0 shadow-sm transition-all ${message.type === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-sm'
                  : 'bg-white text-foreground border border-border/50 rounded-tl-sm w-full'
                  }`}>
                  {message.type === 'ai' ? (
                    <RichContentRenderer
                      content={message.content}
                      onImageClick={(src, alt) => setLightboxImage({ src, alt })}
                      onTripBookClick={(trip) => setBookingTrip(trip)}
                    />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                  )}

                  {message.cards && message.cards.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      {message.cards.map((card, idx) => (
                        // Existing Card Rendering Logic
                        <div key={idx} className="rounded-md border bg-card p-2 shadow-sm">
                          {card.type === 'tour' ? (
                            <div className="flex items-center gap-2">
                              {card.data.image && <img src={card.data.image} alt={card.data.title} className="w-12 h-12 object-cover rounded" />}
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate">{card.data.title}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {card.data.destinationName || ''}
                                  {card.data.price ? ` • ${card.data.price.toLocaleString()}₫` : ''}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {card.data.image && <img src={card.data.image} alt={card.data.title} className="w-12 h-12 object-cover rounded" />}
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate">{card.data.title}</div>
                                {card.data.summary && <div className="text-xs text-muted-foreground line-clamp-1">{card.data.summary}</div>}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ACTION BUTTON - For Planner Redirect */}
                  {message.action?.type === 'open_planner' && (
                    <div className="mt-4 pt-3 border-t border-border/50">
                      <Button
                        onClick={() => {
                          setShowWizard(true);
                          setIsOpen(false); // Close chat widget
                        }}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium shadow-md hover:shadow-lg transition-all"
                      >
                        <CalendarDays className="w-4 h-4 mr-2" />
                        {message.action.label}
                      </Button>
                      {message.action.description && (
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          {message.action.description}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}


          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start gap-2 max-w-[80%]">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-white text-primary border border-border shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white text-muted-foreground rounded-2xl rounded-tl-sm p-4 border border-border/50 shadow-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Suggestion Chips */}
          {messages.length <= 1 && !isTyping && (
            <div className="space-y-3 px-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider text-center">Gợi ý câu hỏi</p>
              <div className="grid grid-cols-1 gap-2">
                {suggestionChips.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left p-3 text-sm bg-white hover:bg-primary/5 hover:text-primary border border-transparent hover:border-primary/20 rounded-xl transition-all duration-200 shadow-sm font-medium flex items-center gap-2"
                  >
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <Sparkles className="w-3 h-3" />
                    </span>
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} className="h-4" />
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-white flex-shrink-0">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Nhập câu hỏi..."
            className="flex-1 bg-muted/30 focus-visible:ring-1"
            disabled={isTyping}
          />
          <Button
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim() || isTyping}
            size="icon"
            className="shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* AI Wizard Modal - Opens when user clicks planner action button */}
      <AIWizardModal isOpen={showWizard} onClose={() => setShowWizard(false)} />

      {/* Trip Booking Dialog - Opens when user clicks book button on trip card */}
      <TripBookingDialog
        open={bookingTrip !== null}
        onOpenChange={(open) => !open && setBookingTrip(null)}
        trip={bookingTrip}
      />
    </div>
  );
};

export default AIFloatingWidget;
