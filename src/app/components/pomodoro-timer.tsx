
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

// Generate a beep sound using Web Audio API as fallback
const playBeep = (frequency = 800, duration = 200, volume = 0.5): Promise<void> => {
  return new Promise((resolve) => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      gainNode.gain.value = volume;

      oscillator.start();

      // Fade out to avoid click
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
        resolve();
      }, duration);
    } catch (error) {
      console.error('Web Audio API not supported:', error);
      resolve();
    }
  });
};

// Play notification sound with the appropriate audio file for the mode
const playNotificationSound = async (currentMode: TimerMode) => {
  const audioFile = currentMode === 'work' ? '/work_timeout.mp3' : '/break_timeout.mp3';

  try {
    const audio = new Audio(audioFile);
    audio.volume = 0.7;
    await audio.play();
  } catch (error) {
    console.warn(`Could not play ${audioFile}, using beep fallback:`, error);
    // Fallback: Play 3 beeps with Web Audio API
    await playBeep(880, 150, 0.5); // A5
    await new Promise(r => setTimeout(r, 100));
    await playBeep(880, 150, 0.5); // A5
    await new Promise(r => setTimeout(r, 100));
    await playBeep(1047, 300, 0.6); // C6 (higher, longer for emphasis)
  }
};

// Request browser notification permission and show notification
const showBrowserNotification = (title: string, body: string) => {
  if (typeof window === 'undefined') return;

  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon.png', // You can add an icon to public folder
        tag: 'pomodoro-timer',
        requireInteraction: false,
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/icon.png',
            tag: 'pomodoro-timer',
          });
        }
      });
    }
  }
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

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

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

        // Play notification sound (uses different audio for work vs break)
        playNotificationSound(mode);

        // Show browser notification
        if (mode === 'work') {
          showBrowserNotification(
            '🍅 Pomodoro Complete!',
            'Great work! Time for a break.'
          );
        } else {
          showBrowserNotification(
            '☕ Break Over!',
            'Ready to focus again?'
          );
        }

        // Use setTimeout to defer state updates
        setTimeout(() => handleNextSession(), 0);
      }
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft(seconds => Math.max(0, seconds - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, secondsLeft, handleNextSession, mode]);

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
