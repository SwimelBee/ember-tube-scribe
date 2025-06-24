
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Youtube } from 'lucide-react';

interface YouTubeChannelInputProps {
  onChannelAdded: () => void;
}

const YouTubeChannelInput = ({ onChannelAdded }: YouTubeChannelInputProps) => {
  const [channelUrl, setChannelUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const extractChannelId = (url: string): string | null => {
    const patterns = [
      /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/user\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/@([a-zA-Z0-9_-]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !channelUrl.trim()) return;

    setLoading(true);
    try {
      const channelId = extractChannelId(channelUrl);
      if (!channelId) {
        throw new Error('Invalid YouTube channel URL format');
      }

      console.log('Fetching videos for channel:', channelId);
      
      // Call the edge function to fetch channel videos
      const { data, error } = await supabase.functions.invoke('fetch-youtube-channel', {
        body: { channelId, userId: user.id }
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Added ${data.videoCount} videos from the channel to your library.`,
      });

      setChannelUrl('');
      onChannelAdded();
    } catch (error: any) {
      console.error('Error adding channel:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add channel videos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="channel-url">YouTube Channel URL</Label>
        <Input
          id="channel-url"
          type="url"
          value={channelUrl}
          onChange={(e) => setChannelUrl(e.target.value)}
          placeholder="https://www.youtube.com/@channelname or https://www.youtube.com/channel/UCxxxxxx"
          required
        />
      </div>
      <Button
        type="submit"
        disabled={loading || !channelUrl.trim()}
        className="w-full bg-orange-600 hover:bg-orange-700"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Fetching Videos...
          </>
        ) : (
          <>
            <Youtube className="w-4 h-4 mr-2" />
            Add All Channel Videos
          </>
        )}
      </Button>
    </form>
  );
};

export default YouTubeChannelInput;
