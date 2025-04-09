import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Car, CheckCircle, Bolt, Route as RouteIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import StatCard from '@/components/dashboard/stat-card';
import MaintenanceItem from '@/components/dashboard/maintenance-item';
import ActivityTable from '@/components/dashboard/activity-table';
import FleetStatusChart from '@/components/dashboard/fleet-status';
import { useLocation } from 'wouter';

interface DashboardStats {
  totalVehicles: number;
  availableVehicles: number;
  inMaintenance: number;
  activeTrips: number;
}

const mockChartData = [
  {
    name: 'Mon',
    available: 18,
    maintenance: 2,
    inUse: 3,
    outOfService: 1,
  },
  {
    name: 'Tue',
    available: 17,
    maintenance: 3,
    inUse: 4,
    outOfService: 0,
  },
  {
    name: 'Wed',
    available: 16,
    maintenance: 3,
    inUse: 5,
    outOfService: 0,
  },
  {
    name: 'Thu',
    available: 16,
    maintenance: 2,
    inUse: 5,
    outOfService: 1,
  },
  {
    name: 'Fri',
    available: 18,
    maintenance: 2,
    inUse: 3,
    outOfService: 1,
  },
  {
    name: 'Sat',
    available: 20,
    maintenance: 1,
    inUse: 2,
    outOfService: 1,
  },
  {
    name: 'Sun',
    available: 21,
    maintenance: 1,
    inUse: 1,
    outOfService: 1,
  },
];

const mockMonthData = [
  {
    name: 'Week 1',
    available: 18,
    maintenance: 2,
    inUse: 3,
    outOfService: 1,
  },
  {
    name: 'Week 2',
    available: 16,
    maintenance: 3,
    inUse: 4,
    outOfService: 1,
  },
  {
    name: 'Week 3',
    available: 15,
    maintenance: 4,
    inUse: 4,
    outOfService: 1,
  },
  {
    name: 'Week 4',
    available: 17,
    maintenance: 3,
    inUse: 3,
    outOfService: 1,
  },
];

// Mock maintenance data - in a real app, this would come from an API
const mockUpcomingMaintenance = [
  {
    id: 1,
    vehicleId: 1,
    description: 'Oil Change & Inspection',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    status: 'pending',
    type: 'scheduled',
    cost: 150,
    odometer: 25000
  },
  {
    id: 2,
    vehicleId: 2,
    description: 'Brake Service',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'pending',
    type: 'scheduled',
    cost: 300,
    odometer: 36000
  },
  {
    id: 3,
    vehicleId: 3,
    description: 'Tire Rotation',
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    status: 'pending',
    type: 'scheduled',
    cost: 80,
    odometer: 15000
  }
];

// Mock vehicle data - in a real app, this would come from an API
const mockVehicles = [
  {
    id: 1,
    make: 'Toyota',
    model: 'Camry',
    year: 2021,
    registrationNumber: 'ABC-123',
    status: 'available',
    mileage: 24567
  },
  {
    id: 2,
    make: 'Ford',
    model: 'F-150',
    year: 2019,
    registrationNumber: 'XYZ-789',
    status: 'in_use',
    mileage: 42890
  },
  {
    id: 3,
    make: 'Honda',
    model: 'Civic',
    year: 2020,
    registrationNumber: 'DEF-456',
    status: 'maintenance',
    mileage: 35210
  }
];

const mockActivities = [
  {
    id: 1,
    type: 'booking' as const,
    vehicleName: 'Toyota Camry (ABC-123)',
    employeeName: 'John Smith',
    time: new Date(Date.now() - 30 * 60 * 1000),
    status: 'confirmed' as const
  },
  {
    id: 2,
    type: 'maintenance' as const,
    vehicleName: 'Honda Civic (DEF-456)',
    employeeName: 'Service Center',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'completed' as const
  },
  {
    id: 3,
    type: 'trip' as const,
    vehicleName: 'Ford F-150 (XYZ-789)',
    employeeName: 'Sarah Johnson',
    time: new Date(Date.now() - 24 * 60 * 60 * 1000),
    status: 'in_progress' as const
  },
  {
    id: 4,
    type: 'vehicle' as const,
    vehicleName: 'Nissan Altima (GHI-789)',
    employeeName: 'Admin',
    time: new Date(Date.now() - 36 * 60 * 60 * 1000),
    status: 'new' as const
  }
];

export default function Dashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month'>('week');

  // Fetch dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    onError: (error) => {
      toast({
        title: 'Error fetching dashboard stats',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">Fleet overview and key metrics</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Vehicles"
          value={isLoadingStats ? '-' : (stats?.totalVehicles || 0).toString()}
          icon={<Car className="h-5 w-5" />}
          iconBgColor="bg-blue-100 dark:bg-blue-900"
          iconColor="text-blue-600 dark:text-blue-300"
        />
        <StatCard
          title="Available Vehicles"
          value={isLoadingStats ? '-' : (stats?.availableVehicles || 0).toString()}
          icon={<CheckCircle className="h-5 w-5" />}
          iconBgColor="bg-green-100 dark:bg-green-900"
          iconColor="text-green-600 dark:text-green-300"
        />
        <StatCard
          title="In Maintenance"
          value={isLoadingStats ? '-' : (stats?.inMaintenance || 0).toString()}
          icon={<Bolt className="h-5 w-5" />}
          iconBgColor="bg-yellow-100 dark:bg-yellow-900"
          iconColor="text-yellow-600 dark:text-yellow-300"
        />
        <StatCard
          title="Active Trips"
          value={isLoadingStats ? '-' : (stats?.activeTrips || 0).toString()}
          icon={<RouteIcon className="h-5 w-5" />}
          iconBgColor="bg-purple-100 dark:bg-purple-900"
          iconColor="text-purple-600 dark:text-purple-300"
        />
      </div>

      {/* Fleet status and upcoming maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <FleetStatusChart 
            data={chartPeriod === 'week' ? mockChartData : mockMonthData} 
            period={chartPeriod} 
            onPeriodChange={setChartPeriod} 
          />
        </div>
        
        <div className="flex flex-col h-full">
          <Card className="flex-grow">
            <CardContent className="p-4 flex flex-col h-full">
              <h3 className="font-semibold mb-4">Upcoming Maintenance</h3>
              <div className="space-y-3 flex-grow">
                {mockUpcomingMaintenance.map((maintenance) => {
                  const vehicle = mockVehicles.find(v => v.id === maintenance.vehicleId)!;
                  return (
                    <MaintenanceItem 
                      key={maintenance.id} 
                      maintenance={maintenance}
                      vehicle={vehicle}
                    />
                  );
                })}
              </div>
              <Button 
                variant="link" 
                className="w-full mt-4" 
                onClick={() => setLocation('/maintenance')}
              >
                View All Maintenance
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent activities */}
      <Card>
        <CardContent className="p-4">
          <ActivityTable 
            activities={mockActivities}
            onViewAll={() => setLocation('/trips')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
