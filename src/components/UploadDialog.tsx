import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Plus, X, Calendar } from "lucide-react";

interface Album {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  artist: string;
  available_from: string | null;
}

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete: () => void;
  editingAlbum?: Album | null;
}

interface Track {
  file: File;
  title: string;
}

export const UploadDialog = ({ open, onOpenChange, onUploadComplete, editingAlbum }: UploadDialogProps) => {
  const [albumTitle, setAlbumTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [uploading, setUploading] = useState(false);
  const [availableFrom, setAvailableFrom] = useState("");

  // Load editing album data when dialog opens
  useEffect(() => {
    if (open && editingAlbum) {
      setAlbumTitle(editingAlbum.title);
      setDescription(editingAlbum.description || "");
      setAvailableFrom(editingAlbum.available_from ? editingAlbum.available_from.split('T')[0] : "");
      setCoverImage(null);
      setTracks([]);
    } else if (open && !editingAlbum) {
      setAlbumTitle("");
      setDescription("");
      setAvailableFrom("");
      setCoverImage(null);
      setTracks([]);
    }
  }, [open, editingAlbum]);

  const handleAddTrack = (files: FileList | null) => {
    if (!files) return;
    
    const newTracks: Track[] = [];
    Array.from(files).forEach(file => {
      if (file.type.startsWith("audio/")) {
        newTracks.push({
          file,
          title: file.name.replace(/\.[^/.]+$/, "")
        });
      }
    });
    
    setTracks([...tracks, ...newTracks]);
  };

  const handleRemoveTrack = (index: number) => {
    setTracks(tracks.filter((_, i) => i !== index));
  };

  const handleUpdateTrackTitle = (index: number, title: string) => {
    const updatedTracks = [...tracks];
    updatedTracks[index].title = title;
    setTracks(updatedTracks);
  };

  const handleUpload = async () => {
    if (!albumTitle.trim()) {
      toast.error("Please enter an album title");
      return;
    }

    if (!editingAlbum && tracks.length === 0) {
      toast.error("Please add at least one track");
      return;
    }

    setUploading(true);

    try {
      let imageUrl = editingAlbum?.image_url || null;

      // Upload cover image if provided
      if (coverImage) {
        const fileExt = coverImage.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: imageError } = await supabase.storage
          .from('album-covers')
          .upload(fileName, coverImage);

        if (imageError) {
          console.error('Image upload error:', imageError);
          throw new Error(`Failed to upload cover image: ${imageError.message}`);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('album-covers')
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      let album;
      
      if (editingAlbum) {
        // Update existing album
        const { data: updatedAlbum, error: albumError } = await supabase
          .from('albums')
          .update({
            title: albumTitle,
            description: description || null,
            image_url: imageUrl,
            available_from: availableFrom || null,
          })
          .eq('id', editingAlbum.id)
          .select()
          .single();

        if (albumError) throw albumError;
        album = updatedAlbum;
      } else {
        // Create new album
        const { data: newAlbum, error: albumError } = await supabase
          .from('albums')
          .insert({
            title: albumTitle,
            description: description || null,
            image_url: imageUrl,
            artist: 'Gyros15 Musics',
            available_from: availableFrom || null,
          })
          .select()
          .single();

        if (albumError) throw albumError;
        album = newAlbum;
      }

      // Upload tracks (only if new tracks are added)
      if (tracks.length > 0) {
        for (const track of tracks) {
          const fileExt = track.file.name.split('.').pop();
          const fileName = `${album.id}/${Date.now()}_${track.title.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;
          
          const { error: trackUploadError } = await supabase.storage
            .from('music-files')
            .upload(fileName, track.file);

          if (trackUploadError) {
            console.error('Track upload error:', trackUploadError);
            throw new Error(`Failed to upload track "${track.title}": ${trackUploadError.message}`);
          }

          const { data: { publicUrl } } = supabase.storage
            .from('music-files')
            .getPublicUrl(fileName);

          const { error: trackError } = await supabase
            .from('tracks')
            .insert({
              album_id: album.id,
              title: track.title,
              file_url: publicUrl
            });

          if (trackError) {
            console.error('Track database error:', trackError);
            throw new Error(`Failed to save track "${track.title}": ${trackError.message}`);
          }
        }
      }

      toast.success(editingAlbum ? "Album updated successfully!" : "Album uploaded successfully!");
      
      // Reset form
      setAlbumTitle("");
      setDescription("");
      setAvailableFrom("");
      setCoverImage(null);
      setTracks([]);
      
      onUploadComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || "Failed to upload album");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {editingAlbum ? "Edit Album" : "Upload Album"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Album Title</Label>
            <Input
              id="title"
              value={albumTitle}
              onChange={(e) => setAlbumTitle(e.target.value)}
              placeholder="Enter album title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter album description (optional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="available-from" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Release Date
            </Label>
            <Input
              id="available-from"
              type="date"
              value={availableFrom}
              onChange={(e) => setAvailableFrom(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Album will be grayed out until this date</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cover">Cover Image</Label>
            <Input
              id="cover"
              type="file"
              accept="image/*"
              onChange={(e) => setCoverImage(e.target.files?.[0] || null)}
            />
          </div>

          <div className="space-y-2">
            <Label>Tracks ({tracks.length})</Label>
            <div className="space-y-3">
              {tracks.map((track, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={track.title}
                    onChange={(e) => handleUpdateTrackTitle(index, e.target.value)}
                    placeholder="Track title"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveTrack(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              
              <div>
                <Input
                  type="file"
                  accept="audio/*"
                  multiple
                  onChange={(e) => handleAddTrack(e.target.files)}
                  className="hidden"
                  id="track-upload"
                />
                <Label htmlFor="track-upload">
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors">
                    <Plus className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Add Tracks</p>
                  </div>
                </Label>
              </div>
            </div>
          </div>

          <Button
            onClick={handleUpload}
            disabled={uploading || (!editingAlbum && tracks.length === 0)}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
          >
            {uploading ? (
              editingAlbum ? "Updating..." : "Uploading..."
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {editingAlbum ? "Update Album" : "Upload Album"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
