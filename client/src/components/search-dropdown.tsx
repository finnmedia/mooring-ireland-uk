import { useState, useEffect, useRef } from 'react';
import { MooringLocation } from '@shared/schema';
import { MapPin, Anchor } from 'lucide-react';

interface SearchDropdownProps {
  searchQuery: string;
  locations: MooringLocation[];
  onLocationSelect: (location: MooringLocation) => void;
  isVisible: boolean;
  onClose: () => void;
}

export default function SearchDropdown({ 
  searchQuery, 
  locations, 
  onLocationSelect, 
  isVisible, 
  onClose 
}: SearchDropdownProps) {
  const [filteredLocations, setFilteredLocations] = useState<MooringLocation[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchQuery.trim() || !isVisible) {
      setFilteredLocations([]);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = locations
      .filter(location =>
        location.name.toLowerCase().includes(query) ||
        location.address.toLowerCase().includes(query) ||
        location.county.toLowerCase().includes(query) ||
        location.region.toLowerCase().includes(query)
      )
      .slice(0, 8); // Limit to 8 results

    setFilteredLocations(filtered);
  }, [searchQuery, locations, isVisible]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible, onClose]);

  const handleLocationClick = (location: MooringLocation) => {
    onLocationSelect(location);
    onClose();
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'marina':
        return 'bg-blue-100 text-blue-800';
      case 'pier':
        return 'bg-green-100 text-green-800';
      case 'jetty':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isVisible || filteredLocations.length === 0) {
    return null;
  }

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-y-auto z-50"
    >
      <div className="p-2">
        <div className="text-xs text-gray-500 mb-2 px-2">
          {filteredLocations.length} location{filteredLocations.length !== 1 ? 's' : ''} found
        </div>
        
        {filteredLocations.map((location) => (
          <div
            key={location.id}
            className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
            onClick={() => handleLocationClick(location)}
          >
            <div className="flex-shrink-0">
              <MapPin className="h-4 w-4 text-blue-600" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-gray-900 truncate">{location.name}</h4>
                <span className={`px-2 py-1 text-xs rounded-full ${getTypeBadgeColor(location.type)}`}>
                  {location.type}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 truncate mb-1">
                {location.address}, {location.county}
              </p>
              
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Anchor className="h-3 w-3" />
                  {location.capacity} berths
                </span>
                <span>{location.region}</span>
                <span>{location.depth}m depth</span>
              </div>
            </div>
          </div>
        ))}
        
        {filteredLocations.length === 8 && (
          <div className="text-xs text-gray-500 text-center py-2 border-t">
            Showing first 8 results. Type more to refine search.
          </div>
        )}
      </div>
    </div>
  );
}