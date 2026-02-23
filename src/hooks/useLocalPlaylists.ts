import { useState, useEffect, useCallback } from "react";
import { Track, Album } from "@/contexts/PlayerContext";

export interface LocalPlaylist {
  id: string;
  name: string;
  description?: string;
  tracks: {
    track: Track;
    album: Album;
  }[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "gyros15_playlists";

const generateId = () => Math.random().toString(36).substring(2, 15);

export const useLocalPlaylists = () => {
  const [playlists, setPlaylists] = useState<LocalPlaylist[]>([]);
  const [loading, setLoading] = useState(true);

  // Load playlists from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPlaylists(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load playlists:", error);
    }
    setLoading(false);
  }, []);

  // Save playlists to localStorage
  const savePlaylists = useCallback((newPlaylists: LocalPlaylist[]) => {
    setPlaylists(newPlaylists);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPlaylists));
    } catch (error) {
      console.error("Failed to save playlists:", error);
    }
  }, []);

  const createPlaylist = useCallback((name: string, description?: string): LocalPlaylist => {
    const now = new Date().toISOString();
    const newPlaylist: LocalPlaylist = {
      id: generateId(),
      name,
      description,
      tracks: [],
      createdAt: now,
      updatedAt: now,
    };
    savePlaylists([...playlists, newPlaylist]);
    return newPlaylist;
  }, [playlists, savePlaylists]);

  const updatePlaylist = useCallback((id: string, updates: Partial<Pick<LocalPlaylist, 'name' | 'description'>>) => {
    const updated = playlists.map(p => 
      p.id === id 
        ? { ...p, ...updates, updatedAt: new Date().toISOString() } 
        : p
    );
    savePlaylists(updated);
  }, [playlists, savePlaylists]);

  const deletePlaylist = useCallback((id: string) => {
    savePlaylists(playlists.filter(p => p.id !== id));
  }, [playlists, savePlaylists]);

  const addTrackToPlaylist = useCallback((playlistId: string, track: Track, album: Album) => {
    const updated = playlists.map(p => {
      if (p.id !== playlistId) return p;
      // Check if track already exists
      if (p.tracks.some(t => t.track.id === track.id)) return p;
      return {
        ...p,
        tracks: [...p.tracks, { track, album }],
        updatedAt: new Date().toISOString(),
      };
    });
    savePlaylists(updated);
  }, [playlists, savePlaylists]);

  const removeTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    const updated = playlists.map(p => {
      if (p.id !== playlistId) return p;
      return {
        ...p,
        tracks: p.tracks.filter(t => t.track.id !== trackId),
        updatedAt: new Date().toISOString(),
      };
    });
    savePlaylists(updated);
  }, [playlists, savePlaylists]);

  const reorderTracks = useCallback((playlistId: string, fromIndex: number, toIndex: number) => {
    const updated = playlists.map(p => {
      if (p.id !== playlistId) return p;
      const newTracks = [...p.tracks];
      const [removed] = newTracks.splice(fromIndex, 1);
      newTracks.splice(toIndex, 0, removed);
      return {
        ...p,
        tracks: newTracks,
        updatedAt: new Date().toISOString(),
      };
    });
    savePlaylists(updated);
  }, [playlists, savePlaylists]);

  const getPlaylist = useCallback((id: string) => {
    return playlists.find(p => p.id === id);
  }, [playlists]);

  return {
    playlists,
    loading,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    reorderTracks,
    getPlaylist,
  };
};
