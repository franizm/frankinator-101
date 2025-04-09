import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface MaintenanceData {
  vehicle: string;
  cost: number;
  month: string;
}

interface MaintenanceCostChartProps {
  data: MaintenanceData[];
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border bg-background p-3 shadow-md">
        <p className="font-medium">{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {`${entry.name}: $${entry.value}`}
          </p>
        ))}
      </div>
    );
  }

  return null;
};

export default function MaintenanceCostChart({ data }: MaintenanceCostChartProps) {
  // Process data to group by month
  const processedData = data.reduce((acc: any[], curr: MaintenanceData) => {
    const existingMonthIndex = acc.findIndex(item => item.month === curr.month);
    
    if (existingMonthIndex >= 0) {
      acc[existingMonthIndex][curr.vehicle] = curr.cost;
    } else {
      const newItem: any = { month: curr.month };
      newItem[curr.vehicle] = curr.cost;
      acc.push(newItem);
    }
    
    return acc;
  }, []);

  // Get unique vehicles for bars
  const uniqueVehicles = Array.from(new Set(data.map(item => item.vehicle)));

  // Generate colors for each vehicle
  const colors = ['#FF8042', '#8884D8', '#0088FE', '#00C49F', '#FFBB28'];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={processedData}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
        <XAxis dataKey="month" />
        <YAxis name="Cost" unit="$" />
        <Tooltip content={<CustomTooltip />} formatter={(value) => [`$${value}`, 'Cost']} />
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
  );
}
