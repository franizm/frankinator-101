import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search } from 'lucide-react';

export default function Employees() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch employees
  const { data: employees, isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    onError: (error) => {
      toast({
        title: 'Error loading employees',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Employees</h2>
          <p className="text-muted-foreground">Manage employees and assign vehicles</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <div className="relative flex-grow md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search employees..."
              className="pl-9"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card className="p-8 flex items-center justify-center">
          <p>Loading employees...</p>
        </Card>
      ) : employees && employees.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map(employee => (
            <Card key={employee.id}>
              <CardHeader className="pb-2">
                <CardTitle>{employee.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Position:</span>
                    <span>{employee.position || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{employee.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Phone:</span>
                    <span>{employee.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Role:</span>
                    <span className="capitalize">{employee.role}</span>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm">Assign Vehicle</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <p>No employees found.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
