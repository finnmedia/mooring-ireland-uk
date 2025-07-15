import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBookingSchema, insertUserSchema, loginUserSchema, registerUserSchema, insertMaritimeRouteSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import session from "express-session";
import connectPg from "connect-pg-simple";
import Stripe from "stripe";

// Session configuration
const PgSession = connectPg(session);
const sessionStore = new PgSession({
  conString: process.env.DATABASE_URL,
  createTableIfMissing: true,
});

// Stripe configuration
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-11-20.acacia",
});

// Authentication middleware
interface AuthenticatedRequest extends Request {
  user?: { id: number; email: string; role: string; subscriptionStatus: string };
}

const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.session || !(req.session as any).userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  const user = await storage.getUser((req.session as any).userId);
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }
  
  req.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    subscriptionStatus: user.subscriptionStatus
  };
  
  next();
};

const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "development-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = registerUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
      });

      // Set session
      (req.session as any).userId = user.id;

      res.json({ 
        id: user.id, 
        email: user.email, 
        name: user.name,
        subscriptionStatus: user.subscriptionStatus,
        role: user.role
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginUserSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set session
      (req.session as any).userId = user.id;

      res.json({ 
        id: user.id, 
        email: user.email, 
        name: user.name,
        subscriptionStatus: user.subscriptionStatus,
        role: user.role
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session?.destroy(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  // Update profile information
  app.put("/api/auth/profile", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { name, email } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ message: "Name and email are required" });
      }

      // Check if email is already taken by another user
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && existingUser.id !== req.user!.id) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Update user profile
      const updatedUser = await storage.updateUserProfile(req.user!.id, { name, email });
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        subscriptionStatus: updatedUser.subscriptionStatus,
        role: updatedUser.role,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to update profile" });
    }
  });

  // Change password
  app.put("/api/auth/password", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new passwords are required" });
      }

      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      // Update password
      const updatedUser = await storage.updateUserPassword(req.user!.id, hashedPassword);
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update password" });
      }

      res.json({ message: "Password updated successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to change password" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req: AuthenticatedRequest, res) => {
    const user = await storage.getUser(req.user!.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      subscriptionStatus: user.subscriptionStatus,
      role: user.role,
    });
  });

  // Admin routes
  app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        subscriptionStatus: user.subscriptionStatus,
        role: user.role,
        createdAt: user.createdAt,
      })));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Freemium middleware for mooring data
  const filterLocationData = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    res.locals.isPremium = req.user?.subscriptionStatus === "premium";
    next();
  };
  // Public access with optional authentication for enhanced features
  const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.session && (req.session as any).userId) {
      const user = await storage.getUser((req.session as any).userId);
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          subscriptionStatus: user.subscriptionStatus
        };
      }
    }
    next();
  };

  // Get all mooring locations (public with freemium filtering)
  app.get("/api/mooring-locations", optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const locations = await storage.getAllMooringLocations();
      const isPremium = req.user?.subscriptionStatus === "premium";
      const isRegistered = !!req.user;
      
      // Filter data based on subscription status
      const filteredLocations = locations.map(location => {
        if (isPremium) {
          return location; // Premium users see everything
        } else {
          // Anonymous users see basic info to encourage premium signup
          return {
            ...location,
            phone: "💰 Upgrade to Premium for contact details",
            email: "💰 Upgrade to Premium for contact details",
            website: location.website ? "💰 Upgrade to Premium to access website" : undefined,
            description: location.description ? 
              location.description.substring(0, 80) + "... 💰 Upgrade to Premium for full details" :
              "💰 Upgrade to Premium for complete facility information and contact details",
            // Hide facility details for non-premium users
            hasFuel: false,
            hasWater: false,
            hasElectricity: false,
            hasWasteDisposal: false,
            hasShowers: false,
            hasRestaurant: false,
            hasWifi: false,
            hasLaundry: false,
            hasParking: false
          };
        }
      });
      
      res.json(filteredLocations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch mooring locations" });
    }
  });

  // Get mooring location by ID (public with freemium filtering)
  app.get("/api/mooring-locations/:id", optionalAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid location ID" });
      }

      const location = await storage.getMooringLocationById(id);
      if (!location) {
        return res.status(404).json({ message: "Location not found" });
      }

      const isPremium = req.user?.subscriptionStatus === "premium";
      const isRegistered = !!req.user;

      // Filter data based on subscription status
      if (isPremium) {
        res.json(location);
      } else {
        // Non-premium users (both anonymous and registered) see limited info
        res.json({
          ...location,
          phone: "💰 Upgrade to Premium for contact details",
          email: "💰 Upgrade to Premium for contact details",
          website: location.website ? "💰 Upgrade to Premium to access website" : undefined,
          description: location.description ? 
            location.description.substring(0, 120) + "... 💰 Upgrade to Premium for full details" :
            "💰 Upgrade to Premium for complete facility information and contact details",
          // Hide facility details for non-premium users
          hasFuel: false,
          hasWater: false,
          hasElectricity: false,
          hasWasteDisposal: false,
          hasShowers: false,
          hasRestaurant: false,
          hasWifi: false,
          hasLaundry: false,
          hasParking: false
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch location" });
    }
  });

  // Filter mooring locations
  app.get("/api/mooring-locations/filter", async (req, res) => {
    try {
      const { type, region, search } = req.query;
      
      let locations = await storage.getAllMooringLocations();

      if (search && typeof search === 'string') {
        locations = await storage.searchMooringLocations(search);
      }

      if (type && typeof type === 'string') {
        locations = locations.filter(location => location.type === type);
      }

      if (region && typeof region === 'string') {
        locations = locations.filter(location => location.region === region);
      }

      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "Failed to filter locations" });
    }
  });

  // Search mooring locations
  app.get("/api/mooring-locations/search", async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }

      const locations = await storage.searchMooringLocations(q);
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "Failed to search locations" });
    }
  });

  // Booking endpoints
  app.get("/api/bookings", async (req, res) => {
    try {
      const bookings = await storage.getAllBookings();
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookings" });
    }
  });

  app.get("/api/bookings/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid booking ID" });
      }

      const booking = await storage.getBookingById(id);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch booking" });
    }
  });

  app.get("/api/bookings/location/:locationId", async (req, res) => {
    try {
      const locationId = parseInt(req.params.locationId);
      if (isNaN(locationId)) {
        return res.status(400).json({ message: "Invalid location ID" });
      }

      const bookings = await storage.getBookingsByLocation(locationId);
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch location bookings" });
    }
  });

  app.post("/api/bookings", requireAuth, async (req: AuthenticatedRequest, res) => {
    // Only premium users can make bookings
    if (req.user?.subscriptionStatus !== "premium") {
      return res.status(403).json({ 
        message: "Booking feature requires premium subscription",
        upgradeRequired: true 
      });
    }

    try {
      const result = insertBookingSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid booking data", 
          errors: result.error.issues 
        });
      }

      const booking = await storage.createBooking(result.data);
      res.status(201).json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to create booking" });
    }
  });

  app.patch("/api/bookings/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid booking ID" });
      }

      const { status } = req.body;
      if (!status || typeof status !== 'string') {
        return res.status(400).json({ message: "Status is required" });
      }

      const booking = await storage.updateBookingStatus(id, status);
      if (!booking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      res.json(booking);
    } catch (error) {
      res.status(500).json({ message: "Failed to update booking status" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Public endpoint for accessing specific settings needed for pricing display
  app.get("/api/public/settings", async (req, res) => {
    try {
      const settings = await storage.getAllPlatformSettings();
      // Only return non-sensitive settings
      const publicSettings = settings.filter(setting => 
        ['premium_price', 'trial_days'].includes(setting.key)
      );
      res.json(publicSettings);
    } catch (error) {
      console.error("Error fetching public settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.get("/api/admin/settings", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const settings = await storage.getAllPlatformSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post("/api/admin/settings", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { key, value, description } = req.body;
      if (!key || !value) {
        return res.status(400).json({ message: "Key and value are required" });
      }
      const setting = await storage.setPlatformSetting({ key, value, description });
      res.json(setting);
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  app.get("/api/admin/promo-codes", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const promoCodes = await storage.getAllPromoCodes();
      res.json(promoCodes);
    } catch (error) {
      console.error("Error fetching promo codes:", error);
      res.status(500).json({ message: "Failed to fetch promo codes" });
    }
  });

  app.post("/api/admin/promo-codes", requireAuth, requireAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { code, description, discountType, discountValue, maxUses, expiresAt } = req.body;
      if (!code || !discountValue) {
        return res.status(400).json({ message: "Code and discount value are required" });
      }
      
      // Check if code already exists
      const existing = await storage.getPromoCodeByCode(code);
      if (existing) {
        return res.status(400).json({ message: "Promo code already exists" });
      }

      const promoCode = await storage.createPromoCode({
        code,
        description,
        discountType,
        discountValue,
        maxUses,
        expiresAt,
        isActive: true,
        currentUses: 0
      });
      res.json(promoCode);
    } catch (error) {
      console.error("Error creating promo code:", error);
      res.status(500).json({ message: "Failed to create promo code" });
    }
  });

  // Promo code validation endpoint
  app.post("/api/validate-promo-code", async (req: AuthenticatedRequest, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ valid: false, message: "Promo code is required" });
      }

      const promoCode = await storage.getPromoCodeByCode(code);
      
      if (!promoCode) {
        return res.status(400).json({ valid: false, message: "Invalid promo code" });
      }

      if (!promoCode.isActive) {
        return res.status(400).json({ valid: false, message: "This promo code is no longer active" });
      }

      if (promoCode.expiresAt && new Date() > promoCode.expiresAt) {
        return res.status(400).json({ valid: false, message: "This promo code has expired" });
      }

      if (promoCode.maxUses && promoCode.currentUses >= promoCode.maxUses) {
        return res.status(400).json({ valid: false, message: "This promo code has reached its usage limit" });
      }

      res.json({
        valid: true,
        discount: parseFloat(promoCode.discountValue || "0"),
        code: promoCode.code,
      });
    } catch (error: any) {
      console.error("Error validating promo code:", error);
      res.status(500).json({ valid: false, message: "Error validating promo code" });
    }
  });

  // Stripe subscription endpoints
  app.post("/api/create-subscription", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const { promoCode } = req.body;
      
      // Check if user already has premium subscription
      if (user.subscriptionStatus === "premium") {
        return res.status(400).json({ message: "User already has premium subscription" });
      }

      // Get or create Stripe customer
      let customer;
      const existingUser = await storage.getUser(user.id);
      
      if (existingUser?.stripeCustomerId) {
        customer = await stripe.customers.retrieve(existingUser.stripeCustomerId);
      } else {
        customer = await stripe.customers.create({
          email: user.email,
          name: existingUser?.name || user.email.split('@')[0],
        });
        
        // Update user with Stripe customer ID
        await storage.updateUserStripeInfo(user.id, customer.id);
      }

      // Get premium price from settings
      const premiumPriceSetting = await storage.getPlatformSetting("premium_price");
      let premiumPrice = premiumPriceSetting ? parseFloat(premiumPriceSetting.value) : 119.99;
      
      let appliedPromoCode = null;
      let discountAmount = 0;
      
      // Apply promo code if provided
      if (promoCode) {
        const promo = await storage.getPromoCodeByCode(promoCode);
        
        if (!promo) {
          return res.status(400).json({ message: "Invalid promo code" });
        }
        
        if (!promo.isActive) {
          return res.status(400).json({ message: "This promo code is no longer active" });
        }
        
        if (promo.expiresAt && new Date() > promo.expiresAt) {
          return res.status(400).json({ message: "This promo code has expired" });
        }
        
        if (promo.maxUses && promo.currentUses >= promo.maxUses) {
          return res.status(400).json({ message: "This promo code has reached its usage limit" });
        }
        
        appliedPromoCode = promo;
        discountAmount = (premiumPrice * parseFloat(promo.discountValue)) / 100;
        
        // If it's a 100% discount, grant premium access immediately without going through Stripe
        if (parseFloat(promo.discountValue) >= 100) {
          // Update promo code usage
          await storage.updatePromoCodeUses(promo.id, promo.currentUses + 1);
          
          // Grant premium access for 1 year
          const expiryDate = new Date();
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
          await storage.updateUserSubscription(user.id, "premium", expiryDate);
          
          return res.json({
            success: true,
            message: "100% discount applied! Premium access granted immediately.",
            subscriptionStatus: "premium",
            expiryDate: expiryDate,
            freeUpgrade: true
          });
        }
        
        premiumPrice = premiumPrice - discountAmount;
        
        // Update promo code usage
        await storage.updatePromoCodeUses(promo.id, promo.currentUses + 1);
      }

      // Create or get product
      let product;
      try {
        // Try to retrieve existing product
        const products = await stripe.products.list({ limit: 1 });
        product = products.data.find(p => p.name === 'Mooring Ireland Premium');
        
        if (!product) {
          // Create new product
          product = await stripe.products.create({
            name: 'Mooring Ireland Premium',
            description: 'Annual premium subscription with full access to all marine facilities',
          });
        }
      } catch (error) {
        // Create new product as fallback
        product = await stripe.products.create({
          name: 'Mooring Ireland Premium',
          description: 'Annual premium subscription with full access to all marine facilities',
        });
      }

      // Create price
      const price = await stripe.prices.create({
        currency: 'eur',
        unit_amount: Math.round(premiumPrice * 100),
        recurring: {
          interval: 'year',
        },
        product: product.id,
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: price.id,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: user.id.toString(),
          promoCode: appliedPromoCode?.code || '',
          originalPrice: premiumPriceSetting?.value || "119.99",
          discountAmount: discountAmount.toString(),
        },
      });

      // Update user with subscription ID
      await storage.updateUserStripeInfo(user.id, customer.id, subscription.id);

      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

      // Regular subscription with immediate payment
      res.json({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent?.client_secret || null,
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Failed to create subscription: " + error.message });
    }
  });

  // Handle successful subscription payment
  app.post("/api/subscription-success", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { subscriptionId } = req.body;
      
      if (!subscriptionId) {
        return res.status(400).json({ message: "Subscription ID is required" });
      }

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      if (subscription.status === 'active' || subscription.status === 'trialing') {
        // Update user to premium status
        const expiryDate = new Date(subscription.current_period_end * 1000);
        await storage.updateUserSubscription(req.user!.id, "premium", expiryDate);
        
        res.json({ 
          success: true, 
          message: "Subscription activated successfully",
          subscriptionStatus: subscription.status,
          expiryDate: expiryDate
        });
      } else {
        res.status(400).json({ message: "Subscription is not active" });
      }
    } catch (error: any) {
      console.error("Error processing subscription success:", error);
      res.status(500).json({ message: "Failed to process subscription: " + error.message });
    }
  });

  // Cancel subscription endpoint
  app.post("/api/cancel-subscription", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      
      if (!user || !user.stripeSubscriptionId) {
        return res.status(400).json({ message: "No active subscription found" });
      }

      // Cancel the subscription at period end (so user retains access until billing period ends)
      const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      res.json({ 
        success: true, 
        message: "Subscription scheduled for cancellation at period end",
        cancelAt: new Date(subscription.current_period_end * 1000)
      });
    } catch (error: any) {
      console.error("Error cancelling subscription:", error);
      res.status(500).json({ message: "Failed to cancel subscription: " + error.message });
    }
  });

  // Stripe webhook endpoint for handling subscription events
  app.post('/api/stripe-webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET || '');
    } catch (err: any) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object as Stripe.Subscription;
        // Find user by Stripe customer ID and update subscription status
        const users = await storage.getAllUsers();
        const user = users.find(u => u.stripeCustomerId === subscription.customer);
        
        if (user) {
          const status = subscription.status === 'active' || subscription.status === 'trialing' ? 'premium' : 'free';
          const expiryDate = new Date(subscription.current_period_end * 1000);
          await storage.updateUserSubscription(user.id, status, expiryDate);
        }
        break;
        
      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        const allUsers = await storage.getAllUsers();
        const deletedUser = allUsers.find(u => u.stripeCustomerId === deletedSubscription.customer);
        
        if (deletedUser) {
          await storage.updateUserSubscription(deletedUser.id, 'free');
        }
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });

  // Maritime route sharing endpoints
  app.get("/api/maritime-routes", async (req, res) => {
    try {
      const routes = await storage.getAllMaritimeRoutes();
      res.json(routes);
    } catch (error) {
      console.error("Error fetching maritime routes:", error);
      res.status(500).json({ message: "Failed to fetch maritime routes" });
    }
  });

  app.get("/api/maritime-routes/:shareId", async (req, res) => {
    try {
      const { shareId } = req.params;
      const route = await storage.getMaritimeRouteByShareId(shareId);
      
      if (!route) {
        return res.status(404).json({ message: "Maritime route not found" });
      }

      // Update view count
      await storage.updateRouteViewCount(shareId);
      
      res.json(route);
    } catch (error) {
      console.error("Error fetching maritime route:", error);
      res.status(500).json({ message: "Failed to fetch maritime route" });
    }
  });

  app.post("/api/maritime-routes", async (req: AuthenticatedRequest, res) => {
    try {
      const result = insertMaritimeRouteSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          message: "Invalid route data", 
          errors: result.error.issues 
        });
      }

      // Add the creator's user ID if authenticated
      const routeData = {
        ...result.data,
        createdById: req.user?.id || null
      };

      const route = await storage.createMaritimeRoute(routeData);
      res.status(201).json(route);
    } catch (error) {
      console.error("Error creating maritime route:", error);
      res.status(500).json({ message: "Failed to create maritime route" });
    }
  });

  app.get("/api/users/:userId/maritime-routes", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Users can only access their own routes (unless admin)
      if (req.user?.id !== userId && req.user?.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const routes = await storage.getRoutesByUser(userId);
      res.json(routes);
    } catch (error) {
      console.error("Error fetching user routes:", error);
      res.status(500).json({ message: "Failed to fetch user routes" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
