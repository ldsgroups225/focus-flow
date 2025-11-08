
'use client';

import { useState, useEffect, useCallback, useMemo, useImperativeHandle, forwardRef, useRef } from 'react';
import { Progress } from "@/components/ui/progress";

const WORK_MINUTES = 25;
const BREAK_MINUTES = 5;

type TimerMode = 'work' | 'break';

export type PomodoroTimerHandles = {
  toggle: () => void;
  reset: () => void;
  next: () => void;
  isActive: boolean;
};

type PomodoroTimerProps = {
  onPomodoroComplete: () => void;
  onTimerUpdate: (mode: TimerMode, isActive: boolean) => void;
};

export const PomodoroTimer = forwardRef<PomodoroTimerHandles, PomodoroTimerProps>(({ onPomodoroComplete, onTimerUpdate }, ref) => {
  const [mode, setMode] = useState<TimerMode>('work');
  const [isActive, setIsActive] = useState(false);
  
  const initialTime = useMemo(() => (mode === 'work' ? WORK_MINUTES * 60 : BREAK_MINUTES * 60), [mode]);
  const [secondsLeft, setSecondsLeft] = useState(initialTime);
  const completionHandledRef = useRef(false);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = 100 - (secondsLeft / initialTime) * 100;

  const handleNextSession = useCallback(() => {
    setIsActive(false);
    if (mode === 'work') {
      onPomodoroComplete();
      setMode('break');
      setSecondsLeft(BREAK_MINUTES * 60);
    } else {
      setMode('work');
      setSecondsLeft(WORK_MINUTES * 60);
    }
    completionHandledRef.current = false;
  }, [mode, onPomodoroComplete]);

  // Timer countdown with completion handling
  useEffect(() => {
    if (!isActive) {
      completionHandledRef.current = false;
      return;
    }
    
    if (secondsLeft === 0) {
      if (!completionHandledRef.current) {
        completionHandledRef.current = true;
        new Audio('/notification.mp3').play().catch(e => console.error("Error playing sound:", e));
        // Use setTimeout to defer state updates
        setTimeout(() => handleNextSession(), 0);
      }
      return;
    }
    
    const interval = setInterval(() => {
      setSecondsLeft(seconds => Math.max(0, seconds - 1));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isActive, secondsLeft, handleNextSession]);

  // Reset timer when mode changes
  const [prevInitialTime, setPrevInitialTime] = useState(initialTime);
  if (prevInitialTime !== initialTime) {
    setPrevInitialTime(initialTime);
    setSecondsLeft(initialTime);
    setIsActive(false);
  }
  
  useEffect(() => {
    onTimerUpdate(mode, isActive);
  }, [mode, isActive, onTimerUpdate]);

  useImperativeHandle(ref, () => ({
    toggle: () => setIsActive(!isActive),
    reset: () => {
      setIsActive(false);
      setSecondsLeft(initialTime);
    },
    next: handleNextSession,
    isActive: isActive
  }));
  
  return (
    <div className="w-36">
        <div className="flex items-baseline">
            <span className="text-4xl font-bold tabular-nums">
                {`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}
            </span>
        </div>
        <Progress value={progress} className="h-1 mt-2" />
    </div>
  );
});

PomodoroTimer.displayName = 'PomodoroTimer';
