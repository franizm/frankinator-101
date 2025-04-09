import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatRelative } from 'date-fns';

interface Activity {
  id: number;
  type: 'booking' | 'maintenance' | 'trip' | 'vehicle';
  vehicleName: string;
  employeeName: string;
  time: Date;
  status: 'confirmed' | 'completed' | 'in_progress' | 'new';
}

interface ActivityTableProps {
  activities: Activity[];
  onViewAll: () => void;
}

export default function ActivityTable({ activities, onViewAll }: ActivityTableProps) {
  const getStatusBadge = (status: Activity['status']) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">Confirmed</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">In Progress</Badge>;
      case 'new':
        return <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">New</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatActivityType = (type: Activity['type']) => {
    switch (type) {
      case 'booking':
        return 'Vehicle Booked';
      case 'maintenance':
        return 'Maintenance Completed';
      case 'trip':
        return 'Trip Started';
      case 'vehicle':
        return 'Vehicle Added';
      default:
        return type;
    }
  };

  const formatTime = (date: Date) => {
    return formatRelative(date, new Date());
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Recent Activities</h3>
        <Button variant="ghost" size="sm" onClick={onViewAll}>
          View All
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Activity</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell>{formatActivityType(activity.type)}</TableCell>
                <TableCell>{activity.vehicleName}</TableCell>
                <TableCell>{activity.employeeName}</TableCell>
                <TableCell>{formatTime(activity.time)}</TableCell>
                <TableCell>{getStatusBadge(activity.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
