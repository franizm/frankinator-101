import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Trip, Vehicle, User, insertTripSchema } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Search } from 'lucide-react';
import TripList from '@/components/trips/trip-list';
import TripForm from '@/components/trips/trip-form';
import { z } from 'zod';

export default function Trips() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [addTripOpen, setAddTripOpen] = useState(false);
  const [editTripOpen, setEditTripOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Fetch trips
  const { data: trips, isLoading: isLoadingTrips } = useQuery<Trip[]>({
    queryKey: ['/api/trips/active'],
    onError: (error) => {
      toast({
        title: 'Error loading trips',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Fetch vehicles for the form
  const { data: vehicles } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles'],
    onError: (error) => {
      toast({
        title: 'Error loading vehicles',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Fetch users for the form
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
    onError: (error) => {
      toast({
        title: 'Error loading users',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Add trip mutation
  const addTripMutation = useMutation({
    mutationFn: async (tripData: z.infer<typeof insertTripSchema>) => {
      const res = await apiRequest('POST', '/api/trips', tripData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Trip added',
        description: 'The trip has been added successfully.',
      });
      setAddTripOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/trips/active'] });
    },
    onError: (error) => {
      toast({
        title: 'Error adding trip',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Update trip mutation
  const updateTripMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: z.infer<typeof insertTripSchema> }) => {
      const res = await apiRequest('PUT', `/api/trips/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Trip updated',
        description: 'The trip has been updated successfully.',
      });
      setEditTripOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/trips/active'] });
    },
    onError: (error) => {
      toast({
        title: 'Error updating trip',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Complete trip mutation
  const completeTripMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Trip> }) => {
      const res = await apiRequest('PUT', `/api/trips/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Trip completed',
        description: 'The trip has been marked as completed.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trips/active'] });
    },
    onError: (error) => {
      toast({
        title: 'Error completing trip',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Delete trip mutation
  const deleteTripMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/trips/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Trip deleted',
        description: 'The trip has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trips/active'] });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting trip',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Handle add trip
  const handleAddTrip = (data: z.infer<typeof insertTripSchema>) => {
    addTripMutation.mutate(data);
  };

  // Handle edit trip
  const handleEditTrip = (data: z.infer<typeof insertTripSchema>) => {
    if (selectedTrip) {
      updateTripMutation.mutate({ id: selectedTrip.id, data });
    }
  };

  // Handle edit button click
  const handleEditClick = (trip: Trip) => {
    setSelectedTrip(trip);
    setEditTripOpen(true);
  };

  // Handle complete trip
  const handleCompleteTrip = (trip: Trip, endOdometer: number, fuelConsumed: number) => {
    // Format the date as an ISO string to prevent issues with date serialization
    const completeData = {
      status: 'completed' as const,
      endTime: new Date().toISOString(),
      endOdometer,
      fuelConsumed
    };
    
    console.log('Completing trip with data:', completeData);
    
    completeTripMutation.mutate({
      id: trip.id,
      data: completeData
    });
  };

  // Handle delete
  const handleDeleteTrip = (id: number) => {
    deleteTripMutation.mutate(id);
  };

  // Filter trips based on search query
  const filteredTrips = trips ? trips.filter(trip => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const vehicle = vehicles?.find(v => v.id === trip.vehicleId);
    const driver = users?.find(u => u.id === trip.driverId);
    
    return (
      vehicle?.registrationNumber.toLowerCase().includes(query) ||
      vehicle?.make.toLowerCase().includes(query) ||
      vehicle?.model.toLowerCase().includes(query) ||
      driver?.name.toLowerCase().includes(query) ||
      trip.purpose?.toLowerCase().includes(query)
    );
  }) : [];

  // Calculate pagination
  const totalCount = filteredTrips.length;
  const paginatedTrips = filteredTrips.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Trips</h2>
          <p className="text-muted-foreground">Log and track vehicle trips</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search trips..."
              className="pl-9"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setAddTripOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Trip
          </Button>
        </div>
      </div>

      {isLoadingTrips ? (
        <Card className="p-8 flex items-center justify-center">
          <p>Loading trips...</p>
        </Card>
      ) : (
        <TripList
          trips={paginatedTrips}
          vehicles={vehicles || []}
          users={users || []}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onEdit={handleEditClick}
          onDelete={handleDeleteTrip}
          onComplete={handleCompleteTrip}
        />
      )}

      <TripForm
        open={addTripOpen}
        onOpenChange={setAddTripOpen}
        onSubmit={handleAddTrip}
        isSubmitting={addTripMutation.isPending}
        vehicles={vehicles || []}
        users={users || []}
        mode="add"
      />

      {selectedTrip && (
        <TripForm
          open={editTripOpen}
          onOpenChange={setEditTripOpen}
          onSubmit={handleEditTrip}
          isSubmitting={updateTripMutation.isPending}
          vehicles={vehicles || []}
          users={users || []}
          defaultValues={selectedTrip}
          mode="edit"
        />
      )}
    </div>
  );
}
