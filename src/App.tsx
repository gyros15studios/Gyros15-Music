import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { MiniPlayer } from "@/components/MiniPlayer";
import Index from "./pages/Index";
import AlbumDetail from "./pages/AlbumDetail";
import Playlists from "./pages/Playlists";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PlayerProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/album/:albumId" element={<AlbumDetail />} />
            <Route path="/playlists" element={<Playlists />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <MiniPlayer />
        </BrowserRouter>
      </PlayerProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
