import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocalPlaylists, LocalPlaylist } from "@/hooks/useLocalPlaylists";
import { usePlayer } from "@/contexts/PlayerContext";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Plus, 
  Play, 
  Trash2, 
  Edit2, 
  Music, 
  ListMusic,
  MoreVertical,
  X,
  Check
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Playlists = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { playlists, loading, createPlaylist, updatePlaylist, deletePlaylist, removeTrackFromPlaylist } = useLocalPlaylists();
  const { playQueue } = usePlayer();
  
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<LocalPlaylist | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<LocalPlaylist | null>(null);
  const [editName, setEditName] = useState("");

  const handleCreate = () => {
    if (!newPlaylistName.trim()) {
      toast({ title: "Error", description: "Please enter a playlist name", variant: "destructive" });
      return;
    }
    createPlaylist(newPlaylistName.trim(), newPlaylistDesc.trim() || undefined);
    setNewPlaylistName("");
    setNewPlaylistDesc("");
    setCreateDialogOpen(false);
    toast({ title: "Success", description: "Playlist created!" });
  };

  const handleDelete = (playlist: LocalPlaylist) => {
    if (confirm(`Delete "${playlist.name}"?`)) {
      deletePlaylist(playlist.id);
      if (selectedPlaylist?.id === playlist.id) {
        setSelectedPlaylist(null);
      }
      toast({ title: "Deleted", description: "Playlist removed" });
    }
  };

  const handlePlay = (playlist: LocalPlaylist) => {
    if (playlist.tracks.length === 0) {
      toast({ title: "Empty playlist", description: "Add some tracks first!", variant: "destructive" });
      return;
    }
    playQueue(playlist.tracks);
    toast({ title: "Now Playing", description: playlist.name });
  };

  const handleRename = () => {
    if (!editingPlaylist || !editName.trim()) return;
    updatePlaylist(editingPlaylist.id, { name: editName.trim() });
    setEditingPlaylist(null);
    toast({ title: "Renamed", description: "Playlist updated" });
  };

  const handleRemoveTrack = (playlistId: string, trackId: string) => {
    removeTrackFromPlaylist(playlistId, trackId);
    // Refresh selected playlist
    if (selectedPlaylist) {
      const updated = playlists.find(p => p.id === playlistId);
      if (updated) setSelectedPlaylist(updated);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Albums
          </Button>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Playlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Playlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Input
                  placeholder="Playlist name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
                <Input
                  placeholder="Description (optional)"
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                />
                <Button onClick={handleCreate} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Your Playlists
        </h1>

        {playlists.length === 0 ? (
          <div className="text-center py-16">
            <ListMusic className="w-20 h-20 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">No Playlists Yet</h2>
            <p className="text-muted-foreground mb-6">Create your first playlist to get started!</p>
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Playlist
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Playlist List */}
            <div className="space-y-3">
              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  onClick={() => setSelectedPlaylist(playlist)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedPlaylist?.id === playlist.id 
                      ? 'border-primary bg-accent' 
                      : 'border-border hover:border-primary/50 hover:bg-accent/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center flex-shrink-0">
                      {playlist.tracks[0]?.album.image_url ? (
                        <img 
                          src={playlist.tracks[0].album.image_url} 
                          alt="" 
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <ListMusic className="w-8 h-8 text-primary" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {editingPlaylist?.id === playlist.id ? (
                        <div className="flex gap-2">
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                            className="h-8"
                            autoFocus
                          />
                          <Button size="icon" variant="ghost" onClick={handleRename} className="h-8 w-8">
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditingPlaylist(null)} className="h-8 w-8">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <h3 className="font-semibold truncate">{playlist.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {playlist.tracks.length} {playlist.tracks.length === 1 ? 'track' : 'tracks'}
                          </p>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handlePlay(playlist)}
                        disabled={playlist.tracks.length === 0}
                        className="text-primary"
                      >
                        <Play className="w-5 h-5" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <MoreVertical className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setEditingPlaylist(playlist);
                            setEditName(playlist.name);
                          }}>
                            <Edit2 className="w-4 h-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(playlist)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Playlist Tracks */}
            {selectedPlaylist && (
              <div className="border border-border rounded-xl p-6">
                <h2 className="text-xl font-bold mb-4">{selectedPlaylist.name}</h2>
                {selectedPlaylist.description && (
                  <p className="text-muted-foreground mb-4">{selectedPlaylist.description}</p>
                )}
                
                {selectedPlaylist.tracks.length === 0 ? (
                  <div className="text-center py-8">
                    <Music className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No tracks yet</p>
                    <p className="text-sm text-muted-foreground">Add tracks from any album!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedPlaylist.tracks.map((item, index) => (
                      <div
                        key={item.track.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 group"
                      >
                        <span className="text-sm text-muted-foreground w-6">{index + 1}</span>
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
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.track.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{item.album.title}</p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveTrack(selectedPlaylist.id, item.track.id)}
                          className="opacity-0 group-hover:opacity-100 text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Playlists;
