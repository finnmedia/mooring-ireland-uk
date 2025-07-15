import { MapPin, Star, Phone, Mail, ExternalLink, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MooringLocation } from "@shared/schema";

interface LocationListProps {
  locations: MooringLocation[];
  isLoading: boolean;
  onLocationSelect: (location: MooringLocation) => void;
}

export default function LocationList({ locations, isLoading, onLocationSelect }: LocationListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg mb-2">No locations found</p>
        <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-4 px-4 pb-8">
      {locations.map((location) => (
        <Card 
          key={location.id} 
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onLocationSelect(location)}
        >
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header with optional thumbnail */}
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-lg leading-tight truncate">
                    {location.name}
                  </h3>
                  <div className="flex items-center text-gray-500 text-sm mt-1">
                    <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">{location.address}</span>
                  </div>
                </div>
                
                <Badge 
                  variant="secondary" 
                  className="ml-2 flex-shrink-0 text-xs"
                >
                  {location.type}
                </Badge>
              </div>

              {/* Berths and Depth Info */}
              <div className="flex gap-4 text-sm">
                {location.berths && (
                  <div className="flex items-center text-blue-600">
                    <Star className="h-3 w-3 mr-1" />
                    <span className="font-medium">{location.berths} berths</span>
                  </div>
                )}
                {location.depth && (
                  <div className="flex items-center text-blue-600">
                    <span className="font-medium">{location.depth}m depth</span>
                  </div>
                )}
              </div>

              {/* Description Preview */}
              {location.description && (
                <p className="text-gray-600 text-sm line-clamp-2">
                  {location.description}
                </p>
              )}

              {/* Contact Actions */}
              <div className="flex gap-2 pt-2">
                {location.phone && location.phone.includes("💰") ? (
                  <Button size="sm" variant="outline" className="flex-1 text-orange-600 border-orange-200 hover:bg-orange-50">
                    <Crown className="h-3 w-3 mr-1" />
                    Call
                  </Button>
                ) : location.phone ? (
                  <Button size="sm" variant="outline" className="flex-1" asChild>
                    <a href={`tel:${location.phone}`}>
                      <Phone className="h-3 w-3 mr-1" />
                      Call
                    </a>
                  </Button>
                ) : null}

                {location.email && location.email.includes("💰") ? (
                  <Button size="sm" variant="outline" className="flex-1 text-orange-600 border-orange-200 hover:bg-orange-50">
                    <Crown className="h-3 w-3 mr-1" />
                    Email
                  </Button>
                ) : location.email ? (
                  <Button size="sm" variant="outline" className="flex-1" asChild>
                    <a href={`mailto:${location.email}`}>
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </a>
                  </Button>
                ) : null}

                {location.website && location.website.includes("💰") ? (
                  <Button size="sm" variant="outline" className="flex-1 text-orange-600 border-orange-200 hover:bg-orange-50">
                    <Crown className="h-3 w-3 mr-1" />
                    Visit
                  </Button>
                ) : location.website ? (
                  <Button size="sm" variant="outline" className="flex-1" asChild>
                    <a href={location.website} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Visit
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}