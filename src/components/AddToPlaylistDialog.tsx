import { useState } from "react";
import { Track, Album } from "@/contexts/PlayerContext";
import { useLocalPlaylists } from "@/hooks/useLocalPlaylists";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, ListMusic, Check } from "lucide-react";

interface AddToPlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: Track;
  album: Album;
}

export const AddToPlaylistDialog = ({
  open,
  onOpenChange,
  track,
  album,
}: AddToPlaylistDialogProps) => {
  const { playlists, createPlaylist, addTrackToPlaylist } = useLocalPlaylists();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [addedTo, setAddedTo] = useState<Set<string>>(new Set());

  const handleAddToPlaylist = (playlistId: string, playlistName: string) => {
    addTrackToPlaylist(playlistId, track, album);
    setAddedTo(prev => new Set([...prev, playlistId]));
    toast({
      title: "Added!",
      description: `"${track.title}" added to ${playlistName}`,
    });
  };

  const handleCreateAndAdd = () => {
    if (!newName.trim()) {
      toast({ title: "Error", description: "Enter a name", variant: "destructive" });
      return;
    }
    const newPlaylist = createPlaylist(newName.trim());
    addTrackToPlaylist(newPlaylist.id, track, album);
    toast({
      title: "Created & Added!",
      description: `"${track.title}" added to ${newPlaylist.name}`,
    });
    setNewName("");
    setShowCreate(false);
    onOpenChange(false);
  };

  const handleClose = () => {
    setShowCreate(false);
    setNewName("");
    setAddedTo(new Set());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add to Playlist</DialogTitle>
        </DialogHeader>
        
        <div className="py-2">
          <p className="text-sm text-muted-foreground mb-4 truncate">
            {track.title} • {album.title}
          </p>

          {showCreate ? (
            <div className="space-y-3">
              <Input
                placeholder="New playlist name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateAndAdd()}
                autoFocus
              />
              <div className="flex gap-2">
                <Button onClick={handleCreateAndAdd} className="flex-1">
                  Create & Add
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setShowCreate(true)}
                className="w-full mb-4 gap-2"
              >
                <Plus className="w-4 h-4" />
                Create New Playlist
              </Button>

              {playlists.length === 0 ? (
                <div className="text-center py-4">
                  <ListMusic className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No playlists yet</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {playlists.map((playlist) => {
                    const isAdded = addedTo.has(playlist.id) || 
                      playlist.tracks.some(t => t.track.id === track.id);
                    
                    return (
                      <button
                        key={playlist.id}
                        onClick={() => !isAdded && handleAddToPlaylist(playlist.id, playlist.name)}
                        disabled={isAdded}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                          isAdded 
                            ? 'bg-accent/50 text-muted-foreground' 
                            : 'hover:bg-accent'
                        }`}
                      >
                        <div className="w-10 h-10 rounded bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                          {playlist.tracks[0]?.album.image_url ? (
                            <img 
                              src={playlist.tracks[0].album.image_url} 
                              alt="" 
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <ListMusic className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-medium truncate">{playlist.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {playlist.tracks.length} tracks
                          </p>
                        </div>
                        {isAdded && <Check className="w-5 h-5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
