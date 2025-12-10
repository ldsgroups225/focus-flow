'use client';

import { X, Play, Pause, RefreshCw, Coffee, Bot, Send, LoaderCircle, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Task } from '@/lib/types';
import { AnimatePresence, motion } from 'framer-motion';
import { PomodoroTimer, type PomodoroTimerHandles } from './pomodoro-timer';
import { useI18n } from './i18n-provider';
import { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AmbientSoundPlayer } from './ambient-sounds';
import { FocusSessionService } from '@/lib/services/focus-session-service';

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
  const [timerState, setTimerState] = useState<{ mode: 'work' | 'break', isActive: boolean }>({ mode: 'work', isActive: false });
  const [isIdle, setIsIdle] = useState(false);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeAmbientSound, setActiveAmbientSound] = useState<string | null>(null);
  const pomodorosThisSessionRef = useRef(0);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isAssistantLoading, setIsAssistantLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    // Save focus session
    if (sessionStartTimeRef.current || pomodorosThisSessionRef.current > 0) {
      const now = new Date();
      const startTime = sessionStartTimeRef.current ? new Date(sessionStartTimeRef.current) : now;
      const duration = sessionStartTimeRef.current ? Math.round((Date.now() - sessionStartTimeRef.current) / 1000) : 0;

      FocusSessionService.saveSession({
        taskId: task.id,
        taskTitle: task.title,
        startTime,
        endTime: now,
        duration,
        pomodorosCompleted: pomodorosThisSessionRef.current,
        wasInterrupted: timerState.isActive,
        ambientSound: activeAmbientSound || undefined,
      });
    }
    onExit();
  };

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  }, []);

  // Sync fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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
    setTimerState({ mode, isActive });
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
    pomodorosThisSessionRef.current += 1;
    onPomodoroComplete(task.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: userInput }];
    const currentUserInput = userInput;
    setUserInput('');
    setIsAssistantLoading(true);

    // Add user message and empty model message for streaming
    setMessages([...newMessages, { role: 'model', content: '' }]);

    try {
      const response = await fetch('/api/ai/focus-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle: task.title,
          taskDescription: task.description || '',
          history: messages,
          currentUserInput: currentUserInput,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let accumulatedContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;

        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'model', content: accumulatedContent };
          return updated;
        });
      }

      if (!accumulatedContent) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'model', content: t('focusView.assistantError') };
          return updated;
        });
      }
    } catch (error) {
      console.error('Focus assistant failed:', error);
      setMessages(prev => {
        const updated = [...prev];
        if (updated.length > 0 && updated[updated.length - 1].role === 'model') {
          updated[updated.length - 1] = { role: 'model', content: t('focusView.assistantError') };
        } else {
          updated.push({ role: 'model', content: t('focusView.assistantError') });
        }
        return updated;
      });
    } finally {
      setIsAssistantLoading(false);
    }
  };

  // Smooth scroll to bottom when messages change (including during streaming)
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
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
        className="fixed inset-0 z-50 backdrop-blur-lg"
      >
        {/* Header - Close Button */}
        <motion.header
          animate={{ opacity: isIdle ? 0 : 1 }}
          transition={{
            duration: 0.8,
            ease: [0.25, 0.1, 0.25, 1] // Smooth ease-out
          }}
          className="absolute top-4 right-4 sm:top-8 sm:right-8 z-10"
        >
          <Button onClick={handleExit} variant="ghost" size="icon" className="text-muted-foreground" aria-label={t('focusView.endSession')}>
            <X className="h-6 w-6" />
          </Button>
        </motion.header>

        {/* Task Content - Absolute positioned, true center when idle */}
        <motion.div
          animate={{
            top: isIdle ? '50%' : '30%',
            y: '-50%',
          }}
          transition={{
            type: 'spring',
            stiffness: 100,
            damping: 20,
            mass: 1,
          }}
          className="absolute left-0 right-0 flex flex-col items-center text-center px-4 z-20"
        >
          {/* Focusing On Label */}
          <motion.p
            animate={{
              opacity: isIdle ? 0 : 1,
              height: isIdle ? 0 : 'auto',
              marginBottom: isIdle ? 0 : 16
            }}
            transition={{
              duration: 0.6,
              ease: [0.25, 0.1, 0.25, 1],
              delay: isIdle ? 0 : 0.15 // Delay appearance when becoming active
            }}
            className="text-lg text-muted-foreground overflow-hidden"
          >
            {t('focusView.focusingOn')}
          </motion.p>

          {/* Task Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 max-w-4xl leading-tight wrap-break-word w-full"
          >
            {task.title}
          </motion.h1>

          {/* Task Description - With Clamping */}
          {task.description && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: isIdle ? 0.7 : 1,
                y: 0,
              }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className={cn(
                "text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto wrap-break-word w-full",
                "line-clamp-3" // Limit to 3 lines to prevent overflow
              )}
            >
              {task.description}
            </motion.p>
          )}
        </motion.div>

        {/* Chat Assistant - Positioned below task area, fades out when idle */}
        <motion.div
          animate={{
            opacity: isIdle ? 0 : 1,
            y: isIdle ? 30 : 0,
            scale: isIdle ? 0.98 : 1,
            pointerEvents: isIdle ? 'none' : 'auto'
          }}
          transition={{
            type: 'spring',
            stiffness: 120,
            damping: 20,
            mass: 0.8,
            opacity: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }
          }}
          className="absolute left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-20"
          style={{ top: '60%' }}
        >
          <div className="bg-background/50 border rounded-lg p-3 shadow-lg backdrop-blur-sm">
            <ScrollArea className="h-32 sm:h-40 mb-2">
              <div className="space-y-4 text-left px-2">
                {messages.map((msg, index) => (
                  msg.content && (
                    <div key={index} className={cn("flex items-start gap-3", msg.role === 'user' ? "justify-end" : "")}>
                      {msg.role === 'model' && <Bot className="w-5 h-5 text-primary shrink-0 mt-1" />}
                      <p className={cn("text-sm rounded-lg px-3 py-2 max-w-md whitespace-pre-wrap wrap-break-word", msg.role === 'model' ? "bg-muted" : "bg-primary text-primary-foreground")}>
                        {msg.content}
                      </p>
                    </div>
                  )
                ))}
                {isAssistantLoading && messages.length > 0 && messages[messages.length - 1].content === '' && (
                  <div className="flex items-start gap-3">
                    <Bot className="w-5 h-5 text-primary shrink-0 mt-1" />
                    <p className="text-sm rounded-lg px-3 py-2 max-w-md bg-muted flex items-center">
                      <LoaderCircle className="w-4 h-4 animate-spin" />
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <Input
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={t('focusView.askAssistant')}
                disabled={isAssistantLoading}
                className="bg-background/60"
              />
              <Button type="submit" size="icon" disabled={isAssistantLoading || !userInput.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </motion.div>

        {/* Footer with Timer Controls - FIXED at bottom */}
        <footer className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-4 z-30 pointer-events-none">
          <div className="contents *:pointer-events-auto">
            <motion.div
              animate={{
                opacity: isIdle ? 0.3 : 1,
                filter: isIdle ? 'blur(2px)' : 'blur(0px)'
              }}
              transition={{
                duration: 0.8,
                ease: [0.25, 0.1, 0.25, 1]
              }}
              className="flex items-center gap-4 bg-background/50 p-2 rounded-full backdrop-blur-sm sm:bg-transparent sm:p-0 sm:backdrop-blur-none"
            >
              <PomodoroTimer
                ref={timerRef}
                onPomodoroComplete={handlePomodoroCycleComplete}
                onTimerUpdate={handleTimerUpdate}
              />
              {/* Ambient Sounds */}
              <AmbientSoundPlayer onSoundChange={setActiveAmbientSound} />
            </motion.div>

            <motion.div
              animate={{
                opacity: isIdle ? 0 : 1,
              }}
              transition={{
                duration: 0.6,
                ease: [0.25, 0.1, 0.25, 1],
                delay: isIdle ? 0 : 0.1
              }}
              className="flex items-center gap-2 bg-background/50 p-1 rounded-lg backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none"
            >
              <Button variant="ghost" size="icon" onClick={() => timerRef.current?.reset()} aria-label={t('pomodoro.resetTimer')}>
                <RefreshCw className="w-5 h-5" />
              </Button>
              <Button size="icon" className="w-12 h-12 rounded-full shadow-lg" onClick={() => timerRef.current?.toggle()} aria-label={timerState.isActive ? t('pomodoro.pauseTimer') : t('pomodoro.startTimer')}>
                {timerState.isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => timerRef.current?.next()} aria-label={timerState.mode === 'work' ? t('pomodoro.startBreak') : t('pomodoro.startWork')}>
                <Coffee className="w-5 h-5" />
              </Button>
              <div className="w-px h-6 bg-border mx-1" />
              <Button variant="ghost" size="icon" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}>
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </Button>
            </motion.div>
          </div>
        </footer>
      </motion.div>
    </AnimatePresence>
  );
}
