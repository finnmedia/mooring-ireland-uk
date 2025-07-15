import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, CheckCircle, Anchor, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function PaymentSuccess() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isProcessing, setIsProcessing] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Process the successful payment
    const processPayment = async () => {
      try {
        // Get subscription ID from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const subscriptionId = urlParams.get('subscription_id');
        
        if (subscriptionId) {
          await apiRequest('POST', '/api/subscription-success', {
            subscriptionId: subscriptionId
          });
          
          toast({
            title: "Payment Successful!",
            description: "Your premium subscription has been activated.",
            variant: "default",
          });
        }
        
        // Refresh user data to get updated subscription status
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        console.error('Error processing payment success:', error);
        toast({
          title: "Payment Processing",
          description: "Your payment was successful. It may take a few moments to activate your premium features.",
          variant: "default",
        });
      } finally {
        setIsProcessing(false);
      }
    };

    processPayment();
  }, [toast]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-orange-500" />
            <h2 className="text-xl font-semibold mb-2">Processing Payment...</h2>
            <p className="text-gray-600">Activating your premium subscription</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-green-800">Payment Successful!</CardTitle>
          <Badge className="mx-auto mt-2">
            <Crown className="w-3 h-3 mr-1" />
            Premium Member
          </Badge>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">Welcome to Premium!</h3>
            <p className="text-sm text-green-800">
              You now have full access to all 100+ Irish marine facilities with complete contact details, 
              facility information, and booking capabilities.
            </p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Your Premium Benefits:</h4>
            <ul className="text-sm text-blue-800 space-y-1 text-left">
              <li>• Full contact details for all marine facilities</li>
              <li>• Complete facility information (fuel, water, electricity)</li>
              <li>• Booking capabilities for available berths</li>
              <li>• Priority customer support</li>
              <li>• Annual subscription (€119.99/year)</li>
            </ul>
          </div>

          <div className="pt-4">
            <Link href="/">
              <Button className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600">
                <Anchor className="w-4 h-4 mr-2" />
                Explore Marine Facilities
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}