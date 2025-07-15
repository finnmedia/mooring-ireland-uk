import { 
  mooringLocations, 
  bookings, 
  users,
  platformSettings,
  promoCodes,
  maritimeRoutes,
  type MooringLocation, 
  type InsertMooringLocation, 
  type User, 
  type InsertUser, 
  type Booking, 
  type InsertBooking,
  type PlatformSetting,
  type InsertPlatformSetting,
  type PromoCode,
  type InsertPromoCode,
  type MaritimeRoute,
  type InsertMaritimeRoute,
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or } from "drizzle-orm";

export interface IStorage {
  // User authentication operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserSubscription(id: number, status: string, expiresAt?: Date): Promise<User | undefined>;
  updateUserStripeInfo(id: number, customerId?: string, subscriptionId?: string): Promise<User | undefined>;
  updateUserProfile(id: number, data: { name?: string; email?: string }): Promise<User | undefined>;
  updateUserPassword(id: number, hashedPassword: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  getUsersBySubscription(status: string): Promise<User[]>;
  
  getAllMooringLocations(): Promise<MooringLocation[]>;
  getMooringLocationById(id: number): Promise<MooringLocation | undefined>;
  getMooringLocationsByType(type: string): Promise<MooringLocation[]>;
  getMooringLocationsByRegion(region: string): Promise<MooringLocation[]>;
  searchMooringLocations(query: string): Promise<MooringLocation[]>;
  createMooringLocation(location: InsertMooringLocation): Promise<MooringLocation>;
  
  getAllBookings(): Promise<Booking[]>;
  getBookingById(id: number): Promise<Booking | undefined>;
  getBookingsByLocation(locationId: number): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBookingStatus(id: number, status: string): Promise<Booking | undefined>;
  
  // Platform settings operations
  getPlatformSetting(key: string): Promise<PlatformSetting | undefined>;
  setPlatformSetting(setting: InsertPlatformSetting): Promise<PlatformSetting>;
  getAllPlatformSettings(): Promise<PlatformSetting[]>;
  
  // Promo code operations
  getAllPromoCodes(): Promise<PromoCode[]>;
  getPromoCodeByCode(code: string): Promise<PromoCode | undefined>;
  createPromoCode(promoCode: InsertPromoCode): Promise<PromoCode>;
  updatePromoCodeUses(id: number, currentUses: number): Promise<PromoCode | undefined>;
  deactivatePromoCode(id: number): Promise<PromoCode | undefined>;
  
  // Maritime route operations
  getAllMaritimeRoutes(): Promise<MaritimeRoute[]>;
  getMaritimeRouteByShareId(shareId: string): Promise<MaritimeRoute | undefined>;
  getMaritimeRouteById(id: number): Promise<MaritimeRoute | undefined>;
  createMaritimeRoute(route: InsertMaritimeRoute): Promise<MaritimeRoute>;
  updateRouteViewCount(shareId: string): Promise<MaritimeRoute | undefined>;
  getRoutesByUser(userId: number): Promise<MaritimeRoute[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private mooringLocations: Map<number, MooringLocation>;
  private currentUserId: number;
  private currentLocationId: number;

  constructor() {
    this.users = new Map();
    this.mooringLocations = new Map();
    this.currentUserId = 1;
    this.currentLocationId = 1;
    
    // Initialize with realistic Irish mooring locations
    this.initializeMooringData();
  }

  private initializeMooringData() {
    const locations: Omit<MooringLocation, 'id'>[] = [
      {
        name: "Dingle Marina",
        address: "Marina Road, Dingle",
        county: "Kerry",
        region: "Southwest",
        type: "marina",
        latitude: 52.140369,
        longitude: -10.272496,
        capacity: 45,
        depth: 3.5,
        hasFuel: true,
        hasWater: true,
        hasElectricity: true,
        hasWasteDisposal: true,
        hasShowers: true,
        hasRestaurant: true,
        phone: "+353 66 915 2222",
        email: "marina@dinglemarina.ie",
        website: "www.dinglemarina.ie",
        description: "Full-service marina in the heart of Dingle town with excellent facilities."
      },
      {
        name: "Howth Marina",
        address: "Howth Harbour, Howth",
        county: "Dublin",
        region: "East Coast",
        type: "marina",
        latitude: 53.390556,
        longitude: -6.065833,
        capacity: 180,
        depth: 4.2,
        hasFuel: true,
        hasWater: true,
        hasElectricity: true,
        hasWasteDisposal: true,
        hasShowers: true,
        hasRestaurant: true,
        phone: "+353 1 832 2252",
        email: "info@howthmarina.ie",
        website: "www.howthmarina.ie",
        description: "Premier marina facility in Dublin Bay with full services and amenities."
      },
      {
        name: "Ballycotton Pier",
        address: "Ballycotton Harbour, Ballycotton",
        county: "Cork",
        region: "South Coast",
        type: "pier",
        latitude: 51.825556,
        longitude: -7.984167,
        capacity: 12,
        depth: 2.8,
        hasFuel: false,
        hasWater: true,
        hasElectricity: false,
        hasWasteDisposal: false,
        hasShowers: false,
        hasRestaurant: false,
        phone: "+353 21 464 6718",
        email: "harbourmaster@ballycotton.ie",
        website: "www.ballycottonharbour.ie",
        description: "Small fishing pier with basic facilities for visiting boats."
      },
      {
        name: "Kilmore Quay Jetty",
        address: "Kilmore Quay Harbour",
        county: "Wexford",
        region: "Southeast",
        type: "jetty",
        latitude: 52.173056,
        longitude: -6.585833,
        capacity: 8,
        depth: 2.1,
        hasFuel: false,
        hasWater: true,
        hasElectricity: false,
        hasWasteDisposal: false,
        hasShowers: false,
        hasRestaurant: false,
        phone: "+353 53 912 9684",
        email: "info@kilmorequay.ie",
        website: "www.kilmorequayharbour.com",
        description: "Traditional fishing jetty with basic mooring facilities."
      },
      {
        name: "Galway Docks Marina",
        address: "New Dock Road, Galway",
        county: "Galway",
        region: "West Coast",
        type: "marina",
        latitude: 53.270833,
        longitude: -9.053611,
        capacity: 95,
        depth: 3.8,
        hasFuel: true,
        hasWater: true,
        hasElectricity: true,
        hasWasteDisposal: true,
        hasShowers: true,
        hasRestaurant: false,
        phone: "+353 91 561 874",
        email: "marina@galwaydocks.ie",
        website: "www.galwaydocks.ie",
        description: "Modern marina in Galway city with excellent access to the city center."
      },
      {
        name: "Belfast Marina",
        address: "Sydenham Road, Belfast",
        county: "Antrim",
        region: "North Coast",
        type: "marina",
        latitude: 54.602778,
        longitude: -5.890556,
        capacity: 120,
        depth: 4.0,
        hasFuel: true,
        hasWater: true,
        hasElectricity: true,
        hasWasteDisposal: true,
        hasShowers: true,
        hasRestaurant: true,
        phone: "+44 28 9073 7368",
        email: "info@belfastmarina.com",
        website: "www.belfastmarina.com",
        description: "State-of-the-art marina facility in Belfast Lough."
      },
      {
        name: "Kinsale Marina",
        address: "Pier Road, Kinsale",
        county: "Cork",
        region: "South Coast",
        type: "marina",
        latitude: 51.707222,
        longitude: -8.530556,
        capacity: 75,
        depth: 3.2,
        hasFuel: true,
        hasWater: true,
        hasElectricity: true,
        hasWasteDisposal: true,
        hasShowers: true,
        hasRestaurant: true,
        phone: "+353 21 477 4959",
        email: "marina@kinsale.ie",
        website: "www.kinsalemarina.ie",
        description: "Beautiful marina in the historic town of Kinsale."
      },
      {
        name: "Dunmore East Pier",
        address: "Harbour Road, Dunmore East",
        county: "Waterford",
        region: "Southeast",
        type: "pier",
        latitude: 52.150278,
        longitude: -6.995833,
        capacity: 15,
        depth: 2.5,
        hasFuel: false,
        hasWater: true,
        hasElectricity: true,
        hasWasteDisposal: false,
        hasShowers: false,
        hasRestaurant: false,
        phone: "+353 51 383 166",
        email: "harbour@dunmoreeast.ie",
        website: "www.dunmoreeastharbour.com",
        description: "Picturesque fishing pier with good shelter and basic facilities."
      },
      {
        name: "Killybegs Marina",
        address: "Harbour Road, Killybegs",
        county: "Donegal",
        region: "Northwest",
        type: "marina",
        latitude: 54.631667,
        longitude: -8.448333,
        capacity: 40,
        depth: 4.5,
        hasFuel: true,
        hasWater: true,
        hasElectricity: true,
        hasWasteDisposal: true,
        hasShowers: true,
        hasRestaurant: false,
        phone: "+353 74 973 1518",
        email: "marina@killybegsport.ie",
        website: "www.killybegsport.ie",
        description: "Ireland's premier fishing port with excellent facilities for visiting yachts."
      },
      {
        name: "Bundoran Marina",
        address: "Harbour View, Bundoran",
        county: "Donegal",
        region: "Northwest",
        type: "marina",
        latitude: 54.478056,
        longitude: -8.283611,
        capacity: 25,
        depth: 3.0,
        hasFuel: false,
        hasWater: true,
        hasElectricity: true,
        hasWasteDisposal: true,
        hasShowers: true,
        hasRestaurant: true,
        phone: "+353 71 984 1350",
        email: "marina@bundorantourism.ie",
        website: "www.bundoranmarina.ie",
        description: "Scenic marina in the popular seaside resort town of Bundoran."
      },
      {
        name: "Rathmullan Pier",
        address: "Pier Road, Rathmullan",
        county: "Donegal",
        region: "Northwest",
        type: "pier",
        latitude: 55.095833,
        longitude: -7.533056,
        capacity: 12,
        depth: 2.8,
        hasFuel: false,
        hasWater: true,
        hasElectricity: false,
        hasWasteDisposal: false,
        hasShowers: false,
        hasRestaurant: false,
        phone: "+353 74 915 8188",
        email: "pier@rathmullan.ie",
        website: "www.rathmullanharbour.com",
        description: "Historic pier on Lough Swilly with beautiful mountain views."
      },
      {
        name: "Bangor Marina",
        address: "Marina Road, Bangor",
        county: "Down",
        region: "North Coast",
        type: "marina",
        latitude: 54.665278,
        longitude: -5.668056,
        capacity: 280,
        depth: 4.2,
        hasFuel: true,
        hasWater: true,
        hasElectricity: true,
        hasWasteDisposal: true,
        hasShowers: true,
        hasRestaurant: true,
        phone: "+44 28 9145 3297",
        email: "info@bangormarina.com",
        website: "www.bangormarina.com",
        description: "Award-winning marina facility in Belfast Lough with comprehensive services."
      },
      {
        name: "Carrickfergus Marina",
        address: "Marine Highway, Carrickfergus",
        county: "Antrim",
        region: "North Coast",
        type: "marina",
        latitude: 54.715833,
        longitude: -5.806944,
        capacity: 300,
        depth: 3.8,
        hasFuel: true,
        hasWater: true,
        hasElectricity: true,
        hasWasteDisposal: true,
        hasShowers: true,
        hasRestaurant: true,
        phone: "+44 28 9336 6666",
        email: "marina@carrickfergus.org",
        website: "www.carrickfergusmarina.co.uk",
        description: "Large modern marina near historic Carrickfergus Castle."
      },
      {
        name: "Ballycastle Harbour",
        address: "The Harbour, Ballycastle",
        county: "Antrim",
        region: "North Coast",
        type: "pier",
        latitude: 55.206944,
        longitude: -6.235278,
        capacity: 18,
        depth: 2.5,
        hasFuel: false,
        hasWater: true,
        hasElectricity: true,
        hasWasteDisposal: false,
        hasShowers: false,
        hasRestaurant: false,
        phone: "+44 28 2076 2024",
        email: "harbour@ballycastle.gov.uk",
        website: "www.ballycastleharbour.com",
        description: "Traditional fishing harbour on the famous Causeway Coast."
      },
      {
        name: "Coleraine Marina",
        address: "Marina Road, Coleraine",
        county: "Londonderry",
        region: "North Coast",
        type: "marina",
        latitude: 55.132778,
        longitude: -6.668056,
        capacity: 50,
        depth: 3.5,
        hasFuel: true,
        hasWater: true,
        hasElectricity: true,
        hasWasteDisposal: true,
        hasShowers: true,
        hasRestaurant: false,
        phone: "+44 28 7034 4768",
        email: "marina@coleraine.gov.uk",
        website: "www.colerainemarina.co.uk",
        description: "River marina on the Lower Bann with good access to the north coast."
      },
      {
        name: "Greencastle Pier",
        address: "Pier Road, Greencastle",
        county: "Donegal",
        region: "Northwest",
        type: "pier",
        latitude: 55.199167,
        longitude: -6.998333,
        capacity: 8,
        depth: 2.2,
        hasFuel: false,
        hasWater: true,
        hasElectricity: false,
        hasWasteDisposal: false,
        hasShowers: false,
        hasRestaurant: false,
        phone: "+353 74 938 1049",
        email: "greencastle@donegalcoco.ie",
        website: "www.greencastlepier.ie",
        description: "Small fishing pier at the mouth of Lough Foyle."
      }
    ];

    locations.forEach(location => {
      const id = this.currentLocationId++;
      this.mooringLocations.set(id, { ...location, id });
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllMooringLocations(): Promise<MooringLocation[]> {
    return Array.from(this.mooringLocations.values());
  }

  async getMooringLocationById(id: number): Promise<MooringLocation | undefined> {
    return this.mooringLocations.get(id);
  }

  async getMooringLocationsByType(type: string): Promise<MooringLocation[]> {
    return Array.from(this.mooringLocations.values()).filter(
      location => location.type === type
    );
  }

  async getMooringLocationsByRegion(region: string): Promise<MooringLocation[]> {
    return Array.from(this.mooringLocations.values()).filter(
      location => location.region === region
    );
  }

  async searchMooringLocations(query: string): Promise<MooringLocation[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.mooringLocations.values()).filter(location =>
      location.name.toLowerCase().includes(searchTerm) ||
      location.address.toLowerCase().includes(searchTerm) ||
      location.county.toLowerCase().includes(searchTerm) ||
      location.region.toLowerCase().includes(searchTerm)
    );
  }

  async createMooringLocation(insertLocation: InsertMooringLocation): Promise<MooringLocation> {
    const id = this.currentLocationId++;
    const location: MooringLocation = { 
      ...insertLocation, 
      id,
      description: insertLocation.description || null,
      phone: insertLocation.phone || null,
      email: insertLocation.email || null,
      website: insertLocation.website || null,
      hasFuel: insertLocation.hasFuel || false,
      hasWater: insertLocation.hasWater || false,
      hasElectricity: insertLocation.hasElectricity || false,
      hasWasteDisposal: insertLocation.hasWasteDisposal || false,
      hasShowers: insertLocation.hasShowers || false,
      hasRestaurant: insertLocation.hasRestaurant || false
    };
    this.mooringLocations.set(id, location);
    return location;
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserSubscription(id: number, status: string, expiresAt?: Date): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        subscriptionStatus: status, 
        subscriptionExpiresAt: expiresAt,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserStripeInfo(id: number, customerId?: string, subscriptionId?: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserProfile(id: number, data: { name?: string; email?: string }): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        ...data,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async updateUserPassword(id: number, hashedPassword: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role));
  }

  async getUsersBySubscription(status: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.subscriptionStatus, status));
  }

  async getAllMooringLocations(): Promise<MooringLocation[]> {
    return await db.select().from(mooringLocations);
  }

  async getMooringLocationById(id: number): Promise<MooringLocation | undefined> {
    const [location] = await db.select().from(mooringLocations).where(eq(mooringLocations.id, id));
    return location || undefined;
  }

  async getMooringLocationsByType(type: string): Promise<MooringLocation[]> {
    return await db.select().from(mooringLocations).where(eq(mooringLocations.type, type));
  }

  async getMooringLocationsByRegion(region: string): Promise<MooringLocation[]> {
    return await db.select().from(mooringLocations).where(eq(mooringLocations.region, region));
  }

  async searchMooringLocations(query: string): Promise<MooringLocation[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await db.select().from(mooringLocations).where(
      // Note: This is a simplified search. In production, you'd use a proper full-text search
      eq(mooringLocations.name, query)
    );
  }

  async createMooringLocation(insertLocation: InsertMooringLocation): Promise<MooringLocation> {
    const [location] = await db
      .insert(mooringLocations)
      .values(insertLocation)
      .returning();
    return location;
  }

  async getAllBookings(): Promise<Booking[]> {
    return await db.select().from(bookings);
  }

  async getBookingById(id: number): Promise<Booking | undefined> {
    const [booking] = await db.select().from(bookings).where(eq(bookings.id, id));
    return booking || undefined;
  }

  async getBookingsByLocation(locationId: number): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.mooringLocationId, locationId));
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const [booking] = await db
      .insert(bookings)
      .values(insertBooking)
      .returning();
    return booking;
  }

  async updateBookingStatus(id: number, status: string): Promise<Booking | undefined> {
    const [booking] = await db
      .update(bookings)
      .set({ status })
      .where(eq(bookings.id, id))
      .returning();
    return booking || undefined;
  }

  // Platform settings operations
  async getPlatformSetting(key: string): Promise<PlatformSetting | undefined> {
    const [setting] = await db.select().from(platformSettings).where(eq(platformSettings.key, key));
    return setting || undefined;
  }

  async setPlatformSetting(insertSetting: InsertPlatformSetting): Promise<PlatformSetting> {
    const [setting] = await db
      .insert(platformSettings)
      .values(insertSetting)
      .onConflictDoUpdate({
        target: platformSettings.key,
        set: {
          value: insertSetting.value,
          description: insertSetting.description,
          updatedAt: new Date(),
        },
      })
      .returning();
    return setting;
  }

  async getAllPlatformSettings(): Promise<PlatformSetting[]> {
    return await db.select().from(platformSettings);
  }

  // Promo code operations
  async getAllPromoCodes(): Promise<PromoCode[]> {
    return await db.select().from(promoCodes);
  }

  async getPromoCodeByCode(code: string): Promise<PromoCode | undefined> {
    const [promoCode] = await db.select().from(promoCodes).where(eq(promoCodes.code, code));
    return promoCode || undefined;
  }

  async createPromoCode(insertPromoCode: InsertPromoCode): Promise<PromoCode> {
    const [promoCode] = await db
      .insert(promoCodes)
      .values(insertPromoCode)
      .returning();
    return promoCode;
  }

  async updatePromoCodeUses(id: number, currentUses: number): Promise<PromoCode | undefined> {
    const [promoCode] = await db
      .update(promoCodes)
      .set({ currentUses })
      .where(eq(promoCodes.id, id))
      .returning();
    return promoCode || undefined;
  }

  async deactivatePromoCode(id: number): Promise<PromoCode | undefined> {
    const [promoCode] = await db
      .update(promoCodes)
      .set({ isActive: false })
      .where(eq(promoCodes.id, id))
      .returning();
    return promoCode || undefined;
  }

  // Maritime route operations
  async getAllMaritimeRoutes(): Promise<MaritimeRoute[]> {
    return await db.select().from(maritimeRoutes);
  }

  async getMaritimeRouteByShareId(shareId: string): Promise<MaritimeRoute | undefined> {
    const [route] = await db.select().from(maritimeRoutes).where(eq(maritimeRoutes.shareId, shareId));
    return route || undefined;
  }

  async getMaritimeRouteById(id: number): Promise<MaritimeRoute | undefined> {
    const [route] = await db.select().from(maritimeRoutes).where(eq(maritimeRoutes.id, id));
    return route || undefined;
  }

  async createMaritimeRoute(insertRoute: InsertMaritimeRoute): Promise<MaritimeRoute> {
    // Generate a unique share ID
    const shareId = Math.random().toString(36).substring(2, 14);
    
    const [route] = await db
      .insert(maritimeRoutes)
      .values({
        ...insertRoute,
        shareId,
      })
      .returning();
    return route;
  }

  async updateRouteViewCount(shareId: string): Promise<MaritimeRoute | undefined> {
    const [route] = await db
      .update(maritimeRoutes)
      .set({ 
        viewCount: db.sql`${maritimeRoutes.viewCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(maritimeRoutes.shareId, shareId))
      .returning();
    return route || undefined;
  }

  async getRoutesByUser(userId: number): Promise<MaritimeRoute[]> {
    return await db.select().from(maritimeRoutes).where(eq(maritimeRoutes.createdById, userId));
  }
}

export const storage = new DatabaseStorage();
