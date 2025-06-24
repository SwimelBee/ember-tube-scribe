
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Video, Search, Plus } from 'lucide-react';
import YouTubeUrlInput from '@/components/YouTubeUrlInput';
import AIChat from '@/components/AIChat';
import VideoLibrary from '@/components/VideoLibrary';

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
            Chat with AI about your YouTube content, add videos to your library, and search through your collection by topic.
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-md">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="chat">AI Chat</TabsTrigger>
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="add">Add Video</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-orange-100">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-orange-600" />
                    </div>
                    <CardTitle className="text-lg">AI Chat</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Ask questions and get AI-powered responses about your YouTube content and topics.
                  </p>
                  <Button 
                    onClick={() => switchToTab('chat')}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    Start Chatting
                  </Button>
                </CardContent>
              </Card>

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
                    Browse and search through your curated YouTube video collection.
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

            <Card className="border-orange-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-orange-600" />
                  Quick Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Search through your YouTube collection by topic, content, or keywords.</p>
                <div className="flex gap-2">
                  <input 
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Search your videos..."
                  />
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <Card className="border-orange-100">
              <CardContent className="p-6">
                <AIChat />
              </CardContent>
            </Card>
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

          <TabsContent value="add">
            <Card className="border-orange-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-orange-600" />
                  Add YouTube Video
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  Paste a YouTube URL below to add it to your library. We'll automatically extract the title, description, and other metadata.
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
