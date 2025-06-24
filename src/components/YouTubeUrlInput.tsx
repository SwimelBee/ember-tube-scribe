
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface YouTubeUrlInputProps {
  onVideoAdded: () => void;
}

const YouTubeUrlInput = ({ onVideoAdded }: YouTubeUrlInputProps) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const extractVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
    const match = url.match(regex);
    return match ? match[1] : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) return;
    
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
      // Simulate API call to add video
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Video Added!",
        description: "YouTube video has been added to your library",
      });
      
      setUrl('');
      onVideoAdded();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add video to library",
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
        disabled={loading}
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
