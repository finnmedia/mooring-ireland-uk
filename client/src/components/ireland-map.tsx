import { useEffect, useRef } from 'react';
import type { MooringLocation } from '@shared/schema';

interface IrelandMapProps {
  locations: MooringLocation[];
  onLocationSelect: (location: MooringLocation) => void;
  searchQuery?: string;
  focusLocation?: MooringLocation | null;
}

export default function IrelandMap({ locations, onLocationSelect, searchQuery, focusLocation }: IrelandMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    // Import Leaflet dynamically to avoid SSR issues
    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default;
        
        // Fix for default markers
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });

        if (mapRef.current && !mapInstanceRef.current) {
          // Create the map centered on Ireland
          const map = L.map(mapRef.current, {
            center: [53.41291, -8.24389], // Center of Ireland
            zoom: 7,
            zoomControl: false, // We'll add it back with custom position
            scrollWheelZoom: true,
          });

          // Add zoom control in bottom right to avoid header overlap
          L.control.zoom({
            position: 'bottomright'
          }).addTo(map);

          // Add OpenStreetMap tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
          }).addTo(map);

          mapInstanceRef.current = map;
        }
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    initMap();

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          console.error('Error cleaning up map:', error);
        } finally {
          mapInstanceRef.current = null;
        }
      }
    };
  }, []); // Only run once on mount

  // Separate effect for updating markers when locations change
  useEffect(() => {
    const updateMarkers = async () => {
      if (!mapInstanceRef.current || !locations.length) return;
      
      try {
        const L = (await import('leaflet')).default;
        const map = mapInstanceRef.current;

        // Clear existing markers
        map.eachLayer((layer: any) => {
          if (layer instanceof L.Marker) {
            map.removeLayer(layer);
          }
        });

        // Add new markers
        const markers: any[] = [];
        locations.forEach((location) => {
          const marker = L.marker([location.latitude, location.longitude])
            .addTo(map)
            .bindPopup(`
              <div style="text-align: center;">
                <h3 style="margin: 0 0 8px 0; font-weight: bold;">${location.name}</h3>
                <p style="margin: 0 0 8px 0; color: #666;">${location.address}</p>
                <span style="
                  padding: 4px 8px; 
                  border-radius: 12px; 
                  font-size: 12px; 
                  font-weight: 500;
                  background: ${location.type === 'marina' ? '#dcfce7' : location.type === 'pier' ? '#dbeafe' : '#f3e8ff'};
                  color: ${location.type === 'marina' ? '#166534' : location.type === 'pier' ? '#1e40af' : '#7c3aed'};
                ">${location.type}</span>
              </div>
            `)
            .on('click', () => {
              // Zoom to the clicked location
              map.setView([location.latitude, location.longitude], 12);
              onLocationSelect(location);
            });
          markers.push(marker);
        });

        // Handle search results by focusing on them
        if (searchQuery && searchQuery.trim() && markers.length > 0 && markers.length <= 10) {
          // If search results are limited, focus on them with more padding for better context
          const group = new L.featureGroup(markers);
          const bounds = group.getBounds();
          
          // Use fitBounds with padding for better context
          map.fitBounds(bounds.pad(0.2), {
            maxZoom: 15  // Zoom in much closer for detailed view
          });
        } else if (markers.length > 0 && !map._hasFitBounds) {
          // Only fit bounds on initial load for all locations
          const group = new L.featureGroup(markers);
          map.fitBounds(group.getBounds().pad(0.1));
          map._hasFitBounds = true;
        }
      } catch (error) {
        console.error('Error updating markers:', error);
      }
    };

    updateMarkers();
  }, [locations, onLocationSelect, searchQuery]);

  // Effect to focus on a specific location when selected from search
  useEffect(() => {
    const focusOnLocation = async () => {
      if (!mapInstanceRef.current || !focusLocation) return;
      
      try {
        const L = (await import('leaflet')).default;
        const map = mapInstanceRef.current;
        
        // Zoom to the selected location with a good zoom level
        map.setView([focusLocation.latitude, focusLocation.longitude], 15, {
          animate: true,
          duration: 1.0
        });
        
        // Find and open the popup for this location
        map.eachLayer((layer: any) => {
          if (layer instanceof L.Marker) {
            const latlng = layer.getLatLng();
            if (Math.abs(latlng.lat - focusLocation.latitude) < 0.0001 && 
                Math.abs(latlng.lng - focusLocation.longitude) < 0.0001) {
              // Small delay to ensure map has finished animating
              setTimeout(() => {
                layer.openPopup();
              }, 500);
            }
          }
        });
      } catch (error) {
        console.error('Error focusing on location:', error);
      }
    };

    focusOnLocation();
  }, [focusLocation]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full"
      style={{ minHeight: '400px' }}
    />
  );
}