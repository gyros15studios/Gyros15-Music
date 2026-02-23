import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlbumCard } from "@/components/AlbumCard";
import { Button } from "@/components/ui/button";
import { CodeVerification } from "@/components/CodeVerification";
import { EditorModeVerification } from "@/components/EditorModeVerification";
import { UploadDialog } from "@/components/UploadDialog";
import { Upload, Music2, Shield, MoreVertical, LogOut, ListMusic } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
interface Album {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  artist: string;
  available_from: string | null;
}
interface Track {
  id: string;
  album_id: string;
}
const Index = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [trackCounts, setTrackCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [showEditorDialog, setShowEditorDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [editorMode, setEditorMode] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const fetchAlbums = async () => {
    setLoading(true);
    const {
      data: albumsData,
      error: albumsError
    } = await supabase.from('albums').select('*').order('created_at', {
      ascending: false
    });
    if (albumsError) {
      console.error('Error fetching albums:', albumsError);
      setLoading(false);
      return;
    }
    setAlbums(albumsData || []);

    // Fetch track counts for each album
    const counts: Record<string, number> = {};
    for (const album of albumsData || []) {
      const {
        count,
        error
      } = await supabase.from('tracks').select('*', {
        count: 'exact',
        head: true
      }).eq('album_id', album.id);
      if (!error) {
        counts[album.id] = count || 0;
      }
    }
    setTrackCounts(counts);
    setLoading(false);
  };
  useEffect(() => {
    fetchAlbums();
  }, []);
  const handleCodeVerified = () => {
    setShowCodeDialog(false);
    setShowUploadDialog(true);
  };
  const handleEditorModeVerified = () => {
    setShowEditorDialog(false);
    setEditorMode(true);
    toast({
      title: "Editor Mode Activated",
      description: "You can now edit and delete albums."
    });
  };
  const handleExitEditorMode = () => {
    setEditorMode(false);
    setMenuOpen(false);
    toast({
      title: "Editor Mode Deactivated",
      description: "Editor controls are now hidden."
    });
  };
  const handleEditAlbum = (album: Album) => {
    setEditingAlbum(album);
    setShowUploadDialog(true);
  };
  const handleDeleteAlbum = async (albumId: string) => {
    if (!confirm("Are you sure you want to delete this album? This will also delete all tracks.")) {
      return;
    }

    // Delete all tracks first
    const {
      error: tracksError
    } = await supabase.from('tracks').delete().eq('album_id', albumId);
    if (tracksError) {
      toast({
        title: "Error",
        description: "Failed to delete tracks.",
        variant: "destructive"
      });
      return;
    }

    // Delete the album
    const {
      error: albumError
    } = await supabase.from('albums').delete().eq('id', albumId);
    if (albumError) {
      toast({
        title: "Error",
        description: "Failed to delete album.",
        variant: "destructive"
      });
      return;
    }
    toast({
      title: "Success",
      description: "Album deleted successfully."
    });
    fetchAlbums();
  };
  const handleUploadDialogClose = (open: boolean) => {
    setShowUploadDialog(open);
    if (!open) {
      setEditingAlbum(null);
    }
  };
  return <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Music2 className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Gyros15 Musics
                </h1>
                <p className="text-sm text-muted-foreground">Official Music Collection</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/playlists')}
              className="gap-2"
            >
              <ListMusic className="w-4 h-4" />
              <span className="hidden sm:inline">Playlists</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pb-32">
        {loading ? <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading albums...</p>
            </div>
          </div> : albums.length === 0 ? <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center max-w-md">
              <Music2 className="w-20 h-20 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-semibold mb-2">No Albums Yet</h2>
              <p className="text-muted-foreground mb-6">There are no music albums or failed to load due to server problems. Please try again later!</p>
            </div>
          </div> : <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {albums.map(album => <AlbumCard key={album.id} albumId={album.id} title={album.title} description={album.description || undefined} imageUrl={album.image_url || undefined} trackCount={trackCounts[album.id] || 0} editorMode={editorMode} onEdit={() => handleEditAlbum(album)} onDelete={() => handleDeleteAlbum(album.id)} availableFrom={album.available_from} />)}
          </div>}
      </main>

      {/* Editor Mode / Upload Button */}
      <div className="fixed bottom-8 right-8 flex flex-col items-end gap-2">
        {!editorMode ? <Button size="lg" onClick={() => setShowEditorDialog(true)} className="rounded-full w-16 h-16 shadow-[0_0_40px_rgba(139,92,246,0.5)] bg-gradient-to-r from-primary to-secondary hover:opacity-90">
            <Shield className="w-6 h-6" />
          </Button> : <Collapsible open={menuOpen} onOpenChange={setMenuOpen}>
            <CollapsibleContent className="flex flex-col gap-2 mb-2">
              <Button size="lg" onClick={() => {
            setShowUploadDialog(true);
            setMenuOpen(false);
          }} className="rounded-full w-16 h-16 shadow-[0_0_40px_rgba(139,92,246,0.5)] bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                <Upload className="w-6 h-6" />
              </Button>
              <Button size="lg" onClick={handleExitEditorMode} variant="destructive" className="rounded-full w-16 h-16 shadow-lg">
                <LogOut className="w-6 h-6" />
              </Button>
            </CollapsibleContent>
            <CollapsibleTrigger asChild>
              <Button size="lg" className="rounded-full w-16 h-16 shadow-[0_0_40px_rgba(139,92,246,0.5)] bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                <MoreVertical className="w-6 h-6" />
              </Button>
            </CollapsibleTrigger>
          </Collapsible>}
      </div>

      {/* Dialogs */}
      <CodeVerification open={showCodeDialog} onOpenChange={setShowCodeDialog} onVerified={handleCodeVerified} />
      <EditorModeVerification open={showEditorDialog} onOpenChange={setShowEditorDialog} onVerified={handleEditorModeVerified} />
      <UploadDialog open={showUploadDialog} onOpenChange={handleUploadDialogClose} onUploadComplete={fetchAlbums} editingAlbum={editingAlbum} />
    </div>;
};
export default Index;