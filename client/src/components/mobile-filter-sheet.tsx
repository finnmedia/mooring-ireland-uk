import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MobileFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    types: string[];
    region: string;
    country: string;
    facilities: string[];
  };
  onFiltersChange: (filters: any) => void;
}

export default function MobileFilterSheet({ 
  isOpen, 
  onClose, 
  filters, 
  onFiltersChange 
}: MobileFilterSheetProps) {
  if (!isOpen) return null;

  const handleTypeToggle = (type: string) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter(t => t !== type)
      : [...filters.types, type];
    
    onFiltersChange({ ...filters, types: newTypes });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-96 overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filter Locations</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Mooring Type</h4>
              <div className="flex flex-wrap gap-2">
                {['pier', 'jetty', 'marina'].map(type => (
                  <Button
                    key={type}
                    variant={filters.types.includes(type) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTypeToggle(type)}
                    className={`capitalize ${
                      filters.types.includes(type) 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'text-gray-700'
                    }`}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Country</h4>
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

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Region</h4>
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

            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={onClose}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
