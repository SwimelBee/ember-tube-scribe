
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface YouTubeUrlInputProps {
  onVideoAdded: () => void;
}

const YouTubeUrlInput = ({ onVideoAdded }: YouTubeUrlInputProps) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const extractVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim() || !user) return;
    
    const videoId = extractVideoId(url);
    if (!videoId) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    try {
      console.log('Fetching video metadata for:', videoId);
      
      // Call the edge function to fetch video metadata
      const { data, error } = await supabase.functions.invoke('fetch-youtube-video', {
        body: { videoId, userId: user.id }
      });

      if (error) throw error;

      toast({
        title: "Video Added!",
        description: `"${data.title}" has been added to your library`,
      });
      
      setUrl('');
      onVideoAdded();
    } catch (error: any) {
      console.error('Error adding video:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add video to library",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        type="url"
        placeholder="Paste YouTube URL here..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="flex-1"
      />
      <Button 
        type="submit" 
        disabled={loading || !user}
        className="bg-orange-600 hover:bg-orange-700"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
      </Button>
    </form>
  );
};

export default YouTubeUrlInput;
