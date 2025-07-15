import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { Copy, Share2, Check, MapPin } from 'lucide-react';
import type { MooringLocation } from '@shared/schema';

interface RouteSharingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedLocations: MooringLocation[];
  onClearRoute: () => void;
}

export default function RouteSharingModal({
  isOpen,
  onClose,
  selectedLocations,
  onClearRoute
}: RouteSharingModalProps) {
  const [routeName, setRouteName] = useState('');
  const [routeDescription, setRouteDescription] = useState('');
  const [shareUrl, setShareUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const createRouteMutation = useMutation({
    mutationFn: async (routeData: any) => {
      const response = await apiRequest('POST', '/api/maritime-routes', routeData);
      return response.json();
    },
    onSuccess: (data) => {
      const url = `${window.location.origin}/route/${data.shareId}`;
      setShareUrl(url);
      toast({
        title: "Route Created!",
        description: "Your maritime route has been created and is ready to share.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error Creating Route",
        description: "Failed to create maritime route. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateRoute = () => {
    if (!routeName.trim()) {
      toast({
        title: "Route Name Required",
        description: "Please enter a name for your route.",
        variant: "destructive",
      });
      return;
    }

    if (selectedLocations.length < 2) {
      toast({
        title: "More Locations Needed",
        description: "Please select at least 2 locations to create a route.",
        variant: "destructive",
      });
      return;
    }

    const routeData = {
      name: routeName,
      description: routeDescription,
      startLocationId: selectedLocations[0].id,
      endLocationId: selectedLocations[selectedLocations.length - 1].id,
      waypoints: selectedLocations.map((location, index) => ({
        locationId: location.id,
        order: index,
        name: location.name,
        coordinates: [location.longitude, location.latitude] as [number, number],
      })),
      isPublic: isPublic,
    };

    createRouteMutation.mutate(routeData);
  };

  const handleCopyUrl = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "URL Copied!",
        description: "The route URL has been copied to your clipboard.",
        variant: "default",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy URL. Please copy it manually.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setRouteName('');
    setRouteDescription('');
    setShareUrl('');
    setCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Maritime Route
          </DialogTitle>
          <DialogDescription>
            Create a shareable link for your selected maritime route
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Selected locations preview */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Selected Locations ({selectedLocations.length})</h4>
            <div className="space-y-1">
              {selectedLocations.map((location, index) => (
                <div key={location.id} className="flex items-center gap-2 text-sm">
                  <MapPin className="h-3 w-3 text-blue-600" />
                  <span className="font-medium">{index + 1}.</span>
                  <span>{location.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {location.type}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {!shareUrl ? (
            <>
              {/* Route creation form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="routeName">Route Name *</Label>
                  <Input
                    id="routeName"
                    value={routeName}
                    onChange={(e) => setRouteName(e.target.value)}
                    placeholder="e.g., Dublin to Cork Coastal Route"
                  />
                </div>

                <div>
                  <Label htmlFor="routeDescription">Description (Optional)</Label>
                  <Textarea
                    id="routeDescription"
                    value={routeDescription}
                    onChange={(e) => setRouteDescription(e.target.value)}
                    placeholder="Describe your route, points of interest, or sailing conditions..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="isPublic" className="text-sm">
                    Make route publicly discoverable
                  </Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreateRoute}
                  disabled={createRouteMutation.isPending}
                  className="flex-1"
                >
                  {createRouteMutation.isPending ? "Creating..." : "Create Route"}
                </Button>
                <Button variant="outline" onClick={onClearRoute}>
                  Clear Route
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Share URL display */}
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Route Created Successfully!</h4>
                  <p className="text-sm text-green-800">
                    Share this URL with others to let them view your maritime route:
                  </p>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    onClick={handleCopyUrl}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleClose} className="flex-1">
                    Done
                  </Button>
                  <Button variant="outline" onClick={onClearRoute}>
                    Create Another Route
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}