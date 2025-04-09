import { User, InsertUser, Vehicle, InsertVehicle, Maintenance, InsertMaintenance, Trip, InsertTrip, Booking, InsertBooking } from "@shared/schema";
import { users, vehicles, maintenance, trips, bookings } from "@shared/schema";
import { eq, and, desc, lt, gte, isNull, sql } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  listUsers(): Promise<User[]>;
  
  // Vehicle methods
  getVehicle(id: number): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: Partial<Vehicle>): Promise<Vehicle | undefined>;
  deleteVehicle(id: number): Promise<boolean>;
  listVehicles(filters?: { status?: string, make?: string, year?: number }): Promise<Vehicle[]>;
  
  // Maintenance methods
  getMaintenance(id: number): Promise<Maintenance | undefined>;
  createMaintenance(maintenance: InsertMaintenance): Promise<Maintenance>;
  updateMaintenance(id: number, maintenance: Partial<Maintenance>): Promise<Maintenance | undefined>;
  deleteMaintenance(id: number): Promise<boolean>;
  listMaintenanceForVehicle(vehicleId: number): Promise<Maintenance[]>;
  listUpcomingMaintenance(): Promise<Maintenance[]>;
  
  // Trip methods
  getTrip(id: number): Promise<Trip | undefined>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: number, trip: Partial<Trip>): Promise<Trip | undefined>;
  deleteTrip(id: number): Promise<boolean>;
  listTripsForVehicle(vehicleId: number): Promise<Trip[]>;
  listTripsForDriver(driverId: number): Promise<Trip[]>;
  listActiveTrips(): Promise<Trip[]>;
  
  // Booking methods
  getBooking(id: number): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: number, booking: Partial<Booking>): Promise<Booking | undefined>;
  deleteBooking(id: number): Promise<boolean>;
  listBookingsForVehicle(vehicleId: number): Promise<Booking[]>;
  listBookingsForUser(userId: number): Promise<Booking[]>;
  listAllBookings(): Promise<Booking[]>;
  
  // Session store
  sessionStore: any; // Use 'any' type for sessionStore to avoid TypeScript errors
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private vehicles: Map<number, Vehicle>;
  private maintenances: Map<number, Maintenance>;
  private trips: Map<number, Trip>;
  private bookings: Map<number, Booking>;
  
  sessionStore: session.SessionStore;
  
  private userIdCounter: number;
  private vehicleIdCounter: number;
  private maintenanceIdCounter: number;
  private tripIdCounter: number;
  private bookingIdCounter: number;
  
  constructor() {
    this.users = new Map();
    this.vehicles = new Map();
    this.maintenances = new Map();
    this.trips = new Map();
    this.bookings = new Map();
    
    this.userIdCounter = 1;
    this.vehicleIdCounter = 1;
    this.maintenanceIdCounter = 1;
    this.tripIdCounter = 1;
    this.bookingIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Prune expired entries every 24h
    });
    
    // Add admin user by default - with pre-hashed password
    // The pre-hashed password is "password" - we've already computed this
    const hashedAdminPassword = "d9e9e2991bded44e3a92275c9c98db16f2201176afb59d337832dc981d2bc2d67fbf6cbc68d5a73d8494b8bd65de8a9832e5e815f5bb3add4c98a4f0d43c8ea6.73af07fc6eeca4a16f15aebd35c26782";
    this.createUser({
      username: "admin",
      password: hashedAdminPassword, // Pre-hashed "password"
      name: "Admin User",
      role: "admin",
      position: "Administrator",
      email: "admin@fleetmanager.com",
      phone: "555-123-4567"
    });
    
    // Add some sample vehicles
    this.setupSampleData();
  }
  
  private setupSampleData() {
    // Sample vehicles will be created when first user tries to access them
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      id,
      username: insertUser.username,
      password: insertUser.password,
      name: insertUser.name,
      role: insertUser.role || "moderator",
      position: insertUser.position || null,
      email: insertUser.email || null,
      phone: insertUser.phone || null
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
  
  // Vehicle methods
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }
  
  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = this.vehicleIdCounter++;
    const vehicle: Vehicle = { ...insertVehicle, id };
    this.vehicles.set(id, vehicle);
    return vehicle;
  }
  
  async updateVehicle(id: number, vehicleData: Partial<Vehicle>): Promise<Vehicle | undefined> {
    const vehicle = this.vehicles.get(id);
    if (!vehicle) return undefined;
    
    const updatedVehicle = { ...vehicle, ...vehicleData };
    this.vehicles.set(id, updatedVehicle);
    return updatedVehicle;
  }
  
  async deleteVehicle(id: number): Promise<boolean> {
    return this.vehicles.delete(id);
  }
  
  async listVehicles(filters?: { status?: string, make?: string, year?: number }): Promise<Vehicle[]> {
    let vehicles = Array.from(this.vehicles.values());
    
    if (filters) {
      if (filters.status) {
        vehicles = vehicles.filter(v => v.status === filters.status);
      }
      if (filters.make) {
        vehicles = vehicles.filter(v => v.make === filters.make);
      }
      if (filters.year) {
        vehicles = vehicles.filter(v => v.year === filters.year);
      }
    }
    
    return vehicles;
  }
  
  // Maintenance methods
  async getMaintenance(id: number): Promise<Maintenance | undefined> {
    return this.maintenances.get(id);
  }
  
  async createMaintenance(insertMaintenance: InsertMaintenance): Promise<Maintenance> {
    const id = this.maintenanceIdCounter++;
    const maintenance: Maintenance = { ...insertMaintenance, id };
    this.maintenances.set(id, maintenance);
    
    // Update vehicle status to maintenance
    const vehicle = this.vehicles.get(maintenance.vehicleId);
    if (vehicle && vehicle.status === 'available') {
      this.vehicles.set(vehicle.id, { ...vehicle, status: 'maintenance' });
    }
    
    return maintenance;
  }
  
  async updateMaintenance(id: number, maintenanceData: Partial<Maintenance>): Promise<Maintenance | undefined> {
    const maintenance = this.maintenances.get(id);
    if (!maintenance) return undefined;
    
    const updatedMaintenance = { ...maintenance, ...maintenanceData };
    this.maintenances.set(id, updatedMaintenance);
    
    // If maintenance is completed, update vehicle status back to available
    if (maintenanceData.status === 'completed' && maintenanceData.completedAt) {
      const vehicle = this.vehicles.get(maintenance.vehicleId);
      if (vehicle && vehicle.status === 'maintenance') {
        this.vehicles.set(vehicle.id, { ...vehicle, status: 'available' });
      }
    }
    
    return updatedMaintenance;
  }
  
  async deleteMaintenance(id: number): Promise<boolean> {
    return this.maintenances.delete(id);
  }
  
  async listMaintenanceForVehicle(vehicleId: number): Promise<Maintenance[]> {
    return Array.from(this.maintenances.values())
      .filter(maintenance => maintenance.vehicleId === vehicleId);
  }
  
  async listUpcomingMaintenance(): Promise<Maintenance[]> {
    return Array.from(this.maintenances.values())
      .filter(maintenance => maintenance.status !== 'completed')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  // Trip methods
  async getTrip(id: number): Promise<Trip | undefined> {
    return this.trips.get(id);
  }
  
  async createTrip(insertTrip: InsertTrip): Promise<Trip> {
    const id = this.tripIdCounter++;
    const trip: Trip = { ...insertTrip, id };
    this.trips.set(id, trip);
    
    // Update vehicle status to in_use
    const vehicle = this.vehicles.get(trip.vehicleId);
    if (vehicle && vehicle.status === 'available') {
      this.vehicles.set(vehicle.id, { ...vehicle, status: 'in_use' });
    }
    
    return trip;
  }
  
  async updateTrip(id: number, tripData: Partial<Trip>): Promise<Trip | undefined> {
    const trip = this.trips.get(id);
    if (!trip) return undefined;
    
    const updatedTrip = { ...trip, ...tripData };
    this.trips.set(id, updatedTrip);
    
    // If trip is completed, update vehicle status back to available
    if (tripData.status === 'completed' && tripData.endTime) {
      const vehicle = this.vehicles.get(trip.vehicleId);
      if (vehicle && vehicle.status === 'in_use') {
        this.vehicles.set(vehicle.id, { 
          ...vehicle, 
          status: 'available',
          mileage: tripData.endOdometer || vehicle.mileage
        });
      }
    }
    
    return updatedTrip;
  }
  
  async deleteTrip(id: number): Promise<boolean> {
    return this.trips.delete(id);
  }
  
  async listTripsForVehicle(vehicleId: number): Promise<Trip[]> {
    return Array.from(this.trips.values())
      .filter(trip => trip.vehicleId === vehicleId);
  }
  
  async listTripsForDriver(driverId: number): Promise<Trip[]> {
    return Array.from(this.trips.values())
      .filter(trip => trip.driverId === driverId);
  }
  
  async listActiveTrips(): Promise<Trip[]> {
    return Array.from(this.trips.values())
      .filter(trip => trip.status === 'in_progress');
  }
  
  // Booking methods
  async getBooking(id: number): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }
  
  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = this.bookingIdCounter++;
    const booking: Booking = { 
      ...insertBooking, 
      id, 
      createdAt: new Date() 
    };
    this.bookings.set(id, booking);
    return booking;
  }
  
  async updateBooking(id: number, bookingData: Partial<Booking>): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    
    const updatedBooking = { ...booking, ...bookingData };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }
  
  async deleteBooking(id: number): Promise<boolean> {
    return this.bookings.delete(id);
  }
  
  async listBookingsForVehicle(vehicleId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values())
      .filter(booking => booking.vehicleId === vehicleId);
  }
  
  async listBookingsForUser(userId: number): Promise<Booking[]> {
    return Array.from(this.bookings.values())
      .filter(booking => booking.userId === userId);
  }
  
  async listAllBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;
  private initialized = false;
  private initializationPromise: Promise<void>;
  
  constructor() {
    // Initialize Session Store with PostgreSQL
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
    });
    
    // Initialize database with admin user if it doesn't exist
    this.initializationPromise = this.initializeDatabase();
  }
  
  private async initializeDatabase() {
    try {
      // Add admin user if no users exist
      const userCount = await db.select({ count: sql`count(*)` }).from(users);
      const count = Number(userCount[0].count);
      
      console.log(`Database initialization: Found ${count} existing users`);
      
      if (count === 0) {
        console.log('Creating admin user...');
        // Add admin user - with pre-hashed password
        const hashedAdminPassword = "d9e9e2991bded44e3a92275c9c98db16f2201176afb59d337832dc981d2bc2d67fbf6cbc68d5a73d8494b8bd65de8a9832e5e815f5bb3add4c98a4f0d43c8ea6.73af07fc6eeca4a16f15aebd35c26782";
        
        // Direct DB insert to avoid self-reference to createUser method
        await db.insert(users).values({
          username: "admin",
          password: hashedAdminPassword,
          name: "Admin User",
          role: "admin",
          position: "Administrator",
          email: "admin@fleetmanager.com",
          phone: "555-123-4567"
        });
        console.log('Admin user created successfully');
      }
      
      this.initialized = true;
      console.log('Database initialization complete');
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }
  
  // Helper method to ensure initialization is complete before DB operations
  private async ensureInitialized() {
    if (!this.initialized) {
      await this.initializationPromise;
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    await this.ensureInitialized();
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    await this.ensureInitialized();
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    await this.ensureInitialized();
    // Ensure all required fields have values
    const userToCreate = {
      username: insertUser.username,
      password: insertUser.password,
      name: insertUser.name,
      role: insertUser.role || "moderator",
      position: insertUser.position || null,
      email: insertUser.email || null,
      phone: insertUser.phone || null
    };
    
    const result = await db.insert(users).values(userToCreate).returning();
    return result[0];
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    await this.ensureInitialized();
    const result = await db.update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }
  
  async listUsers(): Promise<User[]> {
    await this.ensureInitialized();
    return await db.select().from(users);
  }
  
  async deleteUser(id: number): Promise<boolean> {
    await this.ensureInitialized();
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }
  
  // Vehicle methods
  async getVehicle(id: number): Promise<Vehicle | undefined> {
    await this.ensureInitialized();
    const result = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return result[0];
  }
  
  async createVehicle(vehicle: InsertVehicle): Promise<Vehicle> {
    await this.ensureInitialized();
    const result = await db.insert(vehicles).values(vehicle).returning();
    return result[0];
  }
  
  async updateVehicle(id: number, vehicleData: Partial<Vehicle>): Promise<Vehicle | undefined> {
    await this.ensureInitialized();
    const result = await db.update(vehicles)
      .set(vehicleData)
      .where(eq(vehicles.id, id))
      .returning();
    return result[0];
  }
  
  async deleteVehicle(id: number): Promise<boolean> {
    await this.ensureInitialized();
    const result = await db.delete(vehicles).where(eq(vehicles.id, id)).returning();
    return result.length > 0;
  }
  
  async listVehicles(filters?: { status?: string, make?: string, year?: number }): Promise<Vehicle[]> {
    await this.ensureInitialized();
    
    if (!filters) {
      return await db.select().from(vehicles);
    }
    
    const conditions = [];
    
    if (filters.status) {
      conditions.push(eq(vehicles.status, filters.status as any));
    }
    
    if (filters.make) {
      conditions.push(eq(vehicles.make, filters.make));
    }
    
    if (filters.year) {
      conditions.push(eq(vehicles.year, filters.year));
    }
    
    if (conditions.length === 0) {
      return await db.select().from(vehicles);
    }
    
    return await db.select().from(vehicles).where(and(...conditions));
  }
  
  // Maintenance methods
  async getMaintenance(id: number): Promise<Maintenance | undefined> {
    await this.ensureInitialized();
    const result = await db.select().from(maintenance).where(eq(maintenance.id, id));
    return result[0];
  }
  
  async createMaintenance(maintenanceData: InsertMaintenance): Promise<Maintenance> {
    await this.ensureInitialized();
    // Start a transaction for atomicity
    const result = await db.transaction(async (tx) => {
      const newMaintenance = await tx.insert(maintenance)
        .values(maintenanceData)
        .returning();
      
      // Update vehicle status to maintenance
      if (maintenanceData.status !== 'completed') {
        const vehicle = await tx.select().from(vehicles)
          .where(eq(vehicles.id, maintenanceData.vehicleId));
        
        if (vehicle.length > 0 && vehicle[0].status === 'available') {
          await tx.update(vehicles)
            .set({ status: 'maintenance' })
            .where(eq(vehicles.id, maintenanceData.vehicleId));
        }
      }
      
      return newMaintenance[0];
    });
    
    return result;
  }
  
  async updateMaintenance(id: number, maintenanceData: Partial<Maintenance>): Promise<Maintenance | undefined> {
    await this.ensureInitialized();
    console.log(`[updateMaintenance] Updating maintenance #${id} with data:`, maintenanceData);
    
    try {
      // Start a transaction for atomicity
      const result = await db.transaction(async (tx) => {
        const existingMaintenance = await tx.select().from(maintenance)
          .where(eq(maintenance.id, id));
        
        console.log("[updateMaintenance] Existing maintenance:", existingMaintenance);
        
        // Handle completedAt date conversion if needed
        let processedData = {...maintenanceData};
        if (maintenanceData.completedAt && typeof maintenanceData.completedAt === 'string') {
          console.log('[updateMaintenance] Converting completedAt from string to Date:', maintenanceData.completedAt);
          processedData.completedAt = new Date(maintenanceData.completedAt);
        }
        
        const updatedMaintenance = await tx.update(maintenance)
          .set(processedData)
          .where(eq(maintenance.id, id))
          .returning();
        
        console.log("[updateMaintenance] Updated maintenance:", updatedMaintenance);
        
        // If maintenance is completed, update vehicle status back to available
        if (maintenanceData.status === 'completed') {
          console.log("[updateMaintenance] Maintenance marked as completed, checking vehicle status");
          const maintenanceRecord = await tx.select().from(maintenance)
            .where(eq(maintenance.id, id));
          
          if (maintenanceRecord.length > 0) {
            const vehicle = await tx.select().from(vehicles)
              .where(eq(vehicles.id, maintenanceRecord[0].vehicleId));
            
            console.log("[updateMaintenance] Associated vehicle:", vehicle);
            
            if (vehicle.length > 0 && vehicle[0].status === 'maintenance') {
              console.log("[updateMaintenance] Updating vehicle status from maintenance to available");
              await tx.update(vehicles)
                .set({ status: 'available' })
                .where(eq(vehicles.id, maintenanceRecord[0].vehicleId));
            }
          }
        }
        
        return updatedMaintenance[0];
      });
      
      console.log("[updateMaintenance] Transaction completed successfully");
      return result;
    } catch (error) {
      console.error("[updateMaintenance] Error updating maintenance:", error);
      throw error;
    }
  }
  
  async deleteMaintenance(id: number): Promise<boolean> {
    await this.ensureInitialized();
    const result = await db.delete(maintenance).where(eq(maintenance.id, id)).returning();
    return result.length > 0;
  }
  
  async listMaintenanceForVehicle(vehicleId: number): Promise<Maintenance[]> {
    await this.ensureInitialized();
    return await db.select().from(maintenance)
      .where(eq(maintenance.vehicleId, vehicleId));
  }
  
  async listUpcomingMaintenance(): Promise<Maintenance[]> {
    await this.ensureInitialized();
    return await db.select().from(maintenance)
      .where(
        and(
          sql`${maintenance.status} != 'completed'`,
          sql`${maintenance.date} >= CURRENT_DATE`
        )
      )
      .orderBy(maintenance.date);
  }
  
  // Trip methods
  async getTrip(id: number): Promise<Trip | undefined> {
    await this.ensureInitialized();
    const result = await db.select().from(trips).where(eq(trips.id, id));
    return result[0];
  }
  
  async createTrip(tripData: InsertTrip): Promise<Trip> {
    await this.ensureInitialized();
    console.log("[createTrip] Creating trip with data:", tripData);
    
    try {
      // Handle date type conversion if needed
      const processedData = {...tripData};
      if (tripData.startTime && typeof tripData.startTime === 'string') {
        console.log('[createTrip] Converting startTime from string to Date:', tripData.startTime);
        processedData.startTime = new Date(tripData.startTime);
      }
      
      if (tripData.endTime && typeof tripData.endTime === 'string') {
        console.log('[createTrip] Converting endTime from string to Date:', tripData.endTime);
        processedData.endTime = new Date(tripData.endTime);
      }
      
      // Start a transaction for atomicity
      const result = await db.transaction(async (tx) => {
        console.log("[createTrip] Processed trip data:", processedData);
        const newTrip = await tx.insert(trips)
          .values(processedData)
          .returning();
        
        console.log("[createTrip] New trip created:", newTrip);
        
        // Update vehicle status to in_use
        if (processedData.status === 'in_progress') {
          const vehicle = await tx.select().from(vehicles)
            .where(eq(vehicles.id, processedData.vehicleId));
          
          console.log("[createTrip] Vehicle for trip:", vehicle);
          
          if (vehicle.length > 0 && vehicle[0].status === 'available') {
            console.log("[createTrip] Updating vehicle status to in_use");
            await tx.update(vehicles)
              .set({ status: 'in_use' })
              .where(eq(vehicles.id, processedData.vehicleId));
          }
        }
        
        return newTrip[0];
      });
      
      console.log("[createTrip] Transaction completed successfully");
      return result;
    } catch (error) {
      console.error("[createTrip] Error creating trip:", error);
      throw error;
    }
  }
  
  async updateTrip(id: number, tripData: Partial<Trip>): Promise<Trip | undefined> {
    try {
      await this.ensureInitialized();
      
      console.log("[updateTrip] Received trip data:", JSON.stringify(tripData));
      
      // Process the data to handle date conversions
      const processedData = { ...tripData };
      
      // Handle endTime conversion if it's a string
      if (processedData.endTime && typeof processedData.endTime === 'string') {
        try {
          console.log("[updateTrip] Converting endTime from string:", processedData.endTime);
          processedData.endTime = new Date(processedData.endTime);
          console.log("[updateTrip] Converted endTime to Date:", processedData.endTime);
        } catch (e) {
          console.error("[updateTrip] Error converting endTime:", e);
          throw new Error("Invalid endTime format");
        }
      }
      
      console.log("[updateTrip] Processed data:", JSON.stringify(processedData, (key, value) => 
        value instanceof Date ? value.toISOString() : value
      ));
      
      // Start a transaction for atomicity
      const result = await db.transaction(async (tx) => {
        const updatedTrip = await tx.update(trips)
          .set(processedData)
          .where(eq(trips.id, id))
          .returning();
        
        if (!updatedTrip.length) {
          console.error("[updateTrip] Trip not found:", id);
          return undefined;
        }
        
        console.log("[updateTrip] Trip updated:", JSON.stringify(updatedTrip[0], (key, value) => 
          value instanceof Date ? value.toISOString() : value
        ));
        
        // If trip is completed, update vehicle status back to available
        if (processedData.status === 'completed' && processedData.endTime) {
          console.log("[updateTrip] Trip is being completed");
          
          const tripRecord = await tx.select().from(trips)
            .where(eq(trips.id, id));
          
          if (tripRecord.length > 0) {
            console.log("[updateTrip] Found trip record:", JSON.stringify(tripRecord[0]));
            
            const vehicle = await tx.select().from(vehicles)
              .where(eq(vehicles.id, tripRecord[0].vehicleId));
            
            if (vehicle.length > 0) {
              console.log("[updateTrip] Found vehicle:", JSON.stringify(vehicle[0]));
              
              if (vehicle[0].status === 'in_use') {
                const newMileage = processedData.endOdometer || vehicle[0].mileage;
                console.log("[updateTrip] Updating vehicle status to available and mileage to:", newMileage);
                
                await tx.update(vehicles)
                  .set({ 
                    status: 'available',
                    mileage: newMileage
                  })
                  .where(eq(vehicles.id, tripRecord[0].vehicleId));
                  
                console.log("[updateTrip] Vehicle updated to available");
              } else {
                console.log("[updateTrip] Vehicle not in use, status is:", vehicle[0].status);
              }
            } else {
              console.log("[updateTrip] Vehicle not found");
            }
          } else {
            console.log("[updateTrip] Trip record not found after update");
          }
        }
        
        return updatedTrip[0];
      });
      
      console.log("[updateTrip] Transaction completed successfully");
      return result;
    } catch (error) {
      console.error("[updateTrip] Error updating trip:", error);
      throw error;
    }
  }
  
  async deleteTrip(id: number): Promise<boolean> {
    await this.ensureInitialized();
    const result = await db.delete(trips).where(eq(trips.id, id)).returning();
    return result.length > 0;
  }
  
  async listTripsForVehicle(vehicleId: number): Promise<Trip[]> {
    await this.ensureInitialized();
    return await db.select().from(trips)
      .where(eq(trips.vehicleId, vehicleId));
  }
  
  async listTripsForDriver(driverId: number): Promise<Trip[]> {
    await this.ensureInitialized();
    return await db.select().from(trips)
      .where(eq(trips.driverId, driverId));
  }
  
  async listActiveTrips(): Promise<Trip[]> {
    await this.ensureInitialized();
    return await db.select().from(trips)
      .where(eq(trips.status, 'in_progress'));
  }
  
  // Booking methods
  async getBooking(id: number): Promise<Booking | undefined> {
    await this.ensureInitialized();
    const result = await db.select().from(bookings).where(eq(bookings.id, id));
    return result[0];
  }
  
  async createBooking(bookingData: InsertBooking): Promise<Booking> {
    try {
      await this.ensureInitialized();
      
      console.log("[createBooking] Received booking data:", JSON.stringify(bookingData));
      
      // Process the data to handle date conversions
      const processedData = { ...bookingData };
      
      // Handle startTime conversion if it's a string
      if (processedData.startTime && typeof processedData.startTime === 'string') {
        try {
          console.log("[createBooking] Converting startTime from string:", processedData.startTime);
          processedData.startTime = new Date(processedData.startTime);
          console.log("[createBooking] Converted startTime to Date:", processedData.startTime);
        } catch (e) {
          console.error("[createBooking] Error converting startTime:", e);
          throw new Error("Invalid startTime format");
        }
      }
      
      // Handle endTime conversion if it's a string
      if (processedData.endTime && typeof processedData.endTime === 'string') {
        try {
          console.log("[createBooking] Converting endTime from string:", processedData.endTime);
          processedData.endTime = new Date(processedData.endTime);
          console.log("[createBooking] Converted endTime to Date:", processedData.endTime);
        } catch (e) {
          console.error("[createBooking] Error converting endTime:", e);
          throw new Error("Invalid endTime format");
        }
      }
      
      console.log("[createBooking] Processed data:", JSON.stringify(processedData, (key, value) => 
        value instanceof Date ? value.toISOString() : value
      ));
      
      // Ensure vehicle is available for booking
      const vehicle = await db.select().from(vehicles)
        .where(eq(vehicles.id, processedData.vehicleId));
      
      if (vehicle.length === 0) {
        console.error("[createBooking] Vehicle not found:", processedData.vehicleId);
        throw new Error("Vehicle not found");
      }
      
      if (vehicle[0].status !== 'available') {
        console.error("[createBooking] Vehicle not available:", vehicle[0].status);
        throw new Error(`Vehicle not available (status: ${vehicle[0].status})`);
      }
      
      // Insert booking
      const result = await db.insert(bookings)
        .values(processedData)
        .returning();
      
      console.log("[createBooking] Booking created:", JSON.stringify(result[0]));
      
      return result[0];
    } catch (error) {
      console.error("[createBooking] Error creating booking:", error);
      throw error;
    }
  }
  
  async updateBooking(id: number, bookingData: Partial<Booking>): Promise<Booking | undefined> {
    try {
      await this.ensureInitialized();
      
      console.log("[updateBooking] Received booking data:", JSON.stringify(bookingData));
      
      // Process the data to handle date conversions
      const processedData = { ...bookingData };
      
      // Handle startTime conversion if it's a string
      if (processedData.startTime && typeof processedData.startTime === 'string') {
        try {
          console.log("[updateBooking] Converting startTime from string:", processedData.startTime);
          processedData.startTime = new Date(processedData.startTime);
          console.log("[updateBooking] Converted startTime to Date:", processedData.startTime);
        } catch (e) {
          console.error("[updateBooking] Error converting startTime:", e);
          throw new Error("Invalid startTime format");
        }
      }
      
      // Handle endTime conversion if it's a string
      if (processedData.endTime && typeof processedData.endTime === 'string') {
        try {
          console.log("[updateBooking] Converting endTime from string:", processedData.endTime);
          processedData.endTime = new Date(processedData.endTime);
          console.log("[updateBooking] Converted endTime to Date:", processedData.endTime);
        } catch (e) {
          console.error("[updateBooking] Error converting endTime:", e);
          throw new Error("Invalid endTime format");
        }
      }
      
      console.log("[updateBooking] Processed data:", JSON.stringify(processedData, (key, value) => 
        value instanceof Date ? value.toISOString() : value
      ));
      
      // Update booking
      const result = await db.update(bookings)
        .set(processedData)
        .where(eq(bookings.id, id))
        .returning();
      
      if (result.length === 0) {
        console.error("[updateBooking] Booking not found:", id);
        return undefined;
      }
      
      console.log("[updateBooking] Booking updated:", JSON.stringify(result[0]));
      
      return result[0];
    } catch (error) {
      console.error("[updateBooking] Error updating booking:", error);
      throw error;
    }
  }
  
  async deleteBooking(id: number): Promise<boolean> {
    await this.ensureInitialized();
    const result = await db.delete(bookings).where(eq(bookings.id, id)).returning();
    return result.length > 0;
  }
  
  async listBookingsForVehicle(vehicleId: number): Promise<Booking[]> {
    await this.ensureInitialized();
    return await db.select().from(bookings)
      .where(eq(bookings.vehicleId, vehicleId));
  }
  
  async listBookingsForUser(userId: number): Promise<Booking[]> {
    await this.ensureInitialized();
    return await db.select().from(bookings)
      .where(eq(bookings.userId, userId));
  }
  
  async listAllBookings(): Promise<Booking[]> {
    await this.ensureInitialized();
    console.log("[listAllBookings] Fetching all bookings from database");
    const allBookings = await db.select().from(bookings);
    console.log(`[listAllBookings] Found ${allBookings.length} bookings`);
    return allBookings;
  }
}

// Use the Database Storage instead of in-memory storage
export const storage = new DatabaseStorage();
