import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  iconBgColor: string;
  iconColor: string;
}

export default function StatCard({ title, value, icon, iconBgColor, iconColor }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
          </div>
          <div className={`${iconBgColor} p-2 rounded-md`}>
            <div className={`${iconColor} text-xl`}>
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
