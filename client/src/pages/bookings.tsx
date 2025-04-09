import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Booking, Vehicle, User, insertBookingSchema } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Search } from 'lucide-react';
import BookingList from '@/components/bookings/booking-list';
import BookingForm from '@/components/bookings/booking-form';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';

export default function Bookings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [addBookingOpen, setAddBookingOpen] = useState(false);
  const [editBookingOpen, setEditBookingOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  // Fetch all bookings for now (debugging)
  const bookingsEndpoint = '/api/bookings';

  // Fetch bookings
  const { data: bookings, isLoading: isLoadingBookings } = useQuery<Booking[]>({
    queryKey: [bookingsEndpoint],
    enabled: !!user,
    onError: (error) => {
      console.error('Error fetching bookings:', error);
      toast({
        title: 'Error loading bookings',
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

  // Fetch users for the form (admins only)
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: user?.role === 'admin',
    onError: (error) => {
      toast({
        title: 'Error loading users',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Add booking mutation
  const addBookingMutation = useMutation({
    mutationFn: async (bookingData: z.infer<typeof insertBookingSchema>) => {
      const res = await apiRequest('POST', '/api/bookings', bookingData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Booking created',
        description: 'The booking has been created successfully.',
      });
      setAddBookingOpen(false);
      queryClient.invalidateQueries({ queryKey: [bookingsEndpoint] });
    },
    onError: (error) => {
      toast({
        title: 'Error creating booking',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Update booking mutation
  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: z.infer<typeof insertBookingSchema> }) => {
      const res = await apiRequest('PUT', `/api/bookings/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Booking updated',
        description: 'The booking has been updated successfully.',
      });
      setEditBookingOpen(false);
      queryClient.invalidateQueries({ queryKey: [bookingsEndpoint] });
    },
    onError: (error) => {
      toast({
        title: 'Error updating booking',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Update booking status mutation
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const res = await apiRequest('PUT', `/api/bookings/${id}`, { status });
      return await res.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Booking status updated',
        description: `The booking has been ${variables.status}.`,
      });
      queryClient.invalidateQueries({ queryKey: [bookingsEndpoint] });
    },
    onError: (error) => {
      toast({
        title: 'Error updating booking status',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Delete booking mutation
  const deleteBookingMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/bookings/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Booking deleted',
        description: 'The booking has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: [bookingsEndpoint] });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting booking',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Handle add booking
  const handleAddBooking = (data: z.infer<typeof insertBookingSchema>) => {
    // If not admin, set the userId to the current user
    if (user?.role !== 'admin') {
      data.userId = user?.id || 0;
    }
    addBookingMutation.mutate(data);
  };

  // Handle edit booking
  const handleEditBooking = (data: z.infer<typeof insertBookingSchema>) => {
    if (selectedBooking) {
      updateBookingMutation.mutate({ id: selectedBooking.id, data });
    }
  };

  // Handle edit button click
  const handleEditClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setEditBookingOpen(true);
  };

  // Handle status change
  const handleStatusChange = (id: number, status: string) => {
    updateBookingStatusMutation.mutate({ id, status });
  };

  // Handle delete
  const handleDeleteBooking = (id: number) => {
    deleteBookingMutation.mutate(id);
  };

  // Filter bookings based on search query
  const filteredBookings = bookings ? bookings.filter(booking => {
    // Search query filter
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    
    // Find the vehicle and user data related to this booking
    const vehicle = vehicles?.find(v => v.id === booking.vehicleId);
    const bookingUser = users?.find(u => u.id === booking.userId);
    
    return (
      vehicle?.registrationNumber?.toLowerCase().includes(query) ||
      vehicle?.make?.toLowerCase().includes(query) ||
      vehicle?.model?.toLowerCase().includes(query) ||
      bookingUser?.name?.toLowerCase().includes(query) ||
      (booking.purpose && booking.purpose.toLowerCase().includes(query))
    );
  }) : [];

  // Calculate pagination
  const totalCount = filteredBookings.length;
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bookings</h2>
          <p className="text-muted-foreground">Reserve vehicles for trips</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search bookings..."
              className="pl-9"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setAddBookingOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Book Vehicle
          </Button>
        </div>
      </div>

      {isLoadingBookings ? (
        <Card className="p-8 flex items-center justify-center">
          <p>Loading bookings...</p>
        </Card>
      ) : (
        <BookingList
          bookings={paginatedBookings}
          vehicles={vehicles || []}
          users={users || []}
          currentUser={user}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onEdit={handleEditClick}
          onDelete={handleDeleteBooking}
          onStatusChange={handleStatusChange}
          statusFilter=""
          setStatusFilter={() => {}}
        />
      )}

      <BookingForm
        open={addBookingOpen}
        onOpenChange={setAddBookingOpen}
        onSubmit={handleAddBooking}
        isSubmitting={addBookingMutation.isPending}
        vehicles={vehicles || []}
        users={users || []}
        currentUser={user}
        mode="add"
      />

      {selectedBooking && (
        <BookingForm
          open={editBookingOpen}
          onOpenChange={setEditBookingOpen}
          onSubmit={handleEditBooking}
          isSubmitting={updateBookingMutation.isPending}
          vehicles={vehicles || []}
          users={users || []}
          currentUser={user}
          defaultValues={selectedBooking}
          mode="edit"
        />
      )}
    </div>
  );
}
