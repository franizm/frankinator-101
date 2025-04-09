import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface FuelData {
  vehicle: string;
  consumption: number;
  month: string;
}

interface FuelConsumptionChartProps {
  data: FuelData[];
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border bg-background p-3 shadow-md">
        <p className="font-medium">{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value} gallons`}
          </p>
        ))}
      </div>
    );
  }

  return null;
};

export default function FuelConsumptionChart({ data }: FuelConsumptionChartProps) {
  // Process data to group by month
  const processedData = data.reduce((acc: any[], curr: FuelData) => {
    const existingMonthIndex = acc.findIndex(item => item.month === curr.month);
    
    if (existingMonthIndex >= 0) {
      acc[existingMonthIndex][curr.vehicle] = curr.consumption;
    } else {
      const newItem: any = { month: curr.month };
      newItem[curr.vehicle] = curr.consumption;
      acc.push(newItem);
    }
    
    return acc;
  }, []);

  // Get unique vehicles for bars
  const uniqueVehicles = Array.from(new Set(data.map(item => item.vehicle)));

  // Generate colors for each vehicle
  const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

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
        <YAxis name="Gallons" unit=" gal" />
        <Tooltip content={<CustomTooltip />} />
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
