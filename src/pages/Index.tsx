
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Search, Plus, Youtube } from 'lucide-react';
import YouTubeUrlInput from '@/components/YouTubeUrlInput';
import YouTubeChannelInput from '@/components/YouTubeChannelInput';
import VideoLibrary from '@/components/VideoLibrary';
import TheorySearch from '@/components/TheorySearch';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="text-orange-600">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleVideoAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const switchToTab = (tabValue: string) => {
    const tabElement = document.querySelector(`[value="${tabValue}"]`) as HTMLElement;
    if (tabElement) {
      tabElement.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      <Header />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            YouTube AI Assistant
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl">
            Add videos to your library, search through your collection with AI, and analyze theories across your videos.
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-lg">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="theory">Theory</TabsTrigger>
            <TabsTrigger value="add">Add Content</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-orange-100">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Video className="w-5 h-5 text-orange-600" />
                    </div>
                    <CardTitle className="text-lg">Video Library</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Browse and search through your curated YouTube video collection with AI-powered search.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => switchToTab('library')}
                    className="border-orange-200 text-orange-600 hover:bg-orange-50"
                  >
                    Browse Library
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-orange-100">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Search className="w-5 h-5 text-orange-600" />
                    </div>
                    <CardTitle className="text-lg">Theory Search</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Analyze your video transcripts to find information about specific theories or topics.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => switchToTab('theory')}
                    className="border-orange-200 text-orange-600 hover:bg-orange-50"
                  >
                    Search Theories
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-orange-100">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <Plus className="w-5 h-5 text-orange-600" />
                    </div>
                    <CardTitle className="text-lg">Add Videos</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Add YouTube URLs to your library and extract metadata, transcripts, and more.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => switchToTab('add')}
                    className="border-orange-200 text-orange-600 hover:bg-orange-50"
                  >
                    Add Video
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="library">
            <Card className="border-orange-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-orange-600" />
                  Your Video Library
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VideoLibrary key={refreshTrigger} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="theory">
            <Card className="border-orange-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-orange-600" />
                  Theory & Topic Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TheorySearch />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="add">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-orange-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-orange-600" />
                    Add Single Video
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    Paste a YouTube URL below to add a single video to your library.
                  </p>
                  <YouTubeUrlInput onVideoAdded={handleVideoAdded} />
                  
                  <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Supported formats:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• https://www.youtube.com/watch?v=VIDEO_ID</li>
                      <li>• https://youtu.be/VIDEO_ID</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-orange-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Youtube className="w-5 h-5 text-orange-600" />
                    Add Entire Channel
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    Add all videos from a YouTube channel to your library at once.
                  </p>
                  <YouTubeChannelInput onChannelAdded={handleVideoAdded} />
                  
                  <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Supported formats:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• https://www.youtube.com/@channelname</li>
                      <li>• https://www.youtube.com/channel/UCxxxxxx</li>
                      <li>• https://www.youtube.com/c/channelname</li>
                      <li>• https://www.youtube.com/user/username</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
