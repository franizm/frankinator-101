import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface UtilizationData {
  vehicle: string;
  trips: number;
  hours: number;
  month: string;
}

interface VehicleUtilizationChartProps {
  data: UtilizationData[];
}

const CustomTooltip = ({ active, payload, label, metricLabel }: TooltipProps<ValueType, NameType> & { metricLabel: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border bg-background p-3 shadow-md">
        <p className="font-medium">{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value} ${metricLabel}`}
          </p>
        ))}
      </div>
    );
  }

  return null;
};

export default function VehicleUtilizationChart({ data }: VehicleUtilizationChartProps) {
  const [metric, setMetric] = useState<'trips' | 'hours'>('trips');
  
  // Process data to group by month
  const processTripsData = data.reduce((acc: any[], curr: UtilizationData) => {
    const existingMonthIndex = acc.findIndex(item => item.month === curr.month);
    
    if (existingMonthIndex >= 0) {
      acc[existingMonthIndex][curr.vehicle] = curr.trips;
    } else {
      const newItem: any = { month: curr.month };
      newItem[curr.vehicle] = curr.trips;
      acc.push(newItem);
    }
    
    return acc;
  }, []);
  
  const processHoursData = data.reduce((acc: any[], curr: UtilizationData) => {
    const existingMonthIndex = acc.findIndex(item => item.month === curr.month);
    
    if (existingMonthIndex >= 0) {
      acc[existingMonthIndex][curr.vehicle] = curr.hours;
    } else {
      const newItem: any = { month: curr.month };
      newItem[curr.vehicle] = curr.hours;
      acc.push(newItem);
    }
    
    return acc;
  }, []);

  // Get unique vehicles for bars
  const uniqueVehicles = Array.from(new Set(data.map(item => item.vehicle)));

  // Generate colors for each vehicle
  const colors = ['#8884D8', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="h-full flex flex-col">
      <Tabs defaultValue="trips" value={metric} onValueChange={(v) => setMetric(v as 'trips' | 'hours')} className="mb-4">
        <TabsList className="grid w-full grid-cols-2 max-w-[300px] mx-auto">
          <TabsTrigger value="trips">Number of Trips</TabsTrigger>
          <TabsTrigger value="hours">Hours Used</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={metric === 'trips' ? processTripsData : processHoursData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis dataKey="month" />
            <YAxis unit={metric === 'trips' ? " trips" : " hrs"} />
            <Tooltip content={<CustomTooltip metricLabel={metric === 'trips' ? 'trips' : 'hours'} />} />
            <Legend />
            {uniqueVehicles.map((vehicle, index) => (
              <Bar 
                key={vehicle}
                dataKey={vehicle} 
                name={vehicle}
                fill={colors[index % colors.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
