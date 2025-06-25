import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Play, Clock, Eye, Loader2, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import TranscriptModal from './TranscriptModal';

interface Video {
  id: string;
  video_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  duration: string;
  view_count: number;
  like_count: number;
  published_at: string;
  channel_title: string;
  tags: string[];
  transcript: string | null;
}

const VideoLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [transcriptModal, setTranscriptModal] = useState<{
    isOpen: boolean;
    videoTitle: string;
    transcript: string;
  }>({
    isOpen: false,
    videoTitle: '',
    transcript: '',
  });
  const [transcribingVideos, setTranscribingVideos] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchVideos = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Fetching videos for user:', user.id);

      const { data, error } = await supabase
        .from('youtube_videos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching videos:', error);
        throw error;
      }

      console.log('Fetched videos:', data?.length || 0);
      setVideos(data || []);
    } catch (error: any) {
      console.error('Error loading videos:', error);
      toast({
        title: "Error",
        description: "Failed to load your video library",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [user]);

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
    video.channel_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDuration = (duration: string) => {
    // Convert ISO 8601 duration (PT1H2M3S) to readable format
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;
    
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatViewCount = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months ago`;
    return `${Math.ceil(diffDays / 365)} years ago`;
  };

  const openVideo = (videoId: string) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  };

  const generateTranscript = async (video: Video) => {
    if (!user) return;

    setTranscribingVideos(prev => new Set(prev).add(video.video_id));

    try {
      console.log('Generating transcript for video:', video.video_id);

      const { data, error } = await supabase.functions.invoke('transcribe-video', {
        body: {
          videoId: video.video_id,
          userId: user.id
        }
      });

      if (error) {
        console.error('Error calling transcribe function:', error);
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Update local state
      setVideos(prevVideos => 
        prevVideos.map(v => 
          v.video_id === video.video_id 
            ? { ...v, transcript: data.transcript }
            : v
        )
      );

      toast({
        title: "Success",
        description: data.message || "Transcript generated successfully",
      });

      // Show transcript modal
      setTranscriptModal({
        isOpen: true,
        videoTitle: video.title,
        transcript: data.transcript,
      });

    } catch (error: any) {
      console.error('Error generating transcript:', error);
      
      toast({
        title: "Error",
        description: "Failed to generate transcript. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTranscribingVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(video.video_id);
        return newSet;
      });
    }
  };

  const showTranscript = (video: Video) => {
    if (video.transcript) {
      setTranscriptModal({
        isOpen: true,
        videoTitle: video.title,
        transcript: video.transcript,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
        <span className="ml-2 text-gray-600">Loading your videos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search your video library..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {videos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No videos in your library yet</p>
          <p className="text-sm">Add some YouTube videos to get started!</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVideos.map((video) => (
            <Card 
              key={video.id} 
              className="group hover:shadow-md transition-shadow border border-orange-100"
            >
              <CardHeader className="p-0">
                <div className="relative cursor-pointer" onClick={() => openVideo(video.video_id)}>
                  <img
                    src={video.thumbnail_url || '/placeholder.svg?height=120&width=200'}
                    alt={video.title}
                    className="w-full h-32 object-cover rounded-t-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg?height=120&width=200';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                    <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                    {formatDuration(video.duration)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="text-sm font-medium mb-2 line-clamp-2">
                  {video.title}
                </CardTitle>
                <p className="text-xs text-gray-600 mb-2">{video.channel_title}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {formatViewCount(video.view_count)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(video.published_at)}
                  </div>
                </div>

                <div className="flex gap-2 mb-3">
                  {video.transcript ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => showTranscript(video)}
                      className="flex items-center gap-1 text-xs"
                    >
                      <FileText className="w-3 h-3" />
                      View Transcript
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => generateTranscript(video)}
                      disabled={transcribingVideos.has(video.video_id)}
                      className="flex items-center gap-1 text-xs bg-orange-600 hover:bg-orange-700"
                    >
                      {transcribingVideos.has(video.video_id) ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Transcribing...
                        </>
                      ) : (
                        <>
                          <FileText className="w-3 h-3" />
                          Generate Transcript
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {video.tags && video.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {video.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {video.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{video.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredVideos.length === 0 && videos.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No videos found matching your search.</p>
        </div>
      )}

      <TranscriptModal
        isOpen={transcriptModal.isOpen}
        onClose={() => setTranscriptModal({ isOpen: false, videoTitle: '', transcript: '' })}
        videoTitle={transcriptModal.videoTitle}
        transcript={transcriptModal.transcript}
      />
    </div>
  );
};

export default VideoLibrary;
