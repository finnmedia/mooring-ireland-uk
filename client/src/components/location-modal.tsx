import { useState } from "react";
import { X, Phone, Navigation, Anchor, Fuel, Droplets, Zap, Trash2, ShowerHead, UtensilsCrossed, Mail, Globe, Calendar, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BookingModal from "./booking-modal";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import type { MooringLocation } from "@shared/schema";

interface LocationModalProps {
  location: MooringLocation;
  onClose: () => void;
}

export default function LocationModal({ location, onClose }: LocationModalProps) {
  const [showBooking, setShowBooking] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const isPremium = user?.subscriptionStatus === "premium";

  const showUpgradeMessage = () => {
    toast({
      title: "Premium Feature",
      description: "Upgrade to premium to access contact details and directions.",
      variant: "default",
    });
  };

  const handleEmailClick = () => {
    if (isPremium) {
      window.open(`mailto:${location.email}?subject=Berth Booking Inquiry - ${location.name}`);
    } else {
      showUpgradeMessage();
    }
  };

  const handleDirectionsClick = () => {
    if (isPremium) {
      window.open(`https://maps.google.com?q=${location.latitude},${location.longitude}`);
    } else {
      showUpgradeMessage();
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

  const facilities = [
    { key: 'hasFuel', label: 'Fuel', icon: Fuel, available: location.hasFuel },
    { key: 'hasWater', label: 'Water', icon: Droplets, available: location.hasWater },
    { key: 'hasElectricity', label: 'Electricity', icon: Zap, available: location.hasElectricity },
    { key: 'hasWasteDisposal', label: 'Waste Disposal', icon: Trash2, available: location.hasWasteDisposal },
    { key: 'hasShowers', label: 'Showers', icon: ShowerHead, available: location.hasShowers },
    { key: 'hasRestaurant', label: 'Restaurant', icon: UtensilsCrossed, available: location.hasRestaurant },
  ];

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end lg:items-center lg:justify-start lg:pl-4 lg:pb-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-t-2xl lg:rounded-2xl w-full lg:max-w-md lg:max-h-80 max-h-96 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{location.name}</h3>
              <p className="text-gray-600">{location.address}, {location.county}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-4">
            <Badge className={getTypeBadgeColor(location.type)}>
              {location.type}
            </Badge>
          </div>

          {/* Contact Information Section */}
          {(location.phone || location.email || location.website) && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
                <Phone className="h-5 w-5 mr-2" />
                Contact Information
              </h4>
              <div className="space-y-3">
                {location.phone && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="text-gray-700">{location.phone}</span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => window.open(`tel:${location.phone}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Call Now
                    </Button>
                  </div>
                )}
                {location.email && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="text-gray-700">
                        {isPremium ? location.email : "💰 Upgrade to Premium"}
                      </span>
                    </div>
                    {isPremium ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`mailto:${location.email}`)}
                      >
                        Email
                      </Button>
                    ) : (
                      <Link href="/checkout">
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white"
                        >
                          <Crown className="h-3 w-3 mr-1" />
                          Upgrade
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
                {location.website && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-blue-600" />
                      <span className="text-gray-700 truncate max-w-48">{location.website}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(location.website.startsWith('http') ? location.website : `https://${location.website}`)}
                    >
                      Visit
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Capacity</h4>
              <p className="text-lg font-semibold text-gray-900 flex items-center">
                <Anchor className="h-4 w-4 mr-1" />
                {location.capacity} berths
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Depth</h4>
              <p className="text-lg font-semibold text-gray-900">{location.depth}m</p>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Facilities</h4>
            <div className="flex flex-wrap gap-2">
              {facilities
                .filter(facility => facility.available)
                .map(facility => (
                  <div
                    key={facility.key}
                    className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                  >
                    <facility.icon className="h-3 w-3 mr-1" />
                    {facility.label}
                  </div>
                ))}
              
              {/* Show premium prompt if no facilities are visible */}
              {facilities.filter(facility => facility.available).length === 0 && (
                <div className="w-full p-3 bg-orange-50 rounded-md border border-orange-200">
                  <p className="text-sm text-orange-700 font-medium mb-2">
                    💰 Upgrade to Premium to see all available facilities
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



          {location.description && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
              <p className="text-sm text-gray-600">{location.description}</p>
              {/* Add upgrade button if description is truncated for non-premium users */}
              {!isPremium && location.description.includes("💰 Upgrade to Premium") && (
                <div className="mt-2">
                  <Link href="/checkout">
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white text-xs"
                    >
                      <Crown className="h-3 w-3 mr-1" />
                      Upgrade for Full Details
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Main Action Buttons */}
          <div className="space-y-3">
            {location.phone && (
              <>
                {isPremium ? (
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-3"
                    onClick={() => window.open(`tel:${location.phone}`)}
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    Call Now to Book
                  </Button>
                ) : (
                  <Link href="/checkout">
                    <Button 
                      className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white text-lg py-3"
                    >
                      <Crown className="h-5 w-5 mr-2" />
                      Upgrade to Call & Book
                    </Button>
                  </Link>
                )}
              </>
            )}
            
            <div className="flex space-x-3">
              {isPremium ? (
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleDirectionsClick}
                >
                  <Navigation className="h-4 w-4 mr-2" />
                  Directions
                </Button>
              ) : (
                <Link href="/checkout" className="flex-1">
                  <Button 
                    variant="outline" 
                    className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Upgrade for Directions
                  </Button>
                </Link>
              )}
              {location.email && (
                <>
                  {isPremium ? (
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={handleEmailClick}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                  ) : (
                    <Link href="/checkout" className="flex-1">
                      <Button 
                        variant="outline" 
                        className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade for Email
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {showBooking && (
        <BookingModal 
          location={location} 
          onClose={() => setShowBooking(false)} 
        />
      )}
    </div>
  );
}
