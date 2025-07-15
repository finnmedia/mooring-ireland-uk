import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import type { MooringLocation } from "@shared/schema";
import { useAuth, useLogout } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import AppHeader from "@/components/app-header";
import FilterSidebar from "@/components/filter-sidebar";
import IrelandMap from "@/components/ireland-map";
import LocationModal from "@/components/location-modal";
import LocationList from "@/components/location-list";
import MobileFilterSheet from "@/components/mobile-filter-sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, LogOut, Users, Star, Settings } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user } = useAuth();
  const logout = useLogout();
  const { toast } = useToast();
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout.mutate();
  };
  const [selectedLocation, setSelectedLocation] = useState<MooringLocation | null>(null);
  const [filters, setFilters] = useState({
    types: ['pier', 'jetty', 'marina'],
    region: '',
    country: '',
    facilities: [] as string[]
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileFilter, setShowMobileFilter] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');
  const [focusLocation, setFocusLocation] = useState<MooringLocation | null>(null);

  // Fetch platform settings for dynamic pricing
  const { data: settings = [] } = useQuery({
    queryKey: ['/api/public/settings'],
    queryFn: getQueryFn({
      on401: "returnNull",
      responseTransformer: (response: Response) => response.json(),
    }),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const getSettingValue = (key: string) => {
    if (!settings || !Array.isArray(settings)) return null;
    const setting = settings.find((s: any) => s.key === key);
    return setting?.value || null;
  };

  const premiumPrice = getSettingValue("premium_price") || "119.99";

  const { data: locations = [], isLoading } = useQuery<MooringLocation[]>({
    queryKey: ['/api/mooring-locations'],
    queryFn: getQueryFn({
      on401: "returnNull", // Now handles unauthenticated gracefully
      responseTransformer: (response: Response) => response.json(),
    }),
    select: (data) => {
      let filtered = data;

      // Apply type filter
      if (filters.types.length > 0) {
        filtered = filtered.filter(location => filters.types.includes(location.type));
      }

      // Apply country filter first
      if (filters.country) {
        if (filters.country === 'Ireland') {
          filtered = filtered.filter(location => 
            location.region.includes('Coast') || 
            location.region === 'Northwest' || 
            location.region === 'Southeast' ||
            location.region === 'Southwest'
          );
        } else if (filters.country === 'United Kingdom') {
          filtered = filtered.filter(location => 
            location.region.includes('England') || 
            location.region.includes('Scotland') || 
            location.region.includes('Wales') ||
            location.region === 'Isle of Man' ||
            location.region === 'Channel Islands'
          );
        }
      }

      // Apply region filter after country filter
      if (filters.region) {
        filtered = filtered.filter(location => location.region === filters.region);
      }

      // Apply search filter
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(location =>
          location.name.toLowerCase().includes(query) ||
          location.address.toLowerCase().includes(query) ||
          location.county.toLowerCase().includes(query) ||
          location.region.toLowerCase().includes(query) ||
          location.type.toLowerCase().includes(query)
        );
      }

      // Apply facilities filter
      if (filters.facilities.length > 0) {
        filtered = filtered.filter(location => {
          return filters.facilities.every(facility => {
            switch (facility) {
              case 'fuel': return location.hasFuel;
              case 'water': return location.hasWater;
              case 'electricity': return location.hasElectricity;
              case 'waste': return location.hasWasteDisposal;
              default: return true;
            }
          });
        });
      }

      return filtered;
    }
  });

  const handleLocationSelect = (location: MooringLocation) => {
    setSelectedLocation(location);
    setFocusLocation(location);
  };

  const handleCloseModal = () => {
    setSelectedLocation(null);
  };

  const isPremium = user?.subscriptionStatus === "premium";

  const showUpgradeMessage = () => {
    if (!isPremium) {
      toast({
        title: "Premium Feature",
        description: `Upgrade to our annual premium plan (€${premiumPrice}/year) to access full contact details, booking features, and complete facility information.`,
        variant: "default",
      });
    }
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };

    if (showMobileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMobileMenu]);

  return (
    <div className="h-screen flex flex-col">
      {/* Use AppHeader component with search dropdown */}
      <AppHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onShowMobileFilter={() => setShowMobileFilter(true)}
        locations={locations}
        onLocationSelect={handleLocationSelect}
      />
      
      {/* Main Content */}
      <div className="flex flex-1 min-h-0 pt-16">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <FilterSidebar
            filters={filters}
            onFiltersChange={setFilters}
            locations={locations}
            onLocationSelect={handleLocationSelect}
          />
        </div>
        
        {/* Map/List View */}
        <div className="flex-1 flex flex-col min-h-0">
          {viewMode === 'map' ? (
            <IrelandMap 
              locations={locations}
              onLocationSelect={handleLocationSelect}
              searchQuery={searchQuery}
              focusLocation={focusLocation}
            />
          ) : (
            <div className="flex-1 overflow-y-auto bg-gray-50">
              <LocationList
                locations={locations}
                isLoading={isLoading}
                onLocationSelect={handleLocationSelect}
              />
            </div>
          )}
        </div>
      </div>

      {selectedLocation && (
        <LocationModal
          location={selectedLocation}
          onClose={handleCloseModal}
        />
      )}

      <MobileFilterSheet
        isOpen={showMobileFilter}
        onClose={() => setShowMobileFilter(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  );
}