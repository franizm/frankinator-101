import { pgTable, text, serial, integer, timestamp, boolean, real, date } from "drizzle-orm/pg-core";  
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Custom Zod schemas for date handling
export const dateSchema = z.union([
  z.string(),
  z.date(),
  z.instanceof(Date)
]).transform(val => {
  if (val instanceof Date) {
    return val.toISOString();
  }
  if (typeof val === 'string') {
    // Check if it's a date string
    if (!isNaN(Date.parse(val))) {
      return val;
    }
    throw new Error('Invalid date string');
  }
  return val;
});

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["admin", "moderator"] }).default("moderator").notNull(),
  position: text("position"),
  email: text("email"),
  phone: text("phone"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

// Vehicle schema
export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  registrationNumber: text("registration_number").notNull(),
  vin: text("vin"),
  color: text("color"),
  status: text("status", { enum: ["available", "maintenance", "in_use", "out_of_service"] }).default("available").notNull(),
  mileage: integer("mileage").default(0).notNull(),
  fuelType: text("fuel_type"),
  assignedToId: integer("assigned_to_id").references(() => users.id),
  purchaseDate: date("purchase_date"),
  notes: text("notes"),
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
});

// Maintenance schema
export const maintenance = pgTable("maintenance", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  type: text("type", { enum: ["scheduled", "unscheduled", "repair"] }).notNull(),
  description: text("description").notNull(),
  date: date("date").notNull(),
  cost: real("cost"),
  odometer: integer("odometer"),
  status: text("status", { enum: ["pending", "in_progress", "completed"] }).default("pending").notNull(),
  notes: text("notes"),
  completedAt: timestamp("completed_at"),
});

export const insertMaintenanceSchema = createInsertSchema(maintenance)
  .omit({
    id: true,
  })
  .extend({
    // Override the date fields with our custom schema
    date: dateSchema,
    completedAt: dateSchema.optional().nullable(),
  });

// Trip schema
export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  driverId: integer("driver_id").notNull().references(() => users.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  startOdometer: integer("start_odometer").notNull(),
  endOdometer: integer("end_odometer"),
  fuelConsumed: real("fuel_consumed"),
  purpose: text("purpose"),
  status: text("status", { enum: ["planned", "in_progress", "completed", "cancelled"] }).default("planned").notNull(),
  notes: text("notes"),
});

export const insertTripSchema = createInsertSchema(trips)
  .omit({
    id: true,
  })
  .extend({
    // Override the date fields with our custom schema
    startTime: dateSchema,
    endTime: dateSchema.optional().nullable(),
  });

// Booking schema
export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull().references(() => vehicles.id),
  userId: integer("user_id").notNull().references(() => users.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  purpose: text("purpose"),
  status: text("status", { enum: ["pending", "approved", "declined", "cancelled", "completed"] }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBookingSchema = createInsertSchema(bookings)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    // Override the date fields with our custom schema
    startTime: dateSchema,
    endTime: dateSchema,
  });

// Define Types from Schemas
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

export type InsertMaintenance = z.infer<typeof insertMaintenanceSchema>;
export type Maintenance = typeof maintenance.$inferSelect;

export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof trips.$inferSelect;

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookings.$inferSelect;

// Define table relations for Drizzle ORM
export const usersRelations = relations(users, ({ many }) => ({
  assignedVehicles: many(vehicles),
  trips: many(trips, { relationName: "driver" }),
  bookings: many(bookings, { relationName: "user" })
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  assignedTo: one(users, {
    fields: [vehicles.assignedToId],
    references: [users.id]
  }),
  maintenanceRecords: many(maintenance),
  trips: many(trips),
  bookings: many(bookings)
}));

export const maintenanceRelations = relations(maintenance, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [maintenance.vehicleId],
    references: [vehicles.id]
  })
}));

export const tripsRelations = relations(trips, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [trips.vehicleId],
    references: [vehicles.id]
  }),
  driver: one(users, {
    fields: [trips.driverId],
    references: [users.id]
  })
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [bookings.vehicleId],
    references: [vehicles.id]
  }),
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id]
  })
}));

// Extended schema types
export type VehicleWithRelations = Vehicle & {
  assignedTo?: User;
  maintenanceRecords?: Maintenance[];
};

export type UserWithVehicles = User & {
  assignedVehicles?: Vehicle[];
};

export type TripWithRelations = Trip & {
  vehicle?: Vehicle;
  driver?: User;
};

export type BookingWithRelations = Booking & {
  vehicle?: Vehicle;
  user?: User;
};
