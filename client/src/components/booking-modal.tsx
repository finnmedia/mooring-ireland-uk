import { useState } from "react";
import { X, Calendar, User, Phone, Mail, Anchor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { MooringLocation, InsertBooking } from "@shared/schema";

interface BookingModalProps {
  location: MooringLocation;
  onClose: () => void;
}

export default function BookingModal({ location, onClose }: BookingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    boatName: '',
    boatLength: '',
    checkInDate: '',
    checkOutDate: '',
    specialRequests: ''
  });

  const bookingMutation = useMutation({
    mutationFn: async (booking: InsertBooking) => {
      return apiRequest(`/api/bookings`, {
        method: 'POST',
        body: JSON.stringify(booking),
      });
    },
    onSuccess: () => {
      toast({
        title: "Booking Request Submitted",
        description: "We'll contact you shortly to confirm your booking.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Booking Failed",
        description: "Please try again or contact the marina directly.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.customerEmail || !formData.checkInDate || !formData.checkOutDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);
    const numberOfNights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    if (numberOfNights <= 0) {
      toast({
        title: "Invalid Dates",
        description: "Check-out date must be after check-in date.",
        variant: "destructive",
      });
      return;
    }

    const booking: InsertBooking = {
      mooringLocationId: location.id,
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      customerPhone: formData.customerPhone || null,
      boatName: formData.boatName || null,
      boatLength: formData.boatLength ? parseFloat(formData.boatLength) : null,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfNights,
      totalPrice: numberOfNights * 50, // €50 per night base rate
      specialRequests: formData.specialRequests || null,
      status: 'pending'
    };

    bookingMutation.mutate(booking);
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Book at {location.name}</h3>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="customerName" className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Full Name *
                </Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="customerEmail" className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Address *
                </Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="customerPhone" className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Phone Number
                </Label>
                <Input
                  id="customerPhone"
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                  placeholder="+353 XX XXX XXXX"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="boatName" className="flex items-center">
                    <Anchor className="h-4 w-4 mr-2" />
                    Boat Name
                  </Label>
                  <Input
                    id="boatName"
                    value={formData.boatName}
                    onChange={(e) => setFormData({...formData, boatName: e.target.value})}
                    placeholder="Boat name"
                  />
                </div>

                <div>
                  <Label htmlFor="boatLength">Length (m)</Label>
                  <Input
                    id="boatLength"
                    type="number"
                    step="0.1"
                    value={formData.boatLength}
                    onChange={(e) => setFormData({...formData, boatLength: e.target.value})}
                    placeholder="12.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="checkInDate" className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Check-in Date *
                  </Label>
                  <Input
                    id="checkInDate"
                    type="date"
                    value={formData.checkInDate}
                    onChange={(e) => setFormData({...formData, checkInDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="checkOutDate">Check-out Date *</Label>
                  <Input
                    id="checkOutDate"
                    type="date"
                    value={formData.checkOutDate}
                    onChange={(e) => setFormData({...formData, checkOutDate: e.target.value})}
                    min={formData.checkInDate || new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="specialRequests">Special Requests</Label>
                <Textarea
                  id="specialRequests"
                  value={formData.specialRequests}
                  onChange={(e) => setFormData({...formData, specialRequests: e.target.value})}
                  placeholder="Any special requirements or requests..."
                  rows={3}
                />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Estimated Cost:</p>
              <p className="text-lg font-semibold">
                €50 per night × {
                  formData.checkInDate && formData.checkOutDate 
                    ? Math.max(1, Math.ceil((new Date(formData.checkOutDate).getTime() - new Date(formData.checkInDate).getTime()) / (1000 * 60 * 60 * 24)))
                    : 1
                } nights = €{
                  formData.checkInDate && formData.checkOutDate 
                    ? Math.max(50, 50 * Math.ceil((new Date(formData.checkOutDate).getTime() - new Date(formData.checkInDate).getTime()) / (1000 * 60 * 60 * 24)))
                    : 50
                }
              </p>
              <p className="text-xs text-gray-500 mt-1">Final pricing may vary based on boat size and season</p>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={bookingMutation.isPending}
              >
                {bookingMutation.isPending ? 'Submitting...' : 'Submit Booking Request'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}