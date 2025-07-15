import { useEffect, useRef, useState } from "react";
import { MapPin, Navigation, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MooringLocation } from "@shared/schema";

interface ReliableMapProps {
  locations: MooringLocation[];
  isLoading: boolean;
  onLocationSelect: (location: MooringLocation) => void;
  onShowMobileFilter: () => void;
}

export default function ReliableMap({ 
  locations, 
  isLoading, 
  onLocationSelect, 
  onShowMobileFilter 
}: ReliableMapProps) {
  const [mapError, setMapError] = useState(false);
  const [LeafletComponents, setLeafletComponents] = useState<any>(null);

  useEffect(() => {
    // Dynamically import Leaflet components to avoid SSR issues
    const loadLeaflet = async () => {
      try {
        const { MapContainer, TileLayer, Marker, Popup } = await import('react-leaflet');
        const L = await import('leaflet');
        
        // Fix default markers
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        setLeafletComponents({ MapContainer, TileLayer, Marker, Popup, L });
      } catch (error) {
        console.error('Failed to load map:', error);
        setMapError(true);
      }
    };

    loadLeaflet();
  }, []);

  if (isLoading) {
    return (
      <main className="flex-1 relative bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading mooring locations...</p>
        </div>
      </main>
    );
  }

  if (mapError || !LeafletComponents) {
    return (
      <main className="flex-1 relative bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Map View Unavailable</h3>
            <p className="text-blue-700 mb-3">Interactive map is temporarily unavailable. Showing {locations.length} locations in list format:</p>
            <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700 text-white">
              Try Map Again
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((location) => (
              <div 
                key={location.id}
                className="bg-white rounded-lg shadow-sm border p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onLocationSelect(location)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-blue-600 mr-2" />
                    <h4 className="font-semibold text-gray-900">{location.name}</h4>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    location.type === 'marina' ? 'bg-green-100 text-green-800' :
                    location.type === 'pier' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {location.type}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{location.address}, {location.county}</p>
                <p className="text-xs text-gray-500 mb-3">{location.region} • {location.capacity} berths</p>
                
                <div className="flex justify-between items-center">
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
                    Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup } = LeafletComponents;

  return (
    <div className="w-full h-full">
      <MapContainer
        center={[53.3498, -6.2603]}
        zoom={7}
        style={{ 
          height: '100%', 
          width: '100%'
        }}
        className="w-full h-full"
        zoomControl={true}
        scrollWheelZoom={true}
        whenReady={() => {
          // Map will automatically size correctly on ready
        }}
      >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            minZoom={3}
            loading="eager"
          />
          
          {locations.map((location) => (
            <Marker
              key={location.id}
              position={[location.latitude, location.longitude]}
              eventHandlers={{
                click: () => onLocationSelect(location)
              }}
            >
              <Popup>
                <div className="text-center">
                  <h3 className="font-semibold">{location.name}</h3>
                  <p className="text-sm text-gray-600">{location.address}</p>
                  <div className="mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      location.type === 'marina' ? 'bg-green-100 text-green-800' :
                      location.type === 'pier' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {location.type}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
    </div>
  );
}