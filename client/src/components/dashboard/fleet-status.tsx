import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, XAxis, YAxis, Bar, ResponsiveContainer, Tooltip, Legend, TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

interface FleetStatusChartProps {
  data: {
    name: string;
    available: number;
    maintenance: number;
    inUse: number;
    outOfService: number;
  }[];
  period: 'week' | 'month';
  onPeriodChange: (period: 'week' | 'month') => void;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<ValueType, NameType>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border p-2 rounded-md shadow-md">
        <p className="font-medium">{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }

  return null;
};

export default function FleetStatusChart({ data, period, onPeriodChange }: FleetStatusChartProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">Vehicle Status Overview</h3>
          <div className="flex space-x-2">
            <Button 
              variant={period === 'week' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => onPeriodChange('week')}
            >
              This Week
            </Button>
            <Button 
              variant={period === 'month' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => onPeriodChange('month')}
            >
              This Month
            </Button>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="available" fill="#10B981" name="Available" />
              <Bar dataKey="maintenance" fill="#F59E0B" name="In Maintenance" />
              <Bar dataKey="inUse" fill="#3B82F6" name="In Use" />
              <Bar dataKey="outOfService" fill="#EF4444" name="Out of Service" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
