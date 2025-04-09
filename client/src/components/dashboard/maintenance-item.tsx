import { Maintenance, Vehicle } from '@shared/schema';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface MaintenanceItemProps {
  maintenance: Maintenance;
  vehicle: Vehicle;
}

export default function MaintenanceItem({ maintenance, vehicle }: MaintenanceItemProps) {
  const getDueBadgeStyles = (date: Date) => {
    const now = new Date();
    const dueDate = new Date(date);
    const diffDays = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return {
        text: `Overdue by ${Math.abs(diffDays)} days`,
        variant: "destructive" as const
      };
    } else if (diffDays <= 3) {
      return {
        text: `Due in ${diffDays} days`,
        variant: "warning" as const
      };
    } else {
      return {
        text: `Due in ${diffDays} days`,
        variant: "outline" as const
      };
    }
  };

  const dueBadge = getDueBadgeStyles(new Date(maintenance.date));

  return (
    <div className="p-3 rounded-md bg-muted/50">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium text-sm">
            {vehicle.make} {vehicle.model} ({vehicle.registrationNumber})
          </p>
          <p className="text-xs text-muted-foreground">{maintenance.description}</p>
        </div>
        <Badge variant={dueBadge.variant}>{dueBadge.text}</Badge>
      </div>
    </div>
  );
}
