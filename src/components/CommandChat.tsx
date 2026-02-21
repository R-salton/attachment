"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  X, 
  Send, 
  Loader2, 
  Bot, 
  User,
  ShieldCheck,
  Minimize2,
  Maximize2,
  Sparkles
} from 'lucide-react';
import { chatWithGemini } from '@/ai/flows/chat-with-gemini-flow';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export function CommandChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ 
        role: m.role as 'user' | 'model' | 'system', 
        content: m.content 
      }));
      
      const response = await chatWithGemini({
        history,
        message: userMessage
      });

      setMessages(prev => [...prev, { role: 'model', content: response.text }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', content: "System communication failure. Please re-authenticate and try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-2xl shadow-2xl bg-primary hover:bg-primary/90 z-50 p-0"
      >
        <Sparkles className="h-6 w-6 text-white" />
      </Button>
    );
  }

  return (
    <div 
      className={cn(
        "fixed bottom-6 right-6 z-50 transition-all duration-300 ease-in-out",
        isMinimized ? "h-16 w-64" : "h-[500px] w-[350px] md:w-[400px]"
      )}
    >
      <Card className="h-full flex flex-col border-none shadow-3xl bg-white overflow-hidden rounded-2xl">
        <CardHeader className="bg-slate-900 text-white p-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-black uppercase tracking-tighter">Command Assistant</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" onClick={() => setIsMinimized(!isMinimized)}>
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white/60 hover:text-white" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            <CardContent className="flex-1 p-0 bg-slate-50 relative overflow-hidden">
              <ScrollArea className="h-full p-4">
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center py-10 px-6 space-y-4">
                      <div className="bg-white h-12 w-12 rounded-xl flex items-center justify-center mx-auto shadow-sm border border-slate-100">
                        <Bot className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                        I am your Gemini-powered Command Assistant. How can I assist with your situational reports today?
                      </p>
                    </div>
                  )}
                  {messages.map((m, idx) => (
                    <div key={idx} className={cn("flex gap-3", m.role === 'user' ? "flex-row-reverse" : "")}>
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                        m.role === 'user' ? "bg-slate-900" : "bg-primary"
                      )}>
                        {m.role === 'user' ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
                      </div>
                      <div className={cn(
                        "p-3 rounded-2xl text-[13px] leading-relaxed font-medium shadow-sm max-w-[80%]",
                        m.role === 'user' ? "bg-slate-900 text-white rounded-tr-none" : "bg-white text-slate-800 border border-slate-100 rounded-tl-none"
                      )}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                        <Loader2 className="h-4 w-4 text-white animate-spin" />
                      </div>
                      <div className="p-3 bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm">
                        <div className="flex gap-1">
                          <div className="h-1.5 w-1.5 bg-slate-300 rounded-full animate-bounce" />
                          <div className="h-1.5 w-1.5 bg-slate-300 rounded-full animate-bounce delay-100" />
                          <div className="h-1.5 w-1.5 bg-slate-300 rounded-full animate-bounce delay-200" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={scrollRef} />
                </div>
              </ScrollArea>
            </CardContent>
            <CardFooter className="p-4 bg-white border-t border-slate-100">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex w-full items-center gap-2"
              >
                <Input 
                  placeholder="Ask for operational assistance..." 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="h-11 rounded-xl bg-slate-50 border-slate-200 text-sm font-bold focus-visible:ring-primary"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  className="h-11 w-11 rounded-xl shrink-0 bg-slate-900 hover:bg-slate-800"
                  disabled={isLoading || !input.trim()}
                >
                  <Send className="h-4 w-4 text-white" />
                </Button>
              </form>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
