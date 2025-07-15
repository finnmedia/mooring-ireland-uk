import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Users, UserCheck, Crown, AlertTriangle, Settings, Gift, CreditCard, DollarSign, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Admin() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [newPromoCode, setNewPromoCode] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    maxUses: "",
    expiresAt: ""
  });

  const { data: allUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: user?.role === "admin"
  });

  const { data: platformSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/admin/settings"],
    enabled: user?.role === "admin"
  });

  const { data: promoCodes, isLoading: promoLoading } = useQuery({
    queryKey: ["/api/admin/promo-codes"],
    enabled: user?.role === "admin"
  });

  const createPromoMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/admin/promo-codes", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Promo code created successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      setNewPromoCode({
        code: "",
        description: "",
        discountType: "percentage",
        discountValue: "",
        maxUses: "",
        expiresAt: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create promo code",
        variant: "destructive"
      });
    }
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: string; description?: string }) => {
      return await apiRequest("POST", "/api/admin/settings", { key, value, description });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Setting updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update setting",
        variant: "destructive"
      });
    }
  });

  if (isLoading || usersLoading || settingsLoading || promoLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-400" />
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">Access Denied</h1>
          <p className="mt-2 text-base text-gray-500">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const totalUsers = allUsers?.length || 0;
  const premiumUsers = allUsers?.filter((u: any) => u.subscriptionStatus === "premium").length || 0;

  const getSettingValue = (key: string) => {
    return platformSettings?.find((s: any) => s.key === key)?.value || "";
  };

  const handleSettingUpdate = (key: string, value: string, description?: string) => {
    updateSettingMutation.mutate({ key, value, description });
  };

  const handleCreatePromoCode = () => {
    if (!newPromoCode.code || !newPromoCode.discountValue) {
      toast({
        title: "Error",
        description: "Code and discount value are required",
        variant: "destructive"
      });
      return;
    }

    createPromoMutation.mutate({
      ...newPromoCode,
      discountValue: parseFloat(newPromoCode.discountValue),
      maxUses: newPromoCode.maxUses ? parseInt(newPromoCode.maxUses) : null,
      expiresAt: newPromoCode.expiresAt ? new Date(newPromoCode.expiresAt) : null
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to App
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage platform settings, payments, and users</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
              <Crown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{premiumUsers}</div>
              <p className="text-xs text-muted-foreground">Active subscriptions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers ? Math.round((premiumUsers / totalUsers) * 100) : 0}%</div>
              <p className="text-xs text-muted-foreground">Free to premium</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Annual Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{premiumUsers * parseFloat(getSettingValue("premium_price") || "119.99")}</div>
              <p className="text-xs text-muted-foreground">Based on current yearly price</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="promo">Promo Codes</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Platform Settings
                </CardTitle>
                <CardDescription>Configure pricing and platform behavior</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="premium-price">Premium Annual Price (€)</Label>
                    <Input
                      id="premium-price"
                      type="number"
                      step="0.01"
                      defaultValue={getSettingValue("premium_price") || "119.99"}
                      onBlur={(e) => handleSettingUpdate("premium_price", e.target.value, "Annual subscription price in euros")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trial-days">Free Trial Days</Label>
                    <Input
                      id="trial-days"
                      type="number"
                      defaultValue={getSettingValue("trial_days") || "14"}
                      onBlur={(e) => handleSettingUpdate("trial_days", e.target.value, "Number of free trial days for yearly subscription")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="welcome-message">Welcome Message</Label>
                    <Textarea
                      id="welcome-message"
                      defaultValue={getSettingValue("welcome_message") || "Welcome to Mooring Ireland - your guide to Irish marine facilities"}
                      onBlur={(e) => handleSettingUpdate("welcome_message", e.target.value, "Message shown to new users")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="support-email">Support Email</Label>
                    <Input
                      id="support-email"
                      type="email"
                      defaultValue={getSettingValue("support_email") || "support@mooringireland.com"}
                      onBlur={(e) => handleSettingUpdate("support_email", e.target.value, "Customer support email address")}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="promo">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Create Promo Code
                  </CardTitle>
                  <CardDescription>Generate discount codes for special promotions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="promo-code">Code</Label>
                      <Input
                        id="promo-code"
                        placeholder="WELCOME50"
                        value={newPromoCode.code}
                        onChange={(e) => setNewPromoCode({ ...newPromoCode, code: e.target.value.toUpperCase() })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="promo-description">Description</Label>
                      <Input
                        id="promo-description"
                        placeholder="50% off first month"
                        value={newPromoCode.description}
                        onChange={(e) => setNewPromoCode({ ...newPromoCode, description: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discount-type">Discount Type</Label>
                      <Select
                        value={newPromoCode.discountType}
                        onValueChange={(value) => setNewPromoCode({ ...newPromoCode, discountType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage</SelectItem>
                          <SelectItem value="fixed">Fixed Amount (€)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="discount-value">Discount Value</Label>
                      <Input
                        id="discount-value"
                        type="number"
                        step="0.01"
                        placeholder={newPromoCode.discountType === "percentage" ? "50" : "5.00"}
                        value={newPromoCode.discountValue}
                        onChange={(e) => setNewPromoCode({ ...newPromoCode, discountValue: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max-uses">Max Uses (optional)</Label>
                      <Input
                        id="max-uses"
                        type="number"
                        placeholder="100"
                        value={newPromoCode.maxUses}
                        onChange={(e) => setNewPromoCode({ ...newPromoCode, maxUses: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expires-at">Expires At (optional)</Label>
                      <Input
                        id="expires-at"
                        type="datetime-local"
                        value={newPromoCode.expiresAt}
                        onChange={(e) => setNewPromoCode({ ...newPromoCode, expiresAt: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button onClick={handleCreatePromoCode} disabled={createPromoMutation.isPending}>
                    {createPromoMutation.isPending ? "Creating..." : "Create Promo Code"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Promo Codes</CardTitle>
                  <CardDescription>Manage existing promotional codes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {promoCodes?.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No promo codes created yet</p>
                    ) : (
                      promoCodes?.map((promo: any) => (
                        <div key={promo.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{promo.code}</p>
                            <p className="text-sm text-gray-500">{promo.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={promo.discountType === "percentage" ? "default" : "secondary"}>
                                {promo.discountType === "percentage" ? `${promo.discountValue}%` : `€${promo.discountValue}`}
                              </Badge>
                              <Badge variant={promo.isActive ? "default" : "secondary"}>
                                {promo.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">Uses: {promo.currentUses}{promo.maxUses ? `/${promo.maxUses}` : ""}</p>
                            {promo.expiresAt && (
                              <p className="text-xs text-gray-500">
                                Expires: {new Date(promo.expiresAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  All Users
                </CardTitle>
                <CardDescription>Manage user accounts and subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allUsers?.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <p className="text-xs text-gray-400">
                            Joined: {new Date(user.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={user.subscriptionStatus === "premium" ? "default" : "secondary"}>
                          {user.subscriptionStatus === "premium" ? "Premium" : "Free"}
                        </Badge>
                        {user.role === "admin" && (
                          <Badge variant="destructive">Admin</Badge>
                        )}
                        {user.stripeCustomerId && (
                          <Badge variant="outline">Stripe Customer</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Configuration & Annual Revenue
                </CardTitle>
                <CardDescription>Configure Stripe settings and view yearly revenue projections</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-medium text-green-900">Stripe Integration Status</h3>
                  <p className="text-green-700 text-sm mt-1">✅ Connected and ready to process payments</p>
                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    <div>
                      <p className="text-green-800 font-medium">Public Key</p>
                      <p className="text-green-600 font-mono">{import.meta.env.VITE_STRIPE_PUBLIC_KEY?.substring(0, 20)}...</p>
                    </div>
                    <div>
                      <p className="text-green-800 font-medium">Secret Key</p>
                      <p className="text-green-600 font-mono">sk_*********************</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">Current Pricing</h4>
                    <p className="text-2xl font-bold mt-2">€{getSettingValue("premium_price") || "119.99"}/year</p>
                    <p className="text-sm text-gray-500">Annual premium subscription price</p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">Annual Revenue Projection</h4>
                    <p className="text-2xl font-bold mt-2">€{(premiumUsers * parseFloat(getSettingValue("premium_price") || "119.99")).toFixed(2)}</p>
                    <p className="text-sm text-gray-500">Based on current premium users at yearly rate</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="p-4 border rounded-lg bg-blue-50">
                    <h4 className="font-medium text-blue-900">Pricing Model</h4>
                    <p className="text-sm text-blue-700 mt-1">Annual billing cycle</p>
                    <p className="text-sm text-blue-600">Direct annual billing</p>
                  </div>

                  <div className="p-4 border rounded-lg bg-green-50">
                    <h4 className="font-medium text-green-900">Revenue Per User</h4>
                    <p className="text-xl font-bold text-green-800 mt-1">€{getSettingValue("premium_price") || "119.99"}</p>
                    <p className="text-sm text-green-600">Per year</p>
                  </div>

                  <div className="p-4 border rounded-lg bg-purple-50">
                    <h4 className="font-medium text-purple-900">Trial Period</h4>
                    <p className="text-xl font-bold text-purple-800 mt-1">{getSettingValue("trial_days") || "14"} days</p>
                    <p className="text-sm text-purple-600">Free access period</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}