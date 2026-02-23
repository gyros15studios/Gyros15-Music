import { usePlayer } from "@/contexts/PlayerContext";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Repeat, 
  Repeat1,
  Music,
  ChevronUp,
  X
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const MiniPlayer = () => {
  const {
    currentTrack,
    queue,
    queueIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    togglePlay,
    playPrevious,
    playNext,
    seek,
    setVolume,
    toggleMute,
    toggleRepeat,
  } = usePlayer();
  
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  const canPlayPrevious = queueIndex > 0 || currentTime > 3 || repeatMode === 'all';
  const canPlayNext = queueIndex < queue.length - 1 || repeatMode === 'all';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border shadow-2xl">
      {/* Expanded Queue View */}
      {expanded && (
        <div className="container mx-auto px-4 py-4 border-b border-border max-h-64 overflow-y-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-foreground">Now Playing</h3>
            <Button variant="ghost" size="icon" onClick={() => setExpanded(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-1">
            {queue.map((item, index) => (
              <button
                key={`${item.track.id}-${index}`}
                onClick={() => {
                  if (index !== queueIndex) {
                    // Would need to add setQueueIndex to context
                  }
                }}
                className={`w-full p-2 rounded-lg flex items-center gap-3 transition-all hover:bg-accent/50 ${
                  index === queueIndex ? 'bg-accent' : ''
                }`}
              >
                <div className="w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                  {item.album.image_url ? (
                    <img 
                      src={item.album.image_url} 
                      alt={item.album.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium truncate">{item.track.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{item.album.artist}</p>
                </div>
                {index === queueIndex && isPlaying && (
                  <div className="flex gap-0.5">
                    <span className="w-0.5 h-3 bg-primary animate-pulse" />
                    <span className="w-0.5 h-4 bg-primary animate-pulse delay-75" />
                    <span className="w-0.5 h-2 bg-primary animate-pulse delay-150" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Player */}
      <div className="container mx-auto px-4 py-4">
        {/* Progress Bar */}
        <div className="mb-3">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={1}
            onValueChange={(value) => seek(value[0])}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4">
          {/* Track Info */}
          <button 
            className="flex-1 flex items-center gap-3 min-w-0 hover:bg-accent/30 rounded-lg p-1 -m-1 transition-colors"
            onClick={() => navigate(`/album/${currentTrack.album.id}`)}
          >
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {currentTrack.album.image_url ? (
                <img 
                  src={currentTrack.album.image_url} 
                  alt={currentTrack.album.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">{currentTrack.track.title}</p>
              <p className="text-sm text-muted-foreground truncate">{currentTrack.album.artist}</p>
            </div>
          </button>

          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={playPrevious}
              disabled={!canPlayPrevious}
              className="hidden sm:flex"
            >
              <SkipBack className="w-5 h-5" />
            </Button>
            
            <Button
              size="icon"
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={playNext}
              disabled={!canPlayNext}
              className="hidden sm:flex"
            >
              <SkipForward className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleRepeat}
              className={`hidden md:flex ${repeatMode !== 'off' ? 'text-primary' : ''}`}
              title={repeatMode === 'off' ? 'Repeat off' : repeatMode === 'all' ? 'Repeat all' : 'Repeat one'}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-5 h-5" />
              ) : (
                <Repeat className="w-5 h-5" />
              )}
            </Button>
          </div>

          {/* Volume & Queue */}
          <div className="flex-1 flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded(!expanded)}
              className="hidden md:flex"
            >
              <ChevronUp className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              className="hidden sm:flex"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </Button>
            <div className="hidden md:block">
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.01}
                onValueChange={(value) => setVolume(value[0])}
                className="w-24"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
