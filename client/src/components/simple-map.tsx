import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Phone, Mail } from "lucide-react";
import type { MooringLocation } from "@shared/schema";

interface SimpleMapProps {
  locations: MooringLocation[];
  onLocationSelect: (location: MooringLocation) => void;
}

export default function SimpleMap({ locations, onLocationSelect }: SimpleMapProps) {
  const [selectedRegion, setSelectedRegion] = useState<string>('');

  const regions = Array.from(new Set(locations.map(loc => loc.region))).sort();
  
  const filteredLocations = selectedRegion 
    ? locations.filter(loc => loc.region === selectedRegion)
    : locations;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'marina': return 'bg-green-100 text-green-800 border-green-200';
      case 'pier': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'jetty': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Region Filter */}
      <div className="bg-white border-b p-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedRegion === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedRegion('')}
          >
            All Regions ({locations.length})
          </Button>
          {regions.map(region => (
            <Button
              key={region}
              variant={selectedRegion === region ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRegion(region)}
            >
              {region} ({locations.filter(loc => loc.region === region).length})
            </Button>
          ))}
        </div>
      </div>

      {/* Locations Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredLocations.map((location) => (
              <div 
                key={location.id}
                className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 cursor-pointer group"
                onClick={() => onLocationSelect(location)}
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center">
                      <MapPin className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0" />
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {location.name}
                        </h3>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeColor(location.type)}`}>
                      {location.type}
                    </span>
                  </div>

                  {/* Location Details */}
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-600">
                      {location.address}, {location.county}
                    </p>
                    <p className="text-xs text-gray-500">
                      {location.region} • {location.capacity} berths • {location.depth}m depth
                    </p>
                  </div>

                  {/* Facilities */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {location.hasFuel && (
                      <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">Fuel</span>
                    )}
                    {location.hasWater && (
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">Water</span>
                    )}
                    {location.hasElectricity && (
                      <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded">Power</span>
                    )}
                    {location.hasShowers && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">Showers</span>
                    )}
                    {location.hasRestaurant && (
                      <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">Restaurant</span>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <div className="flex space-x-2">
                      {location.phone && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`tel:${location.phone}`);
                          }}
                        >
                          <Phone className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://maps.google.com?q=${location.latitude},${location.longitude}`);
                        }}
                      >
                        <Navigation className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLocationSelect(location);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredLocations.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
              <p className="text-gray-500">
                {selectedRegion 
                  ? `No mooring locations found in ${selectedRegion}` 
                  : 'No locations match your search criteria'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}