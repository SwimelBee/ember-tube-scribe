
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, ExternalLink, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DeploymentHelper = () => {
  const [cloudRunUrl, setCloudRunUrl] = useState('');
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "URL copied to clipboard",
    });
  };

  const supabaseProjectId = 'hrhnqwuyhotiswryzgqa';
  
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Deployment Configuration Helper
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="cloud-run-url">Your Cloud Run URL</Label>
            <Input
              id="cloud-run-url"
              placeholder="https://youtube-ai-assistant-xxx-uc.a.run.app"
              value={cloudRunUrl}
              onChange={(e) => setCloudRunUrl(e.target.value)}
            />
            <p className="text-sm text-gray-600">
              Enter your Cloud Run URL here after deployment to get the exact Supabase configuration steps.
            </p>
          </div>

          {cloudRunUrl && (
            <div className="space-y-4 p-4 bg-orange-50 rounded-lg">
              <h3 className="font-semibold text-orange-800">Required Supabase Updates:</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <p className="font-medium">Site URL</p>
                    <p className="text-sm text-gray-600">{cloudRunUrl}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(cloudRunUrl)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <p className="font-medium">Redirect URLs</p>
                    <p className="text-sm text-gray-600">{cloudRunUrl}/**</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(`${cloudRunUrl}/**`)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => window.open(`https://supabase.com/dashboard/project/${supabaseProjectId}/auth/url-configuration`, '_blank')}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Supabase URL Config
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => window.open(`https://supabase.com/dashboard/project/${supabaseProjectId}/settings/api`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  CORS Settings
                </Button>
              </div>
            </div>
          )}

          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Deployment Commands:</h3>
            <div className="space-y-2 text-sm font-mono">
              <div className="flex items-center justify-between p-2 bg-white rounded">
                <span>chmod +x deploy.sh && ./deploy.sh</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard('chmod +x deploy.sh && ./deploy.sh')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeploymentHelper;
