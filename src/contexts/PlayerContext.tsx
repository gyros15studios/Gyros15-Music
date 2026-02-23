import { createContext, useContext, useState, useRef, useEffect, ReactNode, useCallback } from "react";

export interface Track {
  id: string;
  album_id: string;
  title: string;
  file_url: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  image_url: string | null;
}

export interface PlaylistItem {
  track: Track;
  album: Album;
}

interface PlayerContextType {
  // Current state
  currentTrack: PlaylistItem | null;
  queue: PlaylistItem[];
  queueIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: 'off' | 'all' | 'one';
  
  // Actions
  playTrack: (track: Track, album: Album) => void;
  playQueue: (items: PlaylistItem[], startIndex?: number) => void;
  addToQueue: (track: Track, album: Album) => void;
  togglePlay: () => void;
  playPrevious: () => void;
  playNext: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleRepeat: () => void;
  
  // Audio ref for external access
  audioRef: React.RefObject<HTMLAudioElement>;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
};

interface PlayerProviderProps {
  children: ReactNode;
}

export const PlayerProvider = ({ children }: PlayerProviderProps) => {
  const [queue, setQueue] = useState<PlaylistItem[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentTrack = queue[queueIndex] || null;

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play();
      } else if (queueIndex < queue.length - 1) {
        setQueueIndex(queueIndex + 1);
      } else if (repeatMode === 'all') {
        setQueueIndex(0);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [queueIndex, queue.length, repeatMode]);

  // Update audio source when track changes
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.src = currentTrack.track.file_url;
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [currentTrack?.track.id]);

  // Handle play state changes
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const playTrack = useCallback((track: Track, album: Album) => {
    setQueue([{ track, album }]);
    setQueueIndex(0);
    setIsPlaying(true);
  }, []);

  const playQueue = useCallback((items: PlaylistItem[], startIndex = 0) => {
    setQueue(items);
    setQueueIndex(startIndex);
    setIsPlaying(true);
  }, []);

  const addToQueue = useCallback((track: Track, album: Album) => {
    setQueue(prev => [...prev, { track, album }]);
  }, []);

  const togglePlay = useCallback(() => {
    if (currentTrack) {
      setIsPlaying(prev => !prev);
    }
  }, [currentTrack]);

  const playPrevious = useCallback(() => {
    if (currentTime > 3) {
      if (audioRef.current) audioRef.current.currentTime = 0;
    } else if (queueIndex > 0) {
      setQueueIndex(queueIndex - 1);
    } else if (repeatMode === 'all') {
      setQueueIndex(queue.length - 1);
    }
  }, [currentTime, queueIndex, repeatMode, queue.length]);

  const playNext = useCallback(() => {
    if (queueIndex < queue.length - 1) {
      setQueueIndex(queueIndex + 1);
    } else if (repeatMode === 'all') {
      setQueueIndex(0);
    }
  }, [queueIndex, queue.length, repeatMode]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  }, []);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 0.5;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  }, [isMuted, volume]);

  const toggleRepeat = useCallback(() => {
    setRepeatMode(prev => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        queue,
        queueIndex,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        repeatMode,
        playTrack,
        playQueue,
        addToQueue,
        togglePlay,
        playPrevious,
        playNext,
        seek,
        setVolume,
        toggleMute,
        toggleRepeat,
        audioRef,
      }}
    >
      <audio ref={audioRef} />
      {children}
    </PlayerContext.Provider>
  );
};
