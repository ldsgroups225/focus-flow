'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, CloudRain, Wind, Music, Pause, Play, SkipForward, RefreshCw, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useI18n } from '@/app/components/i18n-provider';

export type AmbientSound = {
  id: string;
  name: string;
  icon: React.ReactNode;
  audioUrl: string;
  color: string;
};

// Audio files hosted locally in /public/sounds/
const AMBIENT_SOUNDS: AmbientSound[] = [
  {
    id: 'rain',
    name: 'Rain',
    icon: <CloudRain className="w-5 h-5" />,
    audioUrl: '/sounds/rain.wav',
    color: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400',
  },
  {
    id: 'wind',
    name: 'Wind',
    icon: <Wind className="w-5 h-5" />,
    audioUrl: '/sounds/wind.wav',
    color: 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400',
  },
  {
    id: 'jungle',
    name: 'Jungle',
    icon: <Music className="w-5 h-5" />,
    audioUrl: '/sounds/jungle.mp3',
    color: 'bg-green-500/20 hover:bg-green-500/30 text-green-400',
  },
];

type AmbientSoundPlayerProps = {
  onSoundChange?: (soundId: string | null) => void;
  isExpanded?: boolean;
};

export function AmbientSoundPlayer({ onSoundChange, isExpanded = false }: AmbientSoundPlayerProps) {
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = ''; // Release audio resources
      audioRef.current = null;
    }
  }, []);

  const handleSoundSelect = useCallback((soundId: string) => {
    if (activeSound === soundId) {
      // Toggle off
      setActiveSound(null);
      cleanupAudio();
      onSoundChange?.(null);
    } else {
      // Switch sound - clean up previous audio first
      cleanupAudio();

      const sound = AMBIENT_SOUNDS.find(s => s.id === soundId);
      if (sound) {
        const audio = new Audio(sound.audioUrl);
        audio.loop = true;
        audio.volume = isMuted ? 0 : volume / 100;
        audio.play().catch(() => {
          // Audio autoplay blocked - user interaction required
        });
        audioRef.current = audio;
        setActiveSound(soundId);
        onSoundChange?.(soundId);
      }
    }
  }, [activeSound, volume, isMuted, onSoundChange, cleanupAudio]);

  // Update volume when changed
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAudio();
    };
  }, [cleanupAudio]);

  return (
    <div className={cn(
      "flex items-center gap-2 rounded-lg p-2",
      isExpanded ? "bg-background/50 border" : ""
    )}>
      {/* Sound Buttons */}
      <div className="flex items-center gap-1">
        {AMBIENT_SOUNDS.map((sound) => (
          <Button
            key={sound.id}
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-full transition-all",
              activeSound === sound.id
                ? cn(sound.color, "ring-2 ring-current")
                : "hover:bg-muted"
            )}
            onClick={() => handleSoundSelect(sound.id)}
            aria-label={sound.name}
            aria-pressed={activeSound === sound.id}
          >
            {sound.icon}
          </Button>
        ))}
      </div>

      {/* Volume Control */}
      {activeSound && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="flex items-center gap-2 ml-2 pl-2 border-l"
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
            <Slider
              value={[volume]}
              onValueChange={(v) => setVolume(v[0])}
              max={100}
              step={1}
              className="w-20"
              aria-label="Volume"
            />
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}

type FocusModeControlsProps = {
  isPlaying: boolean;
  onToggle: () => void;
  onReset: () => void;
  onNext: () => void;
  mode: 'work' | 'break';
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
};

export function FocusModeControls({
  isPlaying,
  onToggle,
  onReset,
  onNext,
  mode,
  isFullscreen,
  onToggleFullscreen,
}: FocusModeControlsProps) {
  const { t } = useI18n();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2"
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onReset}
        title={t('pomodoro.resetTimer')}
        className="h-10 w-10"
      >
        <RefreshCw className="w-5 h-5" />
      </Button>

      <Button
        size="icon"
        onClick={onToggle}
        className={cn(
          "h-14 w-14 rounded-full shadow-lg transition-all",
          isPlaying
            ? "bg-primary hover:bg-primary/90"
            : "bg-linear-to-r from-primary to-purple-600 hover:opacity-90"
        )}
        title={isPlaying ? t('pomodoro.pauseTimer') : t('pomodoro.startTimer')}
      >
        {isPlaying ? (
          <Pause className="w-6 h-6" />
        ) : (
          <Play className="w-6 h-6 ml-0.5" />
        )}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
        title={mode === 'work' ? t('pomodoro.startBreak') : t('pomodoro.startWork')}
        className="h-10 w-10"
      >
        <SkipForward className="w-5 h-5" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleFullscreen}
        title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        className="h-10 w-10"
      >
        {isFullscreen ? (
          <Minimize className="w-5 h-5" />
        ) : (
          <Maximize className="w-5 h-5" />
        )}
      </Button>
    </motion.div>
  );
}
