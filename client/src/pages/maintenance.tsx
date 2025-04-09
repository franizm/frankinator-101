import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Maintenance, Vehicle, insertMaintenanceSchema } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Search } from 'lucide-react';
import MaintenanceList from '@/components/maintenance/maintenance-list';
import MaintenanceForm from '@/components/maintenance/maintenance-form';
import { z } from 'zod';

export default function MaintenancePage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [addMaintenanceOpen, setAddMaintenanceOpen] = useState(false);
  const [editMaintenanceOpen, setEditMaintenanceOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch upcoming maintenance
  const { data: maintenanceRecords, isLoading: isLoadingMaintenance } = useQuery<Maintenance[]>({
    queryKey: ['/api/maintenance/upcoming'],
    onError: (error) => {
      toast({
        title: 'Error loading maintenance records',
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

  // Add maintenance mutation
  const addMaintenanceMutation = useMutation({
    mutationFn: async (maintenanceData: z.infer<typeof insertMaintenanceSchema>) => {
      const res = await apiRequest('POST', '/api/maintenance', maintenanceData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Maintenance record added',
        description: 'The maintenance record has been added successfully.',
      });
      setAddMaintenanceOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance/upcoming'] });
    },
    onError: (error) => {
      toast({
        title: 'Error adding maintenance record',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Update maintenance mutation
  const updateMaintenanceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: z.infer<typeof insertMaintenanceSchema> }) => {
      const res = await apiRequest('PUT', `/api/maintenance/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Maintenance record updated',
        description: 'The maintenance record has been updated successfully.',
      });
      setEditMaintenanceOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance/upcoming'] });
    },
    onError: (error) => {
      toast({
        title: 'Error updating maintenance record',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Complete maintenance mutation
  const completeMaintenanceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<Maintenance> }) => {
      const res = await apiRequest('PUT', `/api/maintenance/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Maintenance completed',
        description: 'The maintenance has been marked as completed.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance/upcoming'] });
    },
    onError: (error) => {
      toast({
        title: 'Error completing maintenance',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Delete maintenance mutation
  const deleteMaintenanceMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/maintenance/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Maintenance record deleted',
        description: 'The maintenance record has been deleted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance/upcoming'] });
    },
    onError: (error) => {
      toast({
        title: 'Error deleting maintenance record',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Handle add maintenance
  const handleAddMaintenance = (data: z.infer<typeof insertMaintenanceSchema>) => {
    addMaintenanceMutation.mutate(data);
  };

  // Handle edit maintenance
  const handleEditMaintenance = (data: z.infer<typeof insertMaintenanceSchema>) => {
    if (selectedMaintenance) {
      updateMaintenanceMutation.mutate({ id: selectedMaintenance.id, data });
    }
  };

  // Handle edit button click
  const handleEditClick = (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance);
    setEditMaintenanceOpen(true);
  };

  // Handle complete maintenance
  const handleCompleteMaintenance = (maintenance: Maintenance, cost: number) => {
    completeMaintenanceMutation.mutate({
      id: maintenance.id,
      data: {
        status: 'completed',
        completedAt: new Date(),
        cost
      }
    });
  };

  // Handle delete
  const handleDeleteMaintenance = (id: number) => {
    deleteMaintenanceMutation.mutate(id);
  };

  // Filter maintenance records based on search query and status
  const filteredMaintenance = maintenanceRecords ? maintenanceRecords.filter(record => {
    // Status filter
    if (statusFilter && record.status !== statusFilter) return false;
    
    // Search query filter
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const vehicle = vehicles?.find(v => v.id === record.vehicleId);
    
    return (
      vehicle?.registrationNumber.toLowerCase().includes(query) ||
      vehicle?.make.toLowerCase().includes(query) ||
      vehicle?.model.toLowerCase().includes(query) ||
      record.description.toLowerCase().includes(query) ||
      record.type.toLowerCase().includes(query)
    );
  }) : [];

  // Calculate pagination
  const totalCount = filteredMaintenance.length;
  const paginatedMaintenance = filteredMaintenance.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Maintenance</h2>
          <p className="text-muted-foreground">Track vehicle maintenance records</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search maintenance..."
              className="pl-9"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setAddMaintenanceOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Schedule Maintenance
          </Button>
        </div>
      </div>

      {isLoadingMaintenance ? (
        <Card className="p-8 flex items-center justify-center">
          <p>Loading maintenance records...</p>
        </Card>
      ) : (
        <MaintenanceList
          maintenanceRecords={paginatedMaintenance}
          vehicles={vehicles || []}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onEdit={handleEditClick}
          onDelete={handleDeleteMaintenance}
          onComplete={handleCompleteMaintenance}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />
      )}

      <MaintenanceForm
        open={addMaintenanceOpen}
        onOpenChange={setAddMaintenanceOpen}
        onSubmit={handleAddMaintenance}
        isSubmitting={addMaintenanceMutation.isPending}
        vehicles={vehicles || []}
        mode="add"
      />

      {selectedMaintenance && (
        <MaintenanceForm
          open={editMaintenanceOpen}
          onOpenChange={setEditMaintenanceOpen}
          onSubmit={handleEditMaintenance}
          isSubmitting={updateMaintenanceMutation.isPending}
          vehicles={vehicles || []}
          defaultValues={selectedMaintenance}
          mode="edit"
        />
      )}
    </div>
  );
}
