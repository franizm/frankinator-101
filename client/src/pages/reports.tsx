import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import FuelConsumptionChart from '@/components/reports/fuel-consumption-chart';
import MaintenanceCostChart from '@/components/reports/maintenance-cost-chart';
import VehicleUtilizationChart from '@/components/reports/vehicle-utilization-chart';

export default function Reports() {
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState('month');
  const [vehicleId, setVehicleId] = useState('all');

  // Mock data for demonstration - in a real app, this would come from API calls
  const fuelConsumptionData = [
    { vehicle: 'Toyota Camry', consumption: 85, month: 'Jan' },
    { vehicle: 'Toyota Camry', consumption: 78, month: 'Feb' },
    { vehicle: 'Toyota Camry', consumption: 92, month: 'Mar' },
    { vehicle: 'Honda Civic', consumption: 65, month: 'Jan' },
    { vehicle: 'Honda Civic', consumption: 70, month: 'Feb' },
    { vehicle: 'Honda Civic', consumption: 68, month: 'Mar' },
    { vehicle: 'Ford F-150', consumption: 120, month: 'Jan' },
    { vehicle: 'Ford F-150', consumption: 115, month: 'Feb' },
    { vehicle: 'Ford F-150', consumption: 125, month: 'Mar' },
  ];

  const maintenanceCostData = [
    { vehicle: 'Toyota Camry', cost: 350, month: 'Jan' },
    { vehicle: 'Toyota Camry', cost: 0, month: 'Feb' },
    { vehicle: 'Toyota Camry', cost: 250, month: 'Mar' },
    { vehicle: 'Honda Civic', cost: 0, month: 'Jan' },
    { vehicle: 'Honda Civic', cost: 420, month: 'Feb' },
    { vehicle: 'Honda Civic', cost: 0, month: 'Mar' },
    { vehicle: 'Ford F-150', cost: 180, month: 'Jan' },
    { vehicle: 'Ford F-150', cost: 0, month: 'Feb' },
    { vehicle: 'Ford F-150', cost: 560, month: 'Mar' },
  ];

  const utilizationData = [
    { vehicle: 'Toyota Camry', trips: 18, hours: 42, month: 'Jan' },
    { vehicle: 'Toyota Camry', trips: 15, hours: 38, month: 'Feb' },
    { vehicle: 'Toyota Camry', trips: 20, hours: 45, month: 'Mar' },
    { vehicle: 'Honda Civic', trips: 12, hours: 30, month: 'Jan' },
    { vehicle: 'Honda Civic', trips: 14, hours: 35, month: 'Feb' },
    { vehicle: 'Honda Civic', trips: 11, hours: 28, month: 'Mar' },
    { vehicle: 'Ford F-150', trips: 9, hours: 25, month: 'Jan' },
    { vehicle: 'Ford F-150', trips: 8, hours: 20, month: 'Feb' },
    { vehicle: 'Ford F-150', trips: 10, hours: 30, month: 'Mar' },
  ];

  const vehicles = [
    { id: '1', name: 'Toyota Camry (ABC-123)' },
    { id: '2', name: 'Honda Civic (DEF-456)' },
    { id: '3', name: 'Ford F-150 (XYZ-789)' },
  ];

  // Filter data based on selected vehicle
  const filterDataByVehicle = (data: any[]) => {
    if (vehicleId === 'all') return data;
    
    const vehicleName = vehicles.find(v => v.id === vehicleId)?.name.split(' ')[0] || '';
    return data.filter(item => item.vehicle === vehicleName);
  };

  const filteredFuelData = filterDataByVehicle(fuelConsumptionData);
  const filteredMaintenanceData = filterDataByVehicle(maintenanceCostData);
  const filteredUtilizationData = filterDataByVehicle(utilizationData);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Reports</h2>
        <p className="text-muted-foreground">Analyze fleet performance and costs</p>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/2 lg:w-1/4">
          <Label className="block text-sm font-medium mb-1">Time Range</Label>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger>
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full md:w-1/2 lg:w-1/4">
          <Label className="block text-sm font-medium mb-1">Vehicle</Label>
          <Select value={vehicleId} onValueChange={setVehicleId}>
            <SelectTrigger>
              <SelectValue placeholder="Select vehicle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vehicles</SelectItem>
              {vehicles.map(vehicle => (
                <SelectItem key={vehicle.id} value={vehicle.id}>{vehicle.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="fuel" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 mb-6">
          <TabsTrigger value="fuel">Fuel Consumption</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance Costs</TabsTrigger>
          <TabsTrigger value="utilization">Vehicle Utilization</TabsTrigger>
        </TabsList>
        
        <TabsContent value="fuel">
          <Card>
            <CardHeader>
              <CardTitle>Fuel Consumption Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <FuelConsumptionChart data={filteredFuelData} />
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">
                  This chart shows fuel consumption in gallons for each vehicle over time. 
                  Compare trends to identify vehicles that may need maintenance or are less fuel-efficient.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Cost Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <MaintenanceCostChart data={filteredMaintenanceData} />
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">
                  This chart tracks maintenance costs for each vehicle over time.
                  Use this data to budget for future maintenance and identify vehicles with higher upkeep costs.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="utilization">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Utilization Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <VehicleUtilizationChart data={filteredUtilizationData} />
              </div>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">
                  This chart displays how often each vehicle is used.
                  Identify underutilized assets or vehicles that may need more frequent maintenance due to heavy use.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
