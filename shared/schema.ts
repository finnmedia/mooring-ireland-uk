import { pgTable, text, serial, integer, boolean, real, timestamp, decimal, varchar, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const mooringLocations = pgTable("mooring_locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address").notNull(),
  county: text("county").notNull(),
  region: text("region").notNull(),
  type: text("type").notNull(), // 'pier', 'jetty', 'marina'
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  capacity: integer("capacity").notNull(),
  depth: real("depth").notNull(), // in meters
  hasFuel: boolean("has_fuel").default(false),
  hasWater: boolean("has_water").default(false),
  hasElectricity: boolean("has_electricity").default(false),
  hasWasteDisposal: boolean("has_waste_disposal").default(false),
  hasShowers: boolean("has_showers").default(false),
  hasRestaurant: boolean("has_restaurant").default(false),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  description: text("description"),
});

export const insertMooringLocationSchema = createInsertSchema(mooringLocations).omit({
  id: true,
});

export type InsertMooringLocation = z.infer<typeof insertMooringLocationSchema>;
export type MooringLocation = typeof mooringLocations.$inferSelect;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  subscriptionStatus: text("subscription_status").notNull().default("free"), // 'free', 'premium'
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  role: text("role").notNull().default("user"), // 'user', 'admin'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  name: true,
  password: true,
});

export const registerUserSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  mooringLocationId: integer("mooring_location_id").notNull().references(() => mooringLocations.id),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone"),
  boatName: text("boat_name"),
  boatLength: real("boat_length"), // in meters
  checkInDate: timestamp("check_in_date").notNull(),
  checkOutDate: timestamp("check_out_date").notNull(),
  numberOfNights: integer("number_of_nights").notNull(),
  totalPrice: real("total_price"), // in euros
  specialRequests: text("special_requests"),
  status: text("status").notNull().default("pending"), // pending, confirmed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// Platform settings for admin control
export const platformSettings = pgTable("platform_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertPlatformSettingSchema = createInsertSchema(platformSettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertPlatformSetting = z.infer<typeof insertPlatformSettingSchema>;
export type PlatformSetting = typeof platformSettings.$inferSelect;

// Promo codes
export const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description"),
  discountType: text("discount_type").notNull(), // 'percentage' or 'fixed'
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  maxUses: integer("max_uses"),
  currentUses: integer("current_uses").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPromoCodeSchema = createInsertSchema(promoCodes).omit({
  id: true,
  currentUses: true,
  createdAt: true,
});

export type InsertPromoCode = z.infer<typeof insertPromoCodeSchema>;
export type PromoCode = typeof promoCodes.$inferSelect;

// Maritime Routes Schema
export const maritimeRoutes = pgTable("maritime_routes", {
  id: serial("id").primaryKey(),
  shareId: varchar("share_id", { length: 12 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  startLocationId: integer("start_location_id").references(() => mooringLocations.id),
  endLocationId: integer("end_location_id").references(() => mooringLocations.id),
  waypoints: jsonb("waypoints").$type<Array<{
    locationId: number;
    order: number;
    name: string;
    coordinates: [number, number];
  }>>(),
  createdById: integer("created_by_id").references(() => users.id),
  isPublic: boolean("is_public").default(true),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMaritimeRouteSchema = createInsertSchema(maritimeRoutes).omit({
  id: true,
  shareId: true,
  viewCount: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMaritimeRoute = z.infer<typeof insertMaritimeRouteSchema>;
export type MaritimeRoute = typeof maritimeRoutes.$inferSelect;
