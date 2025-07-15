import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crown, CheckCircle, Loader2, Tag, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useLocation } from "wouter";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ premiumPrice }: { premiumPrice: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();
  const [promoCode, setPromoCode] = useState("");
  const [promoCodeApplied, setPromoCodeApplied] = useState(false);
  const [promoCodeValidating, setPromoCodeValidating] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(parseFloat(premiumPrice));
  const [needsNewSubscription, setNeedsNewSubscription] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("IE"); // Default to Ireland

  // Country list with Ireland and UK prioritized
  const countries = [
    { code: "IE", name: "Ireland" },
    { code: "GB", name: "United Kingdom" },
    { code: "AD", name: "Andorra" },
    { code: "AE", name: "United Arab Emirates" },
    { code: "AF", name: "Afghanistan" },
    { code: "AG", name: "Antigua and Barbuda" },
    { code: "AI", name: "Anguilla" },
    { code: "AL", name: "Albania" },
    { code: "AM", name: "Armenia" },
    { code: "AO", name: "Angola" },
    { code: "AQ", name: "Antarctica" },
    { code: "AR", name: "Argentina" },
    { code: "AS", name: "American Samoa" },
    { code: "AT", name: "Austria" },
    { code: "AU", name: "Australia" },
    { code: "AW", name: "Aruba" },
    { code: "AX", name: "Åland Islands" },
    { code: "AZ", name: "Azerbaijan" },
    { code: "BA", name: "Bosnia and Herzegovina" },
    { code: "BB", name: "Barbados" },
    { code: "BD", name: "Bangladesh" },
    { code: "BE", name: "Belgium" },
    { code: "BF", name: "Burkina Faso" },
    { code: "BG", name: "Bulgaria" },
    { code: "BH", name: "Bahrain" },
    { code: "BI", name: "Burundi" },
    { code: "BJ", name: "Benin" },
    { code: "BL", name: "Saint Barthélemy" },
    { code: "BM", name: "Bermuda" },
    { code: "BN", name: "Brunei" },
    { code: "BO", name: "Bolivia" },
    { code: "BQ", name: "Caribbean Netherlands" },
    { code: "BR", name: "Brazil" },
    { code: "BS", name: "Bahamas" },
    { code: "BT", name: "Bhutan" },
    { code: "BV", name: "Bouvet Island" },
    { code: "BW", name: "Botswana" },
    { code: "BY", name: "Belarus" },
    { code: "BZ", name: "Belize" },
    { code: "CA", name: "Canada" },
    { code: "CC", name: "Cocos (Keeling) Islands" },
    { code: "CD", name: "Congo (DRC)" },
    { code: "CF", name: "Central African Republic" },
    { code: "CG", name: "Congo (Republic)" },
    { code: "CH", name: "Switzerland" },
    { code: "CI", name: "Côte d'Ivoire" },
    { code: "CK", name: "Cook Islands" },
    { code: "CL", name: "Chile" },
    { code: "CM", name: "Cameroon" },
    { code: "CN", name: "China" },
    { code: "CO", name: "Colombia" },
    { code: "CR", name: "Costa Rica" },
    { code: "CU", name: "Cuba" },
    { code: "CV", name: "Cape Verde" },
    { code: "CW", name: "Curaçao" },
    { code: "CX", name: "Christmas Island" },
    { code: "CY", name: "Cyprus" },
    { code: "CZ", name: "Czech Republic" },
    { code: "DE", name: "Germany" },
    { code: "DJ", name: "Djibouti" },
    { code: "DK", name: "Denmark" },
    { code: "DM", name: "Dominica" },
    { code: "DO", name: "Dominican Republic" },
    { code: "DZ", name: "Algeria" },
    { code: "EC", name: "Ecuador" },
    { code: "EE", name: "Estonia" },
    { code: "EG", name: "Egypt" },
    { code: "EH", name: "Western Sahara" },
    { code: "ER", name: "Eritrea" },
    { code: "ES", name: "Spain" },
    { code: "ET", name: "Ethiopia" },
    { code: "FI", name: "Finland" },
    { code: "FJ", name: "Fiji" },
    { code: "FK", name: "Falkland Islands" },
    { code: "FM", name: "Micronesia" },
    { code: "FO", name: "Faroe Islands" },
    { code: "FR", name: "France" },
    { code: "GA", name: "Gabon" },
    { code: "GD", name: "Grenada" },
    { code: "GE", name: "Georgia" },
    { code: "GF", name: "French Guiana" },
    { code: "GG", name: "Guernsey" },
    { code: "GH", name: "Ghana" },
    { code: "GI", name: "Gibraltar" },
    { code: "GL", name: "Greenland" },
    { code: "GM", name: "Gambia" },
    { code: "GN", name: "Guinea" },
    { code: "GP", name: "Guadeloupe" },
    { code: "GQ", name: "Equatorial Guinea" },
    { code: "GR", name: "Greece" },
    { code: "GS", name: "South Georgia and the South Sandwich Islands" },
    { code: "GT", name: "Guatemala" },
    { code: "GU", name: "Guam" },
    { code: "GW", name: "Guinea-Bissau" },
    { code: "GY", name: "Guyana" },
    { code: "HK", name: "Hong Kong" },
    { code: "HM", name: "Heard Island and McDonald Islands" },
    { code: "HN", name: "Honduras" },
    { code: "HR", name: "Croatia" },
    { code: "HT", name: "Haiti" },
    { code: "HU", name: "Hungary" },
    { code: "ID", name: "Indonesia" },
    { code: "IL", name: "Israel" },
    { code: "IM", name: "Isle of Man" },
    { code: "IN", name: "India" },
    { code: "IO", name: "British Indian Ocean Territory" },
    { code: "IQ", name: "Iraq" },
    { code: "IR", name: "Iran" },
    { code: "IS", name: "Iceland" },
    { code: "IT", name: "Italy" },
    { code: "JE", name: "Jersey" },
    { code: "JM", name: "Jamaica" },
    { code: "JO", name: "Jordan" },
    { code: "JP", name: "Japan" },
    { code: "KE", name: "Kenya" },
    { code: "KG", name: "Kyrgyzstan" },
    { code: "KH", name: "Cambodia" },
    { code: "KI", name: "Kiribati" },
    { code: "KM", name: "Comoros" },
    { code: "KN", name: "Saint Kitts and Nevis" },
    { code: "KP", name: "North Korea" },
    { code: "KR", name: "South Korea" },
    { code: "KW", name: "Kuwait" },
    { code: "KY", name: "Cayman Islands" },
    { code: "KZ", name: "Kazakhstan" },
    { code: "LA", name: "Laos" },
    { code: "LB", name: "Lebanon" },
    { code: "LC", name: "Saint Lucia" },
    { code: "LI", name: "Liechtenstein" },
    { code: "LK", name: "Sri Lanka" },
    { code: "LR", name: "Liberia" },
    { code: "LS", name: "Lesotho" },
    { code: "LT", name: "Lithuania" },
    { code: "LU", name: "Luxembourg" },
    { code: "LV", name: "Latvia" },
    { code: "LY", name: "Libya" },
    { code: "MA", name: "Morocco" },
    { code: "MC", name: "Monaco" },
    { code: "MD", name: "Moldova" },
    { code: "ME", name: "Montenegro" },
    { code: "MF", name: "Saint Martin" },
    { code: "MG", name: "Madagascar" },
    { code: "MH", name: "Marshall Islands" },
    { code: "MK", name: "North Macedonia" },
    { code: "ML", name: "Mali" },
    { code: "MM", name: "Myanmar" },
    { code: "MN", name: "Mongolia" },
    { code: "MO", name: "Macao" },
    { code: "MP", name: "Northern Mariana Islands" },
    { code: "MQ", name: "Martinique" },
    { code: "MR", name: "Mauritania" },
    { code: "MS", name: "Montserrat" },
    { code: "MT", name: "Malta" },
    { code: "MU", name: "Mauritius" },
    { code: "MV", name: "Maldives" },
    { code: "MW", name: "Malawi" },
    { code: "MX", name: "Mexico" },
    { code: "MY", name: "Malaysia" },
    { code: "MZ", name: "Mozambique" },
    { code: "NA", name: "Namibia" },
    { code: "NC", name: "New Caledonia" },
    { code: "NE", name: "Niger" },
    { code: "NF", name: "Norfolk Island" },
    { code: "NG", name: "Nigeria" },
    { code: "NI", name: "Nicaragua" },
    { code: "NL", name: "Netherlands" },
    { code: "NO", name: "Norway" },
    { code: "NP", name: "Nepal" },
    { code: "NR", name: "Nauru" },
    { code: "NU", name: "Niue" },
    { code: "NZ", name: "New Zealand" },
    { code: "OM", name: "Oman" },
    { code: "PA", name: "Panama" },
    { code: "PE", name: "Peru" },
    { code: "PF", name: "French Polynesia" },
    { code: "PG", name: "Papua New Guinea" },
    { code: "PH", name: "Philippines" },
    { code: "PK", name: "Pakistan" },
    { code: "PL", name: "Poland" },
    { code: "PM", name: "Saint Pierre and Miquelon" },
    { code: "PN", name: "Pitcairn" },
    { code: "PR", name: "Puerto Rico" },
    { code: "PS", name: "Palestine" },
    { code: "PT", name: "Portugal" },
    { code: "PW", name: "Palau" },
    { code: "PY", name: "Paraguay" },
    { code: "QA", name: "Qatar" },
    { code: "RE", name: "Réunion" },
    { code: "RO", name: "Romania" },
    { code: "RS", name: "Serbia" },
    { code: "RU", name: "Russia" },
    { code: "RW", name: "Rwanda" },
    { code: "SA", name: "Saudi Arabia" },
    { code: "SB", name: "Solomon Islands" },
    { code: "SC", name: "Seychelles" },
    { code: "SD", name: "Sudan" },
    { code: "SE", name: "Sweden" },
    { code: "SG", name: "Singapore" },
    { code: "SH", name: "Saint Helena" },
    { code: "SI", name: "Slovenia" },
    { code: "SJ", name: "Svalbard and Jan Mayen" },
    { code: "SK", name: "Slovakia" },
    { code: "SL", name: "Sierra Leone" },
    { code: "SM", name: "San Marino" },
    { code: "SN", name: "Senegal" },
    { code: "SO", name: "Somalia" },
    { code: "SR", name: "Suriname" },
    { code: "SS", name: "South Sudan" },
    { code: "ST", name: "São Tomé and Príncipe" },
    { code: "SV", name: "El Salvador" },
    { code: "SX", name: "Sint Maarten" },
    { code: "SY", name: "Syria" },
    { code: "SZ", name: "Eswatini" },
    { code: "TC", name: "Turks and Caicos Islands" },
    { code: "TD", name: "Chad" },
    { code: "TF", name: "French Southern Territories" },
    { code: "TG", name: "Togo" },
    { code: "TH", name: "Thailand" },
    { code: "TJ", name: "Tajikistan" },
    { code: "TK", name: "Tokelau" },
    { code: "TL", name: "Timor-Leste" },
    { code: "TM", name: "Turkmenistan" },
    { code: "TN", name: "Tunisia" },
    { code: "TO", name: "Tonga" },
    { code: "TR", name: "Turkey" },
    { code: "TT", name: "Trinidad and Tobago" },
    { code: "TV", name: "Tuvalu" },
    { code: "TW", name: "Taiwan" },
    { code: "TZ", name: "Tanzania" },
    { code: "UA", name: "Ukraine" },
    { code: "UG", name: "Uganda" },
    { code: "UM", name: "United States Minor Outlying Islands" },
    { code: "US", name: "United States" },
    { code: "UY", name: "Uruguay" },
    { code: "UZ", name: "Uzbekistan" },
    { code: "VA", name: "Vatican City" },
    { code: "VC", name: "Saint Vincent and the Grenadines" },
    { code: "VE", name: "Venezuela" },
    { code: "VG", name: "British Virgin Islands" },
    { code: "VI", name: "U.S. Virgin Islands" },
    { code: "VN", name: "Vietnam" },
    { code: "VU", name: "Vanuatu" },
    { code: "WF", name: "Wallis and Futuna" },
    { code: "WS", name: "Samoa" },
    { code: "YE", name: "Yemen" },
    { code: "YT", name: "Mayotte" },
    { code: "ZA", name: "South Africa" },
    { code: "ZM", name: "Zambia" },
    { code: "ZW", name: "Zimbabwe" }
  ];

  const validatePromoCode = async () => {
    if (!promoCode.trim()) return;
    
    setPromoCodeValidating(true);
    try {
      const response = await apiRequest("POST", "/api/validate-promo-code", {
        code: promoCode.trim()
      });
      const result = await response.json();
      
      if (result.valid) {
        const discountValue = result.discount || result.discountPercentage || 0;
        setDiscount(discountValue);
        setFinalPrice(parseFloat(premiumPrice) * (1 - discountValue / 100));
        setPromoCodeApplied(true);
        setNeedsNewSubscription(true); // Need to recreate subscription with promo code
        toast({
          title: "Promo Code Applied!",
          description: `${discountValue}% discount applied to your subscription.`,
        });
      } else {
        toast({
          title: "Invalid Promo Code",
          description: result.message || "This promo code is not valid.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to validate promo code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPromoCodeValidating(false);
    }
  };

  const removePromoCode = () => {
    setPromoCode("");
    setPromoCodeApplied(false);
    setDiscount(0);
    setFinalPrice(parseFloat(premiumPrice));
    setNeedsNewSubscription(true); // Need to recreate subscription without promo code
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!stripe || !elements) {
      setIsLoading(false);
      return;
    }

    // If promo code was applied, create a new subscription with the promo code
    if (needsNewSubscription) {
      try {
        const response = await apiRequest("POST", "/api/create-subscription", {
          promoCode: promoCodeApplied ? promoCode : undefined
        });
        const result = await response.json();
        
        // Handle 100% discount (free upgrade)
        if (result.freeUpgrade) {
          toast({
            title: "Premium Activated!",
            description: result.message || "Your premium subscription is now active!",
          });
          navigate("/");
          return;
        }
        
        if (result.clientSecret) {
          // Continue with the new client secret
          const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
              return_url: window.location.origin + "/payment-success",
              payment_method_data: {
                billing_details: {
                  address: {
                    country: selectedCountry,
                  },
                },
              },
            },
          });

          if (error) {
            toast({
              title: "Payment Failed",
              description: error.message,
              variant: "destructive",
            });
            setIsLoading(false);
          } else {
            toast({
              title: "Payment Successful",
              description: "Welcome to Premium! You now have full access to all features.",
            });
            navigate("/");
          }
        } else {
          throw new Error("Failed to create subscription with promo code");
        }
      } catch (error: any) {
        let errorMessage = "Failed to apply promo code to subscription. Please try again.";
        
        if (error.message) {
          // apiRequest throws errors in format "status: body"
          if (error.message.includes(":")) {
            const parts = error.message.split(": ");
            if (parts.length > 1) {
              try {
                // Try to parse the body part as JSON
                const errorResponse = JSON.parse(parts.slice(1).join(": "));
                errorMessage = errorResponse.message || errorMessage;
              } catch {
                // If not JSON, use the body part directly
                errorMessage = parts.slice(1).join(": ");
              }
            }
          } else {
            errorMessage = error.message;
          }
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        setIsLoading(false);
      }
    } else {
      // Use existing subscription
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/payment-success",
          payment_method_data: {
            billing_details: {
              address: {
                country: selectedCountry,
              },
            },
          },
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
        setIsLoading(false);
      } else {
        toast({
          title: "Payment Successful",
          description: "Welcome to Premium! You now have full access to all features.",
        });
        navigate("/");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">What's Included in Premium:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Full contact details for all 100+ marine facilities</li>
          <li>• Complete facility information (fuel, water, electricity, waste)</li>
          <li>• Booking capabilities for available berths</li>
          <li>• Priority customer support</li>
          <li>• Annual subscription with immediate access</li>
        </ul>
      </div>

      {/* Promo Code Section */}
      <div className="space-y-3">
        <Label htmlFor="promo-code">Promo Code (Optional)</Label>
        {!promoCodeApplied ? (
          <div className="flex gap-2">
            <Input
              id="promo-code"
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              placeholder="Enter promo code"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={validatePromoCode}
              disabled={!promoCode.trim() || promoCodeValidating}
            >
              {promoCodeValidating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Tag className="w-4 h-4" />
              )}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-green-600" />
              <span className="text-green-700 font-medium">{promoCode}</span>
              <Badge variant="secondary" className="text-green-700 bg-green-100">
                {discount}% OFF
              </Badge>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={removePromoCode}
              className="text-green-700 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Price Summary */}
      <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between">
          <span>Premium Annual Subscription</span>
          <span>€{premiumPrice}</span>
        </div>
        {promoCodeApplied && discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount ({discount}%)</span>
            <span>-€{(parseFloat(premiumPrice) * discount / 100).toFixed(2)}</span>
          </div>
        )}
        <hr className="my-2" />
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>€{isNaN(finalPrice) ? parseFloat(premiumPrice).toFixed(2) : finalPrice.toFixed(2)}</span>
        </div>
      </div>

      {/* Country Selection */}
      <div className="space-y-2">
        <Label htmlFor="country">Country</Label>
        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger>
            <SelectValue placeholder="Select your country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                {country.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <PaymentElement />
      
      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
        disabled={!stripe || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Crown className="w-4 h-4 mr-2" />
            Subscribe to Premium - €{finalPrice.toFixed(2)}/year
          </>
        )}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState("");
  const { toast } = useToast();

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

  useEffect(() => {
    // Create subscription as soon as the page loads
    apiRequest("POST", "/api/create-subscription", {})
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError("Failed to initialize payment");
        }
      })
      .catch((err) => {
        setError("Failed to initialize payment: " + err.message);
        toast({
          title: "Error",
          description: "Unable to initialize payment. Please try again.",
          variant: "destructive",
        });
      });
  }, [toast]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Login Required</CardTitle>
            <CardDescription>You need to be logged in to upgrade to premium</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/login">
              <Button className="w-full">Login to Continue</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.subscriptionStatus === "premium") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <CardTitle>Already Premium</CardTitle>
            <CardDescription>You already have premium access to all features</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Badge className="mb-4">
              <Crown className="w-3 h-3 mr-1" />
              Premium Member
            </Badge>
            <Link href="/">
              <Button className="w-full">Return to App</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Payment Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button className="w-full">Return to App</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-8">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p>Initializing payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <CardTitle>Upgrade to Premium</CardTitle>
          <CardDescription>
            Join premium and get full access to all Irish marine facilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Elements 
            stripe={stripePromise} 
            options={{ 
              clientSecret,
              appearance: {
                theme: 'stripe',
              },
              locale: 'auto',
              // Prioritize Ireland and United Kingdom in country dropdown
              paymentMethodOrder: ['card'],
            }}
          >
            <CheckoutForm premiumPrice={premiumPrice} />
          </Elements>
        </CardContent>
      </Card>
    </div>
  );
}