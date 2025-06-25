
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Search, Loader2, Download, FileText, Lightbulb } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const TheorySearch = () => {
  const [theory, setTheory] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    summary: string;
    rawData: string;
    videosAnalyzed: number;
  } | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!user || !theory.trim()) return;

    setLoading(true);
    try {
      console.log('Searching for theory:', theory);

      const { data, error } = await supabase.functions.invoke('parse-video-content', {
        body: {
          theory: theory.trim(),
          userId: user.id
        }
      });

      if (error) {
        console.error('Error calling parse-video-content function:', error);
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult({
        summary: data.summary,
        rawData: data.rawData,
        videosAnalyzed: data.videosAnalyzed || 0
      });

      toast({
        title: "Analysis Complete",
        description: data.message || "Theory analysis completed successfully",
      });

    } catch (error: any) {
      console.error('Error analyzing theory:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to analyze theory. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadRawData = () => {
    if (!result?.rawData) return;

    const blob = new Blob([result.rawData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${theory.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_raw_data.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded!",
      description: "Raw data file downloaded successfully",
    });
  };

  const downloadSummary = () => {
    if (!result?.summary) return;

    const blob = new Blob([result.summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${theory.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded!",
      description: "Summary downloaded successfully",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-orange-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-orange-600" />
            Theory Search
          </CardTitle>
          <p className="text-sm text-gray-600">
            Search through all your video transcripts to find information about a specific theory or topic.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label htmlFor="theory" className="block text-sm font-medium text-gray-700 mb-2">
                What theory or topic would you like to explore?
              </label>
              <Input
                id="theory"
                placeholder="e.g., quantum physics, machine learning, cooking techniques..."
                value={theory}
                onChange={(e) => setTheory(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading && theory.trim()) {
                    handleSearch();
                  }
                }}
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={loading || !theory.trim()}
              className="bg-orange-600 hover:bg-orange-700 w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Analyzing Transcripts...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search Theory
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4">
          <Card className="border-orange-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-600" />
                  Analysis Summary
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadSummary}
                    className="flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" />
                    Download Summary
                  </Button>
                  {result.rawData && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={downloadRawData}
                      className="flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" />
                      Download Raw Data
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Analyzed {result.videosAnalyzed} videos with transcripts
              </p>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {result.summary}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default TheorySearch;
