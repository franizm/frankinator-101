import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertBookingSchema, Booking, Vehicle, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface BookingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: z.infer<typeof insertBookingSchema>) => void;
  isSubmitting: boolean;
  vehicles: Vehicle[];
  users: User[];
  currentUser: User | null;
  defaultValues?: Partial<Booking>;
  mode: 'add' | 'edit';
}

export default function BookingForm({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isSubmitting, 
  vehicles,
  users,
  currentUser,
  defaultValues,
  mode
}: BookingFormProps) {
  // Only show available vehicles, unless we're editing a booking
  const availableVehicles = mode === 'add' 
    ? vehicles.filter(v => v.status === 'available')
    : vehicles;

  const form = useForm<z.infer<typeof insertBookingSchema>>({
    resolver: zodResolver(insertBookingSchema),
    defaultValues: {
      vehicleId: defaultValues?.vehicleId || 0,
      userId: defaultValues?.userId || (currentUser?.id || 0),
      startTime: defaultValues?.startTime 
        ? (typeof defaultValues.startTime === 'string' 
            ? defaultValues.startTime.slice(0, 16) 
            : new Date(defaultValues.startTime).toISOString().slice(0, 16))
        : new Date().toISOString().slice(0, 16),
      endTime: defaultValues?.endTime 
        ? (typeof defaultValues.endTime === 'string' 
            ? defaultValues.endTime.slice(0, 16) 
            : new Date(defaultValues.endTime).toISOString().slice(0, 16))
        : new Date(Date.now() + 3600000).toISOString().slice(0, 16),
      purpose: defaultValues?.purpose || "",
      status: defaultValues?.status || "pending",
    }
  });

  const handleSubmit = (values: z.infer<typeof insertBookingSchema>) => {
    console.log('Submitting booking form data:', values);
    
    // Ensure date format is consistent for API
    // Form returns ISO format string but without timezone - ensure proper ISO format
    if (values.startTime && typeof values.startTime === 'string') {
      try {
        // Convert to full ISO string format with timezone
        values.startTime = new Date(values.startTime).toISOString();
        console.log('Converted startTime:', values.startTime);
      } catch (e) {
        console.error('Error formatting startTime:', e);
      }
    }
    
    if (values.endTime && typeof values.endTime === 'string') {
      try {
        // Convert to full ISO string format with timezone
        values.endTime = new Date(values.endTime).toISOString();
        console.log('Converted endTime:', values.endTime);
      } catch (e) {
        console.error('Error formatting endTime:', e);
      }
    }
    
    console.log('Processed booking form data:', values);
    onSubmit(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Book a Vehicle' : 'Edit Booking'}</DialogTitle>
          <DialogDescription>
            {mode === 'add' 
              ? 'Enter the details to reserve a vehicle.' 
              : 'Update the booking details.'}
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
            
            {currentUser?.role === 'admin' && (
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value ? field.value.toString() : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users.length === 0 ? (
                          <SelectItem value="no-users" disabled>
                            No users available
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
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
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
            </div>
            
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Brief description of the booking purpose"
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {currentUser?.role === 'admin' && mode === 'edit' && (
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
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="declined">Declined</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === 'add' ? 'Booking...' : 'Updating...'}
                  </>
                ) : (
                  mode === 'add' ? 'Book Vehicle' : 'Update Booking'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
