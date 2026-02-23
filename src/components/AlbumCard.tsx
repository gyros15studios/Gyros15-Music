import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Pencil, Trash2 } from "lucide-react";

interface AlbumCardProps {
  albumId: string;
  title: string;
  description?: string;
  imageUrl?: string;
  trackCount: number;
  editorMode?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  availableFrom?: string | null;
}

export const AlbumCard = ({ albumId, title, description, imageUrl, trackCount, editorMode, onEdit, onDelete, availableFrom }: AlbumCardProps) => {
  const navigate = useNavigate();
  
  const isAvailable = !availableFrom || new Date(availableFrom) <= new Date();
  const formattedDate = availableFrom ? new Date(availableFrom).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : null;

  return (
    <Card 
      className={`group overflow-hidden bg-card border-border transition-all duration-300 cursor-pointer ${
        isAvailable 
          ? 'hover:border-primary/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]' 
          : 'opacity-50 cursor-not-allowed'
      }`}
      onClick={() => !editorMode && isAvailable && navigate(`/album/${albumId}`)}
    >
      <div className="aspect-square relative overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="w-20 h-20 text-muted-foreground" />
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg text-foreground mb-1 line-clamp-1">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{description}</p>
        )}
        <p className="text-xs text-muted-foreground mb-1">
          {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
        </p>
        {!isAvailable && formattedDate && (
          <p className="text-xs text-primary font-medium mb-3">
            Available from {formattedDate}
          </p>
        )}
        {editorMode && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
              className="flex-1"
            >
              <Pencil className="w-3 h-3 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.();
              }}
              className="flex-1"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Delete
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};
