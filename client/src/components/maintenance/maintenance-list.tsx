import { Maintenance, Vehicle } from "@shared/schema";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Pagination, 
  PaginationContent, 
  PaginationEllipsis, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2, CheckCircle, Bolt } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { format, isPast, addDays } from "date-fns";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MaintenanceListProps {
  maintenanceRecords: Maintenance[];
  vehicles: Vehicle[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onEdit: (maintenance: Maintenance) => void;
  onDelete: (maintenanceId: number) => void;
  onComplete: (maintenance: Maintenance, cost: number) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
}

export default function MaintenanceList({
  maintenanceRecords,
  vehicles,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onEdit,
  onDelete,
  onComplete,
  statusFilter,
  setStatusFilter
}: MaintenanceListProps) {
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [maintenanceToDelete, setMaintenanceToDelete] = useState<number | null>(null);
  const [completeDialog, setCompleteDialog] = useState(false);
  const [maintenanceToComplete, setMaintenanceToComplete] = useState<Maintenance | null>(null);
  const [finalCost, setFinalCost] = useState(0);

  const totalPages = Math.ceil(totalCount / pageSize);
  const showingFrom = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingTo = Math.min(currentPage * pageSize, totalCount);

  const handleDeleteClick = (maintenanceId: number) => {
    setMaintenanceToDelete(maintenanceId);
    setDeleteAlert(true);
  };

  const handleDeleteConfirm = () => {
    if (maintenanceToDelete !== null) {
      onDelete(maintenanceToDelete);
      setDeleteAlert(false);
      setMaintenanceToDelete(null);
    }
  };

  const handleCompleteClick = (maintenance: Maintenance) => {
    setMaintenanceToComplete(maintenance);
    setFinalCost(maintenance.cost || 0);
    setCompleteDialog(true);
  };

  const handleCompleteConfirm = () => {
    if (maintenanceToComplete) {
      onComplete(maintenanceToComplete, finalCost);
      setCompleteDialog(false);
      setMaintenanceToComplete(null);
    }
  };

  const getVehicleInfo = (vehicleId: number) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber})` : 'Unknown Vehicle';
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">Pending</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderType = (type: string) => {
    switch (type) {
      case 'scheduled':
        return 'Scheduled';
      case 'unscheduled':
        return 'Unscheduled';
      case 'repair':
        return 'Repair';
      default:
        return type;
    }
  };

  const getDueStatus = (date: string) => {
    const maintenanceDate = new Date(date);
    const today = new Date();
    
    if (isPast(maintenanceDate) && maintenanceDate.getDate() !== today.getDate()) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else if (isPast(addDays(maintenanceDate, -3))) {
      return <Badge variant="warning">Due Soon</Badge>;
    } else {
      return <Badge variant="outline">Scheduled</Badge>;
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageItems = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    if (startPage > 1) {
      pageItems.push(
        <PaginationItem key="1">
          <PaginationLink onClick={() => onPageChange(1)}>1</PaginationLink>
        </PaginationItem>
      );
      
      if (startPage > 2) {
        pageItems.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageItems.push(
        <PaginationItem key={i}>
          <PaginationLink 
            isActive={i === currentPage}
            onClick={() => onPageChange(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageItems.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      
      pageItems.push(
        <PaginationItem key={totalPages}>
          <PaginationLink onClick={() => onPageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            />
          </PaginationItem>
          
          {pageItems}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  return (
    <>
      <div className="mb-6">
        <Label className="block text-sm font-medium mb-1">Filter by Status</Label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-1/4">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {maintenanceRecords.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Bolt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No maintenance records found</h3>
            <p className="text-muted-foreground mb-4">No maintenance is currently scheduled or matches your filter criteria.</p>
            <Button onClick={() => setStatusFilter('all')}>Reset filters</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Est. Cost</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {maintenanceRecords.map((maintenance) => (
                  <TableRow key={maintenance.id} className="hover:bg-muted/50">
                    <TableCell>{getVehicleInfo(maintenance.vehicleId)}</TableCell>
                    <TableCell>{maintenance.description}</TableCell>
                    <TableCell>{renderType(maintenance.type)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span>{format(new Date(maintenance.date), 'MMM d, yyyy')}</span>
                        {maintenance.status !== 'completed' && getDueStatus(maintenance.date)}
                      </div>
                    </TableCell>
                    <TableCell>{renderStatus(maintenance.status)}</TableCell>
                    <TableCell>{maintenance.cost ? `$${maintenance.cost.toFixed(2)}` : '—'}</TableCell>
                    <TableCell>
                      <div className="flex justify-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onEdit(maintenance)}
                          disabled={maintenance.status === 'completed'}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        {(maintenance.status === 'pending' || maintenance.status === 'in_progress') && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleCompleteClick(maintenance)}
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="sr-only">Complete</span>
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteClick(maintenance.id)}
                          disabled={maintenance.status === 'in_progress'}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="py-3 px-4 border-t flex flex-wrap md:flex-nowrap items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{showingFrom}</span> to <span className="font-medium">{showingTo}</span> of <span className="font-medium">{totalCount}</span> records
            </div>
            
            {renderPagination()}
          </div>
        </div>
      )}
      
      <AlertDialog open={deleteAlert} onOpenChange={setDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this maintenance record?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the maintenance record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <Dialog open={completeDialog} onOpenChange={setCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Maintenance</DialogTitle>
            <DialogDescription>
              Enter the final details to mark this maintenance as completed.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="final-cost">Final Cost ($)</Label>
              <Input 
                id="final-cost" 
                type="number" 
                value={finalCost}
                onChange={(e) => setFinalCost(parseFloat(e.target.value))}
                min={0}
                step={0.01}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCompleteDialog(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleCompleteConfirm}>
              Mark as Completed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
