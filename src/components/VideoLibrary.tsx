
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Play, Clock, Eye } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
  uploadDate: string;
  tags: string[];
}

const mockVideos: Video[] = [
  {
    id: '1',
    title: 'Introduction to React Hooks - Complete Tutorial',
    thumbnail: '/placeholder.svg?height=120&width=200',
    duration: '15:32',
    views: '125K',
    uploadDate: '2 days ago',
    tags: ['React', 'JavaScript', 'Tutorial', 'Web Development']
  },
  {
    id: '2',
    title: 'Building Modern UIs with Tailwind CSS',
    thumbnail: '/placeholder.svg?height=120&width=200',
    duration: '22:18',
    views: '89K',
    uploadDate: '1 week ago',
    tags: ['CSS', 'Tailwind', 'UI Design', 'Frontend']
  },
  {
    id: '3',
    title: 'Advanced TypeScript Patterns for React',
    thumbnail: '/placeholder.svg?height=120&width=200',
    duration: '28:45',
    views: '67K',
    uploadDate: '2 weeks ago',
    tags: ['TypeScript', 'React', 'Advanced', 'Patterns']
  }
];

const VideoLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [videos] = useState<Video[]>(mockVideos);

  const filteredVideos = videos.filter(video =>
    video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    video.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredVideos.map((video) => (
          <Card key={video.id} className="group hover:shadow-md transition-shadow cursor-pointer border border-orange-100">
            <CardHeader className="p-0">
              <div className="relative">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  className="w-full h-32 object-cover rounded-t-lg"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                  <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                  {video.duration}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="text-sm font-medium mb-2 line-clamp-2">
                {video.title}
              </CardTitle>
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {video.views}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {video.uploadDate}
                </div>
              </div>
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
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVideos.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No videos found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default VideoLibrary;
