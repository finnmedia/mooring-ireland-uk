import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L, { divIcon } from "leaflet";
import { renderToString } from "react-dom/server";
import { Plus, Minus, Crosshair, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Anchor, Ship, Waves } from "lucide-react";
import type { MooringLocation } from "@shared/schema";
import "leaflet/dist/leaflet.css";

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  locations: MooringLocation[];
  isLoading: boolean;
  onLocationSelect: (location: MooringLocation) => void;
  onShowMobileFilter: () => void;
}

export default function MapView({ 
  locations, 
  isLoading, 
  onLocationSelect, 
  onShowMobileFilter 
}: MapViewProps) {
  const mapRef = useRef<any>(null);
  const [mapKey, setMapKey] = useState(0);
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // Show fallback after 10 seconds if map hasn't loaded
    const timer = setTimeout(() => setShowFallback(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  const createCustomIcon = (type: string) => {
    const iconColor = type === 'marina' ? '#10b981' : 
                     type === 'pier' ? '#3b82f6' : '#8b5cf6';
    
    const IconComponent = type === 'marina' ? Anchor : 
                         type === 'pier' ? Ship : Waves;

    const iconHtml = renderToString(
      <div 
        className="custom-marker"
        style={{
          backgroundColor: iconColor,
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          border: '2px solid white',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}
      >
        <IconComponent size={16} />
      </div>
    );

    return divIcon({
      html: iconHtml,
      className: 'custom-div-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  };

  const centerLat = 53.3498;
  const centerLng = -6.2603;

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

  // Remove the duplicate state and effect that was causing the hooks error

  // If map fails to load after 3 seconds, show a fallback message
  if (showFallback) {
    return (
      <main className="flex-1 relative bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Map Loading</h3>
            <p className="text-blue-700 mb-4">The interactive map is loading. You can switch to List view to browse {locations.length} locations while waiting.</p>
            <Button onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700 text-white mr-2">
              Refresh
            </Button>
            <Button onClick={() => setShowFallback(false)} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 relative">
      {/* Mobile Search - removed as it's handled by header */}

      {/* Map Container */}
      <div className="h-full w-full relative" style={{ height: 'calc(100vh - 64px)' }}>
        <MapContainer
          key={mapKey}
          center={[centerLat, centerLng]}
          zoom={7}
          style={{ height: '100%', width: '100%' }}
          className="h-full w-full"
          ref={mapRef}
          whenCreated={(map) => {
            // Reset fallback since map loaded successfully
            setShowFallback(false);
            // Force map to recalculate size
            setTimeout(() => {
              map.invalidateSize();
            }, 100);
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {locations.map((location) => (
            <Marker
              key={location.id}
              position={[location.latitude, location.longitude]}
              icon={createCustomIcon(location.type)}
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

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 space-y-2">
        <Button
          variant="outline"
          size="icon"
          className="bg-white shadow-md"
          onClick={() => mapRef.current?.setZoom(mapRef.current.getZoom() + 1)}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-white shadow-md"
          onClick={() => mapRef.current?.setZoom(mapRef.current.getZoom() - 1)}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-white shadow-md"
          onClick={() => mapRef.current?.setView([centerLat, centerLng], 7)}
        >
          <Crosshair className="h-4 w-4" />
        </Button>
      </div>

      {/* Mobile Filter Toggle */}
      <Button
        className="lg:hidden fixed bottom-20 left-4 bg-blue-600 hover:bg-blue-700 z-20 rounded-full shadow-lg"
        size="lg"
        onClick={onShowMobileFilter}
      >
        <Filter className="h-5 w-5" />
      </Button>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10">
        <h4 className="font-medium text-gray-900 mb-3 text-sm">Legend</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded-full mr-2 flex items-center justify-center">
              <Anchor className="h-2 w-2 text-white" />
            </div>
            <span className="text-gray-600">Marina</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full mr-2 flex items-center justify-center">
              <Ship className="h-2 w-2 text-white" />
            </div>
            <span className="text-gray-600">Pier</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-purple-500 rounded-full mr-2 flex items-center justify-center">
              <Waves className="h-2 w-2 text-white" />
            </div>
            <span className="text-gray-600">Jetty</span>
          </div>
        </div>
      </div>
    </main>
  );
}
