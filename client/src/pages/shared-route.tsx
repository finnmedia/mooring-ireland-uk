import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Calendar, Eye, User, Share2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { MaritimeRoute } from '@shared/schema';
import { Link } from 'wouter';

export default function SharedRoute() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [shareId, setShareId] = useState<string>('');

  // Extract shareId from URL
  useEffect(() => {
    const path = window.location.pathname;
    const id = path.split('/').pop();
    if (id) {
      setShareId(id);
    }
  }, []);

  const { data: route, isLoading, error } = useQuery({
    queryKey: ['/api/maritime-routes', shareId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/maritime-routes/${shareId}`);
      return response.json() as Promise<MaritimeRoute>;
    },
    enabled: !!shareId,
  });

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Maritime Route: ${route?.name}`,
          text: route?.description || 'Check out this maritime route',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "URL Copied!",
          description: "The route URL has been copied to your clipboard.",
          variant: "default",
        });
      }
    } catch (err) {
      toast({
        title: "Share Failed",
        description: "Failed to share route. Please copy the URL manually.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p>Loading maritime route...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Route Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              This maritime route doesn't exist or has been removed.
            </p>
            <Link href="/">
              <Button className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to App
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to App
              </Button>
            </Link>
            <Button onClick={handleShare} size="sm">
              <Share2 className="w-4 h-4 mr-2" />
              Share Route
            </Button>
          </div>
          
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{route.name}</h1>
                {route.description && (
                  <p className="text-gray-600 mb-4">{route.description}</p>
                )}
              </div>
              <Badge variant="secondary">
                <Eye className="w-3 h-3 mr-1" />
                {route.viewCount} views
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Created {new Date(route.createdAt).toLocaleDateString()}
              </div>
              {route.createdById && (
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  Created by user
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Route Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Waypoints */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Route Waypoints ({route.waypoints?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {route.waypoints?.map((waypoint, index) => (
                    <div key={waypoint.locationId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{waypoint.name}</h4>
                        <p className="text-sm text-gray-500">
                          {waypoint.coordinates[1].toFixed(4)}, {waypoint.coordinates[0].toFixed(4)}
                        </p>
                      </div>
                      {index === 0 && (
                        <Badge variant="secondary" className="text-xs">Start</Badge>
                      )}
                      {index === route.waypoints!.length - 1 && (
                        <Badge variant="secondary" className="text-xs">End</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Route Info */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Route Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Route Type</p>
                  <p className="text-sm text-gray-600">Maritime Navigation</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Total Waypoints</p>
                  <p className="text-sm text-gray-600">{route.waypoints?.length || 0} locations</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Visibility</p>
                  <Badge variant={route.isPublic ? "default" : "secondary"}>
                    {route.isPublic ? "Public" : "Private"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Share ID</p>
                  <p className="text-xs text-gray-500 font-mono">{route.shareId}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Use This Route</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Want to explore these locations? Visit the main app to see detailed information about each marina and facility.
                </p>
                <Link href="/">
                  <Button className="w-full">
                    Open in Main App
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}