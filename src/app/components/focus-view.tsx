
'use client';

import { X, Play, Pause, RefreshCw, Coffee, Bot, Send, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Task } from '@/lib/types';
import { AnimatePresence, motion } from 'framer-motion';
import { PomodoroTimer, type PomodoroTimerHandles } from './pomodoro-timer';
import { useI18n } from './i18n-provider';
import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { getFocusAssistantResponse } from '@/ai/flows/features-flow';
import { ScrollArea } from '@/components/ui/scroll-area';

type FocusViewProps = {
  task: Task;
  onExit: () => void;
  onPomodoroComplete: (taskId: string) => void;
  onLogTime: (taskId: string, seconds: number) => void;
};

type Message = {
    role: 'user' | 'model';
    content: string;
};

export function FocusView({ task, onExit, onPomodoroComplete, onLogTime }: FocusViewProps) {
  const { t } = useI18n();
  const timerRef = useRef<PomodoroTimerHandles>(null);
  const [timerState, setTimerState] = useState<{mode: 'work' | 'break', isActive: boolean}>({mode: 'work', isActive: false});
  const [isIdle, setIsIdle] = useState(false);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<number | null>(null);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const chatScrollAreaRef = useRef<HTMLDivElement>(null);

  const logTimeSpent = useCallback(() => {
    if (sessionStartTimeRef.current && timerState.mode === 'work') {
      const elapsedSeconds = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
      if (elapsedSeconds > 0) {
        onLogTime(task.id, elapsedSeconds);
      }
    }
    sessionStartTimeRef.current = null;
  }, [onLogTime, task.id, timerState.mode]);
  
  const handleExit = () => {
    logTimeSpent();
    onExit();
  };

  const resetIdleTimeout = useCallback(() => {
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    setIsIdle(false);
    if (timerState.isActive) {
      idleTimeoutRef.current = setTimeout(() => {
        setIsIdle(true);
      }, 5000); 
    }
  }, [timerState.isActive]);
  
  const handleTimerUpdate = useCallback((mode: 'work' | 'break', isActive: boolean) => {
    setTimerState({mode, isActive});
    if (isActive) {
      resetIdleTimeout();
       // Start tracking time if it's a work session and timer just started
      if (mode === 'work' && !sessionStartTimeRef.current) {
        sessionStartTimeRef.current = Date.now();
      }
    } else {
       // Stop tracking time and log if it's a work session and timer is paused
      logTimeSpent();
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      setIsIdle(false);
    }
  }, [resetIdleTimeout, logTimeSpent]);

  useEffect(() => {
    // Guard for SSR
    if (typeof window === 'undefined') return;

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll'];
    activityEvents.forEach(event => window.addEventListener(event, resetIdleTimeout));

    const handleBeforeUnload = () => {
        logTimeSpent();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      activityEvents.forEach(event => window.removeEventListener(event, resetIdleTimeout));
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      logTimeSpent();
    };
  }, [resetIdleTimeout, logTimeSpent]);

  const handlePomodoroCycleComplete = () => {
    logTimeSpent();
    onPomodoroComplete(task.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: userInput }];
    setMessages(newMessages);
    const currentUserInput = userInput;
    setUserInput('');
    setIsAssistantLoading(true);

    try {
        const assistantResponse = await getFocusAssistantResponse({
            taskTitle: task.title,
            taskDescription: task.description || '',
            history: messages,
            currentUserInput: currentUserInput
        });
        setMessages([...newMessages, { role: 'model', content: assistantResponse }]);
    } catch (error) {
        console.error("Focus assistant failed:", error);
        setMessages([...newMessages, { role: 'model', content: t('focusView.assistantError') }]);
    } finally {
        setIsAssistantLoading(false);
    }
  };

  useEffect(() => {
    // Scroll to bottom of chat when new messages are added
    if (chatScrollAreaRef.current) {
        chatScrollAreaRef.current.scrollTo({ top: chatScrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);


  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: 1,
          backgroundColor: timerState.mode === 'break' ? 'hsl(var(--chart-2) / 0.2)' : 'hsl(var(--background) / 0.95)'
        }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-50 backdrop-blur-lg flex flex-col p-4 sm:p-8"
      >
        <motion.header 
          animate={{ opacity: isIdle ? 0.33 : 1, filter: isIdle ? 'blur(4px)' : 'blur(0px)' }}
          transition={{ duration: 0.5 }}
          className="w-full flex justify-end relative z-10"
        >
             <Button onClick={handleExit} variant="ghost" size="icon" className="text-muted-foreground" aria-label={t('focusView.endSession')}>
              <X className="h-6 w-6" />
            </Button>
        </motion.header>

        <main 
            className="flex-1 flex flex-col items-center justify-center text-center -mt-16"
        >
            <motion.p 
                animate={{ opacity: isIdle ? 0 : 1, y: isIdle ? -20 : 0 }}
                transition={{ duration: 0.5 }}
                className="text-lg text-muted-foreground mb-4">{t('focusView.focusingOn')}
            </motion.p>
            <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-4xl md:text-6xl font-bold mb-6">{task.title}
            </motion.h1>
            {task.description && (
                <motion.p 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="text-xl text-muted-foreground max-w-2xl mx-auto">{task.description}
                </motion.p>
            )}
        </main>
        
        {/* Chat Assistant */}
        <motion.div
          animate={{ opacity: isIdle ? 0 : 1, y: isIdle ? 20 : 0 }}
          transition={{ duration: 0.5 }}
          className="absolute bottom-28 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4"
        >
            <div className="bg-background/50 border rounded-lg p-3 shadow-lg">
                <ScrollArea className="h-48 mb-2">
                    <div ref={chatScrollAreaRef} className="space-y-4 text-left px-2">
                        {messages.map((msg, index) => (
                            <div key={index} className={cn("flex items-start gap-3", msg.role === 'user' ? "justify-end" : "")}>
                                {msg.role === 'model' && <Bot className="w-5 h-5 text-primary shrink-0 mt-1" />}
                                <p className={cn("text-sm rounded-lg px-3 py-2 max-w-md", msg.role === 'model' ? "bg-muted" : "bg-primary text-primary-foreground")}>
                                    {msg.content}
                                </p>
                            </div>
                        ))}
                         {isAssistantLoading && (
                            <div className="flex items-start gap-3">
                                <Bot className="w-5 h-5 text-primary shrink-0 mt-1" />
                                <p className="text-sm rounded-lg px-3 py-2 max-w-md bg-muted flex items-center">
                                    <LoaderCircle className="w-4 h-4 animate-spin" />
                                </p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input 
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder={t('focusView.askAssistant')}
                        disabled={isAssistantLoading}
                    />
                    <Button type="submit" size="icon" disabled={isAssistantLoading || !userInput.trim()}>
                        <Send className="w-4 h-4" />
                    </Button>
                </form>
            </div>
        </motion.div>

        <motion.footer 
            animate={{ opacity: isIdle ? 0.33 : 1, filter: isIdle ? 'blur(4px)' : 'blur(0px)' }}
            transition={{ duration: 0.5 }}
            className="w-full flex items-end justify-between"
        >
          <PomodoroTimer 
            ref={timerRef}
            onPomodoroComplete={handlePomodoroCycleComplete}
            onTimerUpdate={handleTimerUpdate}
          />
           <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => timerRef.current?.reset()} aria-label={t('pomodoro.resetTimer')}>
                  <RefreshCw className="w-5 h-5" />
              </Button>
              <Button size="icon" className="w-12 h-12 rounded-full" onClick={() => timerRef.current?.toggle()} aria-label={timerState.isActive ? t('pomodoro.pauseTimer') : t('pomodoro.startTimer')}>
                  {timerState.isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => timerRef.current?.next()} aria-label={timerState.mode === 'work' ? t('pomodoro.startBreak') : t('pomodoro.startWork')}>
                  <Coffee className="w-5 h-5" />
              </Button>
          </div>
        </motion.footer>
      </motion.div>
    </AnimatePresence>
  );
}

    