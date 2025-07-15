import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Anchor, Ship, Waves, Fuel, Droplets, Crown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import type { MooringLocation } from "@shared/schema";

interface FilterSidebarProps {
  filters: {
    types: string[];
    region: string;
    country: string;
    facilities: string[];
  };
  onFiltersChange: (filters: any) => void;
  locations: MooringLocation[];
  onLocationSelect: (location: MooringLocation) => void;
}

export default function FilterSidebar({ 
  filters, 
  onFiltersChange, 
  locations, 
  onLocationSelect 
}: FilterSidebarProps) {
  const { user } = useAuth();
  const isPremium = user?.subscriptionStatus === "premium";
  const handleTypeChange = (type: string, checked: boolean) => {
    const newTypes = checked 
      ? [...filters.types, type]
      : filters.types.filter(t => t !== type);
    
    onFiltersChange({ ...filters, types: newTypes });
  };

  const handleFacilityChange = (facility: string, checked: boolean) => {
    const newFacilities = checked
      ? [...filters.facilities, facility]
      : filters.facilities.filter(f => f !== facility);
    
    onFiltersChange({ ...filters, facilities: newFacilities });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'marina': return <Anchor className="h-4 w-4" />;
      case 'pier': return <Ship className="h-4 w-4" />;
      case 'jetty': return <Waves className="h-4 w-4" />;
      default: return <Anchor className="h-4 w-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'marina': return 'bg-green-100 text-green-800';
      case 'pier': return 'bg-blue-100 text-blue-800';
      case 'jetty': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const typeCount = (type: string) => locations.filter(l => l.type === type).length;

  return (
    <aside className="w-80 bg-white shadow-lg overflow-y-auto border-r">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Locations</h2>
        
        {/* Mooring Type Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Mooring Type</h3>
          <div className="space-y-2">
            {['pier', 'jetty', 'marina'].map(type => (
              <label key={type} className="flex items-center">
                <Checkbox
                  checked={filters.types.includes(type)}
                  onCheckedChange={(checked) => handleTypeChange(type, checked as boolean)}
                />
                <span className="ml-2 text-sm text-gray-600 capitalize">{type}</span>
                <Badge variant="secondary" className="ml-auto">
                  {typeCount(type)}
                </Badge>
              </label>
            ))}
          </div>
        </div>

        {/* Country Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Country</h3>
          <Select value={filters.country || "all"} onValueChange={(value) => 
            onFiltersChange({ ...filters, country: value === "all" ? "" : value, region: "" })
          }>
            <SelectTrigger>
              <SelectValue placeholder="All Countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              <SelectItem value="Ireland">Ireland</SelectItem>
              <SelectItem value="United Kingdom">United Kingdom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Facilities Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Facilities</h3>
          <div className="space-y-2">
            {[
              { key: 'fuel', label: 'Fuel' },
              { key: 'water', label: 'Water' },
              { key: 'electricity', label: 'Electricity' },
              { key: 'waste', label: 'Waste Disposal' }
            ].map(facility => (
              <label key={facility.key} className="flex items-center">
                <Checkbox
                  checked={filters.facilities.includes(facility.key)}
                  onCheckedChange={(checked) => handleFacilityChange(facility.key, checked as boolean)}
                />
                <span className="ml-2 text-sm text-gray-600">{facility.label}</span>
              </label>
            ))}
            {!isPremium && (
              <div className="mt-2 p-3 bg-orange-50 rounded-md border border-orange-200">
                <p className="text-xs text-orange-700 mb-2">
                  💰 Upgrade to Premium to filter by facilities
                </p>
                <Link href="/checkout">
                  <Button 
                    size="sm" 
                    className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white text-xs"
                  >
                    <Crown className="h-3 w-3 mr-1" />
                    Upgrade Now
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Region Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Region</h3>
          <Select value={filters.region || "all"} onValueChange={(value) => 
            onFiltersChange({ ...filters, region: value === "all" ? "" : value })
          }>
            <SelectTrigger>
              <SelectValue placeholder="All Regions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Regions</SelectItem>
              
              {/* Show Ireland regions only when Ireland is selected or no country filter */}
              {(!filters.country || filters.country === 'Ireland') && (
                <>
                  <SelectItem value="West Coast">West Coast</SelectItem>
                  <SelectItem value="East Coast">East Coast</SelectItem>
                  <SelectItem value="South Coast">South Coast</SelectItem>
                  <SelectItem value="Southeast">Southeast</SelectItem>
                  <SelectItem value="Southwest">Southwest</SelectItem>
                  <SelectItem value="North Coast">North Coast</SelectItem>
                  <SelectItem value="Northwest">Northwest</SelectItem>
                </>
              )}
              
              {/* Show UK regions only when UK is selected or no country filter */}
              {(!filters.country || filters.country === 'United Kingdom') && (
                <>
                  <SelectItem value="Scotland North">Scotland North</SelectItem>
                  <SelectItem value="Scotland Islands">Scotland Islands</SelectItem>
                  <SelectItem value="Scotland East">Scotland East</SelectItem>
                  <SelectItem value="Scotland West">Scotland West</SelectItem>
                  <SelectItem value="North England">North England</SelectItem>
                  <SelectItem value="East England">East England</SelectItem>
                  <SelectItem value="South England">South England</SelectItem>
                  <SelectItem value="West Wales">West Wales</SelectItem>
                  <SelectItem value="North Wales">North Wales</SelectItem>
                  <SelectItem value="Isle of Man">Isle of Man</SelectItem>
                  <SelectItem value="Channel Islands">Channel Islands</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Location List */}
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Locations</h3>
          <span className="text-sm text-gray-500">{locations.length} found</span>
        </div>

        <div className="space-y-3">
          {locations.map((location) => (
            <div
              key={location.id}
              className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => onLocationSelect(location)}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">{location.name}</h4>
                <Badge className={getTypeBadgeColor(location.type)}>
                  {location.type}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                {location.address}, {location.county}
              </p>
              <div className="flex items-center text-xs text-gray-500 space-x-4">
                <span className="flex items-center">
                  <Anchor className="h-3 w-3 mr-1" />
                  {location.capacity} berths
                </span>
                {location.hasFuel && (
                  <span className="flex items-center">
                    <Fuel className="h-3 w-3 mr-1" />
                    Fuel
                  </span>
                )}
                {location.hasWater && (
                  <span className="flex items-center">
                    <Droplets className="h-3 w-3 mr-1" />
                    Water
                  </span>
                )}
                {!location.hasFuel && !location.hasWater && (
                  <span className="text-xs text-orange-600">
                    💰 Premium for facilities
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
