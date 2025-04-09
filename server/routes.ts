import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertVehicleSchema, insertMaintenanceSchema, insertTripSchema, insertBookingSchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";

// Middleware for role-based access control
function checkRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (!roles.includes(req.user!.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    next();
  };
}

// Admin only routes
const adminOnly = checkRole(["admin"]);

// Admin and moderator routes
const adminModOnly = checkRole(["admin", "moderator"]);

// Check if user is the owner of a resource or has admin privileges
function isOwnerOrAdmin(req: Request, resourceUserId: number): boolean {
  return req.user!.role === "admin" || req.user!.id === resourceUserId;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Vehicle routes - All authenticated users can view
  app.get("/api/vehicles", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const status = req.query.status as string | undefined;
    const make = req.query.make as string | undefined;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    
    const vehicles = await storage.listVehicles({ status, make, year });
    res.json(vehicles);
  });

  app.get("/api/vehicles/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const id = parseInt(req.params.id);
    const vehicle = await storage.getVehicle(id);
    
    if (!vehicle) {
      return res.status(404).json({ message: "Vehicle not found" });
    }
    
    res.json(vehicle);
  });

  // Only admin and moderator can create vehicles
  app.post("/api/vehicles", adminModOnly, async (req: Request, res: Response) => {
    try {
      const vehicleData = insertVehicleSchema.parse(req.body);
      const vehicle = await storage.createVehicle(vehicleData);
      res.status(201).json(vehicle);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vehicle data", errors: err.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Only admin and moderator can update vehicles
  app.put("/api/vehicles/:id", adminModOnly, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    try {
      const vehicleData = insertVehicleSchema.partial().parse(req.body);
      const updatedVehicle = await storage.updateVehicle(id, vehicleData);
      
      if (!updatedVehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      res.json(updatedVehicle);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid vehicle data", errors: err.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Only admin can delete vehicles
  app.delete("/api/vehicles/:id", adminOnly, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    try {
      // First check if the vehicle has any associated maintenance records or trips
      const maintenanceRecords = await storage.listMaintenanceForVehicle(id);
      if (maintenanceRecords.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete vehicle with maintenance records. Remove maintenance records first." 
        });
      }
      
      const trips = await storage.listTripsForVehicle(id);
      if (trips.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete vehicle with trip records. Remove trip records first." 
        });
      }
      
      const bookings = await storage.listBookingsForVehicle(id);
      if (bookings.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete vehicle with booking records. Remove booking records first." 
        });
      }
      
      const success = await storage.deleteVehicle(id);
      
      if (!success) {
        return res.status(404).json({ message: "Vehicle not found" });
      }
      
      return res.status(200).json({ message: "Vehicle deleted successfully" });
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      return res.status(500).json({ 
        message: "Error deleting vehicle",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Maintenance routes
  app.get("/api/maintenance/vehicle/:vehicleId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const vehicleId = parseInt(req.params.vehicleId);
    const maintenance = await storage.listMaintenanceForVehicle(vehicleId);
    res.json(maintenance);
  });

  app.get("/api/maintenance/upcoming", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const maintenance = await storage.listUpcomingMaintenance();
    res.json(maintenance);
  });

  // Admin and moderator can create maintenance records
  app.post("/api/maintenance", adminModOnly, async (req: Request, res: Response) => {
    try {
      const maintenanceData = insertMaintenanceSchema.parse(req.body);
      const maintenance = await storage.createMaintenance(maintenanceData);
      res.status(201).json(maintenance);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid maintenance data", errors: err.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin and moderator can update maintenance records
  app.put("/api/maintenance/:id", adminModOnly, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    try {
      console.log("Maintenance update request:", req.body);
      const maintenanceData = insertMaintenanceSchema.partial().parse(req.body);
      console.log("Parsed maintenance data:", maintenanceData);
      const updatedMaintenance = await storage.updateMaintenance(id, maintenanceData);
      
      if (!updatedMaintenance) {
        return res.status(404).json({ message: "Maintenance record not found" });
      }
      
      console.log("Updated maintenance:", updatedMaintenance);
      res.json(updatedMaintenance);
    } catch (err) {
      console.error("Error updating maintenance:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid maintenance data", errors: err.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Only admin can delete maintenance records
  app.delete("/api/maintenance/:id", adminOnly, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteMaintenance(id);
    
    if (!success) {
      return res.status(404).json({ message: "Maintenance record not found" });
    }
    
    res.status(204).send();
  });

  // Trip routes
  app.get("/api/trips/vehicle/:vehicleId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const vehicleId = parseInt(req.params.vehicleId);
    const trips = await storage.listTripsForVehicle(vehicleId);
    res.json(trips);
  });

  app.get("/api/trips/driver/:driverId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const driverId = parseInt(req.params.driverId);
    
    // Drivers can only see their own trips
    if (req.user!.id !== driverId && req.user!.role !== 'admin' && req.user!.role !== 'moderator') {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const trips = await storage.listTripsForDriver(driverId);
    res.json(trips);
  });

  app.get("/api/trips/active", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const trips = await storage.listActiveTrips();
    res.json(trips);
  });

  // Admin and moderator can create trips
  app.post("/api/trips", adminModOnly, async (req: Request, res: Response) => {
    try {
      console.log("Creating trip with data:", req.body);
      const tripData = insertTripSchema.parse(req.body);
      console.log("Parsed trip data:", tripData);
      const trip = await storage.createTrip(tripData);
      console.log("Created trip:", trip);
      res.status(201).json(trip);
    } catch (err) {
      console.error("Error creating trip:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid trip data", errors: err.errors });
      }
      res.status(500).json({ message: "Internal server error", details: err instanceof Error ? err.message : "Unknown error" });
    }
  });

  // Admin, moderator, or the assigned driver can update trips
  app.put("/api/trips/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const id = parseInt(req.params.id);
    
    console.log(`[routes] Updating trip ${id} with data:`, JSON.stringify(req.body));
    
    // Get the trip to check ownership
    const trip = await storage.getTrip(id);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found" });
    }
    
    // Check permissions - drivers can only update their own trips
    if (req.user!.id !== trip.driverId && req.user!.role !== 'admin' && req.user!.role !== 'moderator') {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      // Parse and validate the request data
      const tripData = insertTripSchema.partial().parse(req.body);
      console.log(`[routes] Validated trip data:`, JSON.stringify(tripData));
      
      // Process the trip update
      const updatedTrip = await storage.updateTrip(id, tripData);
      
      if (!updatedTrip) {
        console.error(`[routes] Trip ${id} not found after validation`);
        return res.status(404).json({ message: "Trip not found" });
      }
      
      console.log(`[routes] Trip updated successfully:`, JSON.stringify(updatedTrip, (key, value) => 
        value instanceof Date ? value.toISOString() : value
      ));
      res.json(updatedTrip);
    } catch (err) {
      if (err instanceof z.ZodError) {
        console.error(`[routes] Validation error:`, err.errors);
        return res.status(400).json({ message: "Invalid trip data", errors: err.errors });
      }
      console.error(`[routes] Error updating trip:`, err);
      res.status(500).json({ 
        message: "Internal server error", 
        error: err instanceof Error ? err.message : String(err) 
      });
    }
  });

  // Only admin can delete trips
  app.delete("/api/trips/:id", adminOnly, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteTrip(id);
    
    if (!success) {
      return res.status(404).json({ message: "Trip not found" });
    }
    
    res.status(204).send();
  });

  // Booking routes
  // Get all bookings - temporarily allow all authenticated users
  app.get("/api/bookings", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    // Temporarily removed role check for debugging
    try {
      console.log("[routes] Fetching all bookings");
      const bookings = await storage.listAllBookings();
      console.log(`[routes] Found ${bookings.length} bookings`);
      res.json(bookings);
    } catch (err) {
      console.error("[routes] Error fetching bookings:", err);
      res.status(500).json({ 
        message: "Internal server error", 
        details: err instanceof Error ? err.message : String(err)
      });
    }
  });
  
  app.get("/api/bookings/vehicle/:vehicleId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const vehicleId = parseInt(req.params.vehicleId);
    const bookings = await storage.listBookingsForVehicle(vehicleId);
    res.json(bookings);
  });

  // Users can view their own bookings, admins can view all
  app.get("/api/bookings/user/:userId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const userId = parseInt(req.params.userId);
    
    // Check if user is trying to access their own bookings or is an admin
    if (req.user!.id !== userId && req.user!.role !== 'admin' && req.user!.role !== 'moderator') {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    const bookings = await storage.listBookingsForUser(userId);
    res.json(bookings);
  });

  // All authenticated users can create bookings
  app.post("/api/bookings", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    console.log(`[routes] Creating booking with data:`, JSON.stringify(req.body));
    
    try {
      // Parse and validate the request data
      const bookingData = insertBookingSchema.parse(req.body);
      console.log(`[routes] Validated booking data:`, JSON.stringify(bookingData));
      
      // Process the booking creation
      const booking = await storage.createBooking(bookingData);
      
      console.log(`[routes] Booking created successfully:`, JSON.stringify(booking));
      res.status(201).json(booking);
    } catch (err) {
      if (err instanceof z.ZodError) {
        console.error(`[routes] Validation error:`, err.errors);
        return res.status(400).json({ message: "Invalid booking data", errors: err.errors });
      }
      
      // Handle application-specific errors
      console.error(`[routes] Error creating booking:`, err);
      
      // Send a more informative error message
      if (err instanceof Error) {
        const errorMessage = err.message;
        
        if (errorMessage.includes("Vehicle not found")) {
          return res.status(404).json({ message: errorMessage });
        }
        
        if (errorMessage.includes("Vehicle not available")) {
          return res.status(422).json({ message: errorMessage });
        }
        
        return res.status(500).json({ 
          message: "Internal server error", 
          details: errorMessage
        });
      }
      
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Users can update their own bookings, admins/moderators can update any
  app.put("/api/bookings/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const id = parseInt(req.params.id);
    
    console.log(`[routes] Updating booking ${id} with data:`, JSON.stringify(req.body));
    
    // Get the booking to check ownership
    const booking = await storage.getBooking(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    // Check permissions
    if (req.user!.id !== booking.userId && req.user!.role !== 'admin' && req.user!.role !== 'moderator') {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    try {
      // Parse and validate the request data
      const bookingData = insertBookingSchema.partial().parse(req.body);
      console.log(`[routes] Validated booking data:`, JSON.stringify(bookingData));
      
      // Process the booking update
      const updatedBooking = await storage.updateBooking(id, bookingData);
      
      if (!updatedBooking) {
        console.error(`[routes] Booking ${id} not found after validation`);
        return res.status(404).json({ message: "Booking not found" });
      }
      
      console.log(`[routes] Booking updated successfully:`, JSON.stringify(updatedBooking));
      res.json(updatedBooking);
    } catch (err) {
      if (err instanceof z.ZodError) {
        console.error(`[routes] Validation error:`, err.errors);
        return res.status(400).json({ message: "Invalid booking data", errors: err.errors });
      }
      
      // Handle application-specific errors
      console.error(`[routes] Error updating booking:`, err);
      
      // Send a more informative error message
      if (err instanceof Error) {
        const errorMessage = err.message;
        
        if (errorMessage.includes("Invalid startTime format") || 
            errorMessage.includes("Invalid endTime format")) {
          return res.status(400).json({ message: errorMessage });
        }
        
        return res.status(500).json({ 
          message: "Internal server error", 
          details: errorMessage
        });
      }
      
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Only admin can delete bookings
  app.delete("/api/bookings/:id", adminOnly, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const success = await storage.deleteBooking(id);
    
    if (!success) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    res.status(204).send();
  });

  // User routes - Admin and moderator can view users
  app.get("/api/users", adminModOnly, async (req: Request, res: Response) => {
    const users = await storage.listUsers();
    res.json(users);
  });
  
  // Admin can create users (both admins and moderators)
  app.post("/api/users", adminOnly, async (req: Request, res: Response) => {
    try {
      // Allow any valid user role
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Hash password before storing (this will be handled in storage.ts)
      const user = await storage.createUser(userData);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid input", 
          errors: error.errors 
        });
      }
      console.error("Error creating user:", error);
      return res.status(500).json({ 
        message: "Internal server error", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
  
  // Admin can delete users 
  app.delete("/api/users/:id", adminOnly, async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    
    // Prevent deleting self
    if (req.user!.id === id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }
    
    // Check if user exists
    const user = await storage.getUser(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Prevent deleting admin users
    if (user.role === "admin") {
      return res.status(403).json({ message: "Cannot delete admin users" });
    }
    
    // Delete user
    try {
      const success = await storage.deleteUser(id);
      if (success) {
        return res.status(200).json({ message: "User deleted successfully" });
      } else {
        return res.status(500).json({ message: "Failed to delete user" });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dashboard statistics
  app.get("/api/dashboard/stats", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const vehicles = await storage.listVehicles();
    const activeTrips = await storage.listActiveTrips();
    
    const stats = {
      totalVehicles: vehicles.length,
      availableVehicles: vehicles.filter(v => v.status === 'available').length,
      inMaintenance: vehicles.filter(v => v.status === 'maintenance').length,
      outOfService: vehicles.filter(v => v.status === 'out_of_service').length,
      activeTrips: activeTrips.length
    };
    
    res.json(stats);
  });

  const httpServer = createServer(app);
  return httpServer;
}
