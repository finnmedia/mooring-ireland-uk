import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Anchor } from "lucide-react";

interface MooringLocation {
  id: number;
  name: string;
  type: string;
  address?: string;
  county?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  berths?: number;
  depth?: string;
  latitude: number;
  longitude: number;
  facilities?: string[];
}

export default function SimpleLocationList() {
  const [locations, setLocations] = useState<MooringLocation[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<MooringLocation[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState("all");

  useEffect(() => {
    fetch('/api/mooring-locations')
      .then(res => res.json())
      .then(data => {
        setLocations(data);
        setFilteredLocations(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading locations:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let filtered = locations;
    
    if (searchQuery) {
      filtered = filtered.filter(loc => 
        loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (loc.county && loc.county.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (loc.address && loc.address.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (selectedCountry !== "all") {
      filtered = filtered.filter(loc => loc.country === selectedCountry);
    }
    
    setFilteredLocations(filtered);
  }, [searchQuery, selectedCountry, locations]);

  const countries = Array.from(new Set(locations.map(loc => loc.country).filter(Boolean)));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading maritime locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Anchor className="w-8 h-8" />
            Mooring Ireland & UK
          </h1>
          <p className="text-blue-100 mt-2">
            Comprehensive maritime navigation platform with {locations.length} locations
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search locations by name, county, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="md:w-48">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Countries</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Showing {filteredLocations.length} of {locations.length} locations
          </p>
        </div>

        {/* Location Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLocations.map((location) => (
            <Card key={location.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{location.name}</CardTitle>
                  <Badge variant="secondary">{location.type}</Badge>
                </div>
                {location.address && (
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {location.address}
                    {location.county && `, ${location.county}`}
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Berths:</span> {location.berths || 'Not specified'}
                  </div>
                  <div>
                    <span className="font-medium">Depth:</span> {location.depth || 'Not specified'}
                  </div>
                </div>

                {/* Contact Actions */}
                <div className="flex gap-2 pt-2">
                  {location.phone && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={`tel:${location.phone}`}>
                        <Phone className="w-4 h-4 mr-1" />
                        Call
                      </a>
                    </Button>
                  )}
                  {location.email && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={`mailto:${location.email}`}>
                        <Mail className="w-4 h-4 mr-1" />
                        Email
                      </a>
                    </Button>
                  )}
                  {location.website && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={location.website} target="_blank" rel="noopener noreferrer">
                        Visit
                      </a>
                    </Button>
                  )}
                </div>

                {/* Facilities */}
                {location.facilities && location.facilities.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Facilities:</p>
                    <div className="flex flex-wrap gap-1">
                      {location.facilities.slice(0, 4).map((facility, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {facility}
                        </Badge>
                      ))}
                      {location.facilities.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{location.facilities.length - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredLocations.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No locations found matching your search criteria.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchQuery("");
                setSelectedCountry("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}