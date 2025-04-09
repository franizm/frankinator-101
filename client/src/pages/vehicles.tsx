import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Vehicle, insertVehicleSchema } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Search } from 'lucide-react';
import VehicleFilter from '@/components/vehicles/vehicle-filter';
import VehicleList from '@/components/vehicles/vehicle-list';
import VehicleForm from '@/components/vehicles/vehicle-form';
import { z } from 'zod';

export default function Vehicles() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState('');
  const [make, setMake] = useState('');
  const [year, setYear] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  const [addVehicleOpen, setAddVehicleOpen] = useState(false);
  const [editVehicleOpen, setEditVehicleOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Fetch vehicles
  const { data, isLoading } = useQuery<Vehicle[]>({
    queryKey: ['/api/vehicles', status, make, year, sortBy, currentPage],
    onError: (error) => {
      toast({
        title: 'Error loading vehicles',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Add vehicle mutation
  const addVehicleMutation = useMutation({
    mutationFn: async (vehicleData: z.infer<typeof insertVehicleSchema>) => {
      const res = await apiRequest('POST', '/api/vehicles', vehicleData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Vehicle added',
        description: 'The vehicle has been added successfully.',
      });
      setAddVehicleOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
    },
    onError: (error) => {
      toast({
        title: 'Error adding vehicle',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Update vehicle mutation
  const updateVehicleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: z.infer<typeof insertVehicleSchema> }) => {
      const res = await apiRequest('PUT', `/api/vehicles/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Vehicle updated',
        description: 'The vehicle has been updated successfully.',
      });
      setEditVehicleOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
    },
    onError: (error) => {
      toast({
        title: 'Error updating vehicle',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Delete vehicle mutation
  const deleteVehicleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/vehicles/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Vehicle deleted',
        description: 'The vehicle has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/vehicles'] });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting vehicle',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Handle add vehicle
  const handleAddVehicle = (data: z.infer<typeof insertVehicleSchema>) => {
    addVehicleMutation.mutate(data);
  };

  // Handle edit vehicle
  const handleEditVehicle = (data: z.infer<typeof insertVehicleSchema>) => {
    if (selectedVehicle) {
      updateVehicleMutation.mutate({ id: selectedVehicle.id, data });
    }
  };

  // Handle edit button click
  const handleEditClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setEditVehicleOpen(true);
  };

  // Handle delete
  const handleDeleteVehicle = (id: number) => {
    deleteVehicleMutation.mutate(id);
  };

  // Handle maintenance button click
  const handleMaintenanceClick = (vehicle: Vehicle) => {
    // This would open a maintenance form modal
    toast({
      title: 'Maintenance',
      description: `Maintenance form for ${vehicle.make} ${vehicle.model} would open here.`,
    });
  };

  // Filter vehicles based on search query
  const filteredVehicles = data ? data.filter(vehicle => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      vehicle.make.toLowerCase().includes(query) ||
      vehicle.model.toLowerCase().includes(query) ||
      vehicle.registrationNumber.toLowerCase().includes(query)
    );
  }) : [];

  // Get unique makes and years for filters
  const makes = data ? [...new Set(data.map(vehicle => vehicle.make))].sort() : [];
  const years = data ? [...new Set(data.map(vehicle => vehicle.year.toString()))].sort((a, b) => parseInt(b) - parseInt(a)) : [];

  // Calculate pagination
  const totalCount = filteredVehicles.length;
  const paginatedVehicles = filteredVehicles.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vehicles</h2>
          <p className="text-muted-foreground">Manage your fleet vehicles</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search vehicles..."
              className="pl-9"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setAddVehicleOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Vehicle
          </Button>
        </div>
      </div>

      <VehicleFilter
        status={status}
        setStatus={setStatus}
        make={make}
        setMake={setMake}
        year={year}
        setYear={setYear}
        sortBy={sortBy}
        setSortBy={setSortBy}
        makes={makes}
        years={years}
      />

      {isLoading ? (
        <Card className="p-8 flex items-center justify-center">
          <p>Loading vehicles...</p>
        </Card>
      ) : (
        <VehicleList
          vehicles={paginatedVehicles}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onEdit={handleEditClick}
          onDelete={handleDeleteVehicle}
          onMaintenance={handleMaintenanceClick}
        />
      )}

      <VehicleForm
        open={addVehicleOpen}
        onOpenChange={setAddVehicleOpen}
        onSubmit={handleAddVehicle}
        isSubmitting={addVehicleMutation.isPending}
        mode="add"
      />

      {selectedVehicle && (
        <VehicleForm
          open={editVehicleOpen}
          onOpenChange={setEditVehicleOpen}
          onSubmit={handleEditVehicle}
          isSubmitting={updateVehicleMutation.isPending}
          defaultValues={selectedVehicle}
          mode="edit"
        />
      )}
    </div>
  );
}
