import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertTripSchema, Trip, Vehicle, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface TripFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: z.infer<typeof insertTripSchema>) => void;
  isSubmitting: boolean;
  vehicles: Vehicle[];
  users: User[];
  defaultValues?: Partial<Trip>;
  mode: 'add' | 'edit';
}

export default function TripForm({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isSubmitting, 
  vehicles,
  users,
  defaultValues,
  mode
}: TripFormProps) {
  // Only show available vehicles, unless we're editing a trip
  const availableVehicles = mode === 'add' 
    ? vehicles.filter(v => v.status === 'available')
    : vehicles;

  const form = useForm<z.infer<typeof insertTripSchema>>({
    resolver: zodResolver(insertTripSchema),
    defaultValues: {
      vehicleId: defaultValues?.vehicleId || 0,
      driverId: defaultValues?.driverId || 0,
      startTime: defaultValues?.startTime 
        ? (typeof defaultValues.startTime === 'string' 
            ? defaultValues.startTime.slice(0, 16) 
            : new Date(defaultValues.startTime).toISOString().slice(0, 16))
        : new Date().toISOString().slice(0, 16),
      startOdometer: defaultValues?.startOdometer || 0,
      purpose: defaultValues?.purpose || "",
      status: defaultValues?.status || "planned",
    }
  });

  const handleSubmit = (values: z.infer<typeof insertTripSchema>) => {
    // Log the form values to help debug
    console.log('Trip form values before submission:', values);
    
    // Make a copy to avoid modifying the original form values
    const processedValues = { ...values };
    
    // Ensure the status is explicitly set for new trips
    if (mode === 'add' && processedValues.status !== 'in_progress') {
      processedValues.status = 'in_progress';
    }
    
    // Make sure startTime is a properly formatted string
    if (processedValues.startTime && typeof processedValues.startTime === 'string') {
      // Ensure it's in ISO format
      try {
        const date = new Date(processedValues.startTime);
        processedValues.startTime = date.toISOString();
      } catch (e) {
        console.error('Error formatting startTime:', e);
      }
    }
    
    // Log the processed values
    console.log('Trip form values after processing:', processedValues);
    
    onSubmit(processedValues);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Start New Trip' : 'Edit Trip'}</DialogTitle>
          <DialogDescription>
            {mode === 'add' 
              ? 'Enter the details to log a new trip.' 
              : 'Update the trip details.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="vehicleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    defaultValue={field.value ? field.value.toString() : undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a vehicle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableVehicles.length === 0 ? (
                        <SelectItem value="no-vehicles" disabled>
                          No available vehicles
                        </SelectItem>
                      ) : (
                        availableVehicles.map((vehicle) => (
                          <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                            {vehicle.make} {vehicle.model} ({vehicle.registrationNumber})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="driverId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Driver</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    defaultValue={field.value ? field.value.toString() : undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a driver" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {users.length === 0 ? (
                        <SelectItem value="no-drivers" disabled>
                          No drivers available
                        </SelectItem>
                      ) : (
                        users.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input 
                      type="datetime-local" 
                      value={field.value ? 
                        (typeof field.value === 'string' ? 
                          field.value.slice(0, 16) : 
                          new Date(field.value).toISOString().slice(0, 16)) 
                        : ''}
                      onChange={(e) => field.onChange(e.target.value)}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="startOdometer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starting Odometer (miles)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      placeholder="Enter current mileage"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Brief description of the trip purpose"
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      {mode === 'edit' && (
                        <>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === 'add' ? 'Starting Trip...' : 'Updating Trip...'}
                  </>
                ) : (
                  mode === 'add' ? 'Start Trip' : 'Update Trip'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
