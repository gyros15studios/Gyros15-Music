import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause, ListPlus, Music, Download, Repeat, Repeat1, Loader2 } from "lucide-react";
import { usePlayer, Track, Album, PlaylistItem } from "@/contexts/PlayerContext";
import { AddToPlaylistDialog } from "@/components/AddToPlaylistDialog";

interface AlbumData {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  artist: string;
  available_from: string | null;
}

interface TrackData {
  id: string;
  album_id: string;
  title: string;
  file_url: string;
}

const SUPABASE_URL = "https://hlnepygyjvtnernhsgmd.supabase.co";

const AlbumDetail = () => {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<AlbumData | null>(null);
  const [tracks, setTracks] = useState<TrackData[]>([]);
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState<TrackData | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const { 
    currentTrack, 
    isPlaying, 
    playQueue,
    togglePlay,
    queue,
    queueIndex,
    repeatMode,
    toggleRepeat
  } = usePlayer();

  useEffect(() => {
    const fetchAlbumAndTracks = async () => {
      if (!albumId) return;

      const { data: albumData } = await supabase
        .from('albums')
        .select('*')
        .eq('id', albumId)
        .maybeSingle();

      if (albumData) setAlbum(albumData);

      const { data: tracksData } = await supabase
        .from('tracks')
        .select('*')
        .eq('album_id', albumId)
        .order('created_at', { ascending: true });

      if (tracksData) setTracks(tracksData);
    };

    fetchAlbumAndTracks();
  }, [albumId]);

  const isAlbumAvailable = !album?.available_from || new Date(album.available_from) <= new Date();

  const handlePlayAlbum = (startIndex = 0) => {
    if (!isAlbumAvailable || !album) return;
    
    const albumForPlayer: Album = {
      id: album.id,
      title: album.title,
      artist: album.artist,
      image_url: album.image_url,
    };
    
    const queueItems: PlaylistItem[] = tracks.map(track => ({
      track: {
        id: track.id,
        album_id: track.album_id,
        title: track.title,
        file_url: track.file_url,
      },
      album: albumForPlayer,
    }));
    
    playQueue(queueItems, startIndex);
  };

  const handleTrackClick = (index: number) => {
    if (!isAlbumAvailable) return;
    
    // Check if this album is already playing
    const isThisAlbumPlaying = queue.length > 0 && 
      queue[0]?.album.id === album?.id &&
      queueIndex === index;
    
    if (isThisAlbumPlaying) {
      togglePlay();
    } else {
      handlePlayAlbum(index);
    }
  };

  const downloadTrackWithMetadata = async (track: TrackData, trackNumber: number) => {
    if (!album) return;
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/download-with-metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileUrl: track.file_url,
          title: track.title,
          artist: album.artist,
          album: album.title,
          trackNumber: trackNumber,
          totalTracks: tracks.length,
          albumArtUrl: album.image_url,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to download');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const trackNum = String(trackNumber).padStart(2, '0');
      const safeTitle = track.title.replace(/[<>:"/\\|?*]/g, '_');
      const fileName = `${trackNum} - ${safeTitle}.mp3`;
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      // Fallback to direct download without metadata
      const link = document.createElement('a');
      link.href = track.file_url;
      link.download = `${String(trackNumber).padStart(2, '0')} - ${track.title}.mp3`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadAll = async () => {
    if (!album || isDownloading) return;
    
    setIsDownloading(true);
    
    try {
      for (let i = 0; i < tracks.length; i++) {
        await downloadTrackWithMetadata(tracks[i], i + 1);
        
        // Delay between downloads to prevent browser blocking
        if (i < tracks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSingleDownload = async (e: React.MouseEvent, track: TrackData, index: number) => {
    e.stopPropagation();
    await downloadTrackWithMetadata(track, index + 1);
  };

  const isTrackCurrentlyPlaying = (trackId: string) => {
    return currentTrack?.track.id === trackId && isPlaying;
  };

  const isTrackCurrent = (trackId: string) => {
    return currentTrack?.track.id === trackId;
  };

  if (!album) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading album...</p>
        </div>
      </div>
    );
  }

  const albumForDialog: Album = {
    id: album.id,
    title: album.title,
    artist: album.artist,
    image_url: album.image_url,
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Albums
          </Button>
        </div>
      </div>

      {/* Album Info */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-full md:w-80 h-80 rounded-2xl overflow-hidden shadow-2xl shadow-primary/20">
            {album.image_url ? (
              <img
                src={album.image_url}
                alt={album.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <Music className="w-20 h-20 text-muted-foreground" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">{album.artist}</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {album.title}
            </h1>
            {album.description && (
              <p className="text-muted-foreground text-lg mb-6">{album.description}</p>
            )}
            <p className="text-sm text-muted-foreground mb-6">{tracks.length} tracks</p>
            
            {!isAlbumAvailable && album.available_from && (
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg mb-6">
                <p className="text-primary font-semibold">
                  Available from {new Date(album.available_from).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            )}

            {isAlbumAvailable && tracks.length > 0 && (
              <div className="flex flex-wrap items-center gap-3">
                <Button 
                  onClick={() => handlePlayAlbum(0)} 
                  className="gap-2"
                  size="lg"
                >
                  <Play className="w-5 h-5" />
                  Play Album
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={toggleRepeat}
                  className={`gap-2 ${repeatMode !== 'off' ? 'border-primary text-primary' : ''}`}
                  title={repeatMode === 'off' ? 'Repeat off' : repeatMode === 'all' ? 'Repeat all' : 'Repeat one'}
                >
                  {repeatMode === 'one' ? (
                    <Repeat1 className="w-5 h-5" />
                  ) : (
                    <Repeat className="w-5 h-5" />
                  )}
                  {repeatMode === 'off' ? 'Repeat' : repeatMode === 'all' ? 'Repeat All' : 'Repeat One'}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => handleDownloadAll()}
                  disabled={isDownloading}
                  className="gap-2"
                >
                  {isDownloading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  {isDownloading ? 'Letöltés...' : 'Összes Letöltése'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Track List */}
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">Tracks</h2>
        <div className="space-y-2">
          {tracks.map((track, index) => (
            <div
              key={track.id}
              className={`p-4 rounded-lg flex items-center gap-4 transition-all group ${
                isAlbumAvailable ? 'hover:bg-accent/50' : 'opacity-50'
              } ${isTrackCurrent(track.id) ? 'bg-accent' : ''}`}
            >
              <button
                onClick={() => handleTrackClick(index)}
                disabled={!isAlbumAvailable}
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                  isTrackCurrentlyPlaying(track.id)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground'
                } ${!isAlbumAvailable ? 'cursor-not-allowed' : ''}`}
              >
                {isTrackCurrentlyPlaying(track.id) ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>
              
              <span className="flex-1 text-left font-medium">{track.title}</span>
              
              {isAlbumAvailable && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAddToPlaylistTrack(track);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Add to playlist"
                  >
                    <ListPlus className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleSingleDownload(e, track, index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Download with metadata"
                  >
                    <Download className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add to Playlist Dialog */}
      {addToPlaylistTrack && (
        <AddToPlaylistDialog
          open={!!addToPlaylistTrack}
          onOpenChange={(open) => !open && setAddToPlaylistTrack(null)}
          track={{
            id: addToPlaylistTrack.id,
            album_id: addToPlaylistTrack.album_id,
            title: addToPlaylistTrack.title,
            file_url: addToPlaylistTrack.file_url,
          }}
          album={albumForDialog}
        />
      )}
    </div>
  );
};

export default AlbumDetail;
