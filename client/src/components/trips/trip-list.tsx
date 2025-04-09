import { Trip, Vehicle, User } from "@shared/schema";
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
import { Pencil, Trash2, CheckCircle, Route } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";

interface TripListProps {
  trips: Trip[];
  vehicles: Vehicle[];
  users: User[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onEdit: (trip: Trip) => void;
  onDelete: (tripId: number) => void;
  onComplete: (trip: Trip, endOdometer: number, fuelConsumed: number) => void;
}

export default function TripList({
  trips,
  vehicles,
  users,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onEdit,
  onDelete,
  onComplete
}: TripListProps) {
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<number | null>(null);
  const [completeDialog, setCompleteDialog] = useState(false);
  const [tripToComplete, setTripToComplete] = useState<Trip | null>(null);
  const [endOdometer, setEndOdometer] = useState(0);
  const [fuelConsumed, setFuelConsumed] = useState(0);

  const totalPages = Math.ceil(totalCount / pageSize);
  const showingFrom = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingTo = Math.min(currentPage * pageSize, totalCount);

  const handleDeleteClick = (tripId: number) => {
    setTripToDelete(tripId);
    setDeleteAlert(true);
  };

  const handleDeleteConfirm = () => {
    if (tripToDelete !== null) {
      onDelete(tripToDelete);
      setDeleteAlert(false);
      setTripToDelete(null);
    }
  };

  const handleCompleteClick = (trip: Trip) => {
    const vehicle = vehicles.find(v => v.id === trip.vehicleId);
    setTripToComplete(trip);
    setEndOdometer(trip.startOdometer);
    setFuelConsumed(0);
    setCompleteDialog(true);
  };

  const handleCompleteConfirm = () => {
    if (tripToComplete) {
      onComplete(tripToComplete, endOdometer, fuelConsumed);
      setCompleteDialog(false);
      setTripToComplete(null);
    }
  };

  const getVehicleInfo = (vehicleId: number) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber})` : 'Unknown Vehicle';
  };

  const getDriverInfo = (driverId: number) => {
    const driver = users.find(u => u.id === driverId);
    return driver ? driver.name : 'Unknown Driver';
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case 'planned':
        return <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">Planned</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
      {trips.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Route className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No trips found</h3>
            <p className="text-muted-foreground mb-4">No trips are currently logged or match your search criteria.</p>
            <Button onClick={() => onPageChange(1)}>Reset filters</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.map((trip) => (
                  <TableRow key={trip.id} className="hover:bg-muted/50">
                    <TableCell>{getVehicleInfo(trip.vehicleId)}</TableCell>
                    <TableCell>{getDriverInfo(trip.driverId)}</TableCell>
                    <TableCell>{format(new Date(trip.startTime), 'MMM d, yyyy h:mm a')}</TableCell>
                    <TableCell>{trip.purpose || '—'}</TableCell>
                    <TableCell>{renderStatus(trip.status)}</TableCell>
                    <TableCell>
                      <div className="flex justify-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onEdit(trip)}
                          disabled={trip.status === 'completed' || trip.status === 'cancelled'}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        {trip.status === 'in_progress' && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleCompleteClick(trip)}
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="sr-only">Complete</span>
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteClick(trip.id)}
                          disabled={trip.status === 'in_progress'}
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
              Showing <span className="font-medium">{showingFrom}</span> to <span className="font-medium">{showingTo}</span> of <span className="font-medium">{totalCount}</span> trips
            </div>
            
            {renderPagination()}
          </div>
        </div>
      )}
      
      <AlertDialog open={deleteAlert} onOpenChange={setDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this trip?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the trip record.
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
            <DialogTitle>Complete Trip</DialogTitle>
            <DialogDescription>
              Enter the final details to complete this trip.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="end-odometer">Ending Odometer (miles)</Label>
              <Input 
                id="end-odometer" 
                type="number" 
                value={endOdometer}
                onChange={(e) => setEndOdometer(parseInt(e.target.value))}
                min={tripToComplete?.startOdometer || 0}
              />
              {tripToComplete && endOdometer < tripToComplete.startOdometer && (
                <p className="text-xs text-destructive">
                  Ending odometer cannot be less than starting odometer ({tripToComplete.startOdometer} miles)
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fuel-consumed">Fuel Consumed (gallons)</Label>
              <Input 
                id="fuel-consumed" 
                type="number" 
                value={fuelConsumed}
                onChange={(e) => setFuelConsumed(parseFloat(e.target.value))}
                min={0}
                step={0.1}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCompleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={handleCompleteConfirm}
              disabled={tripToComplete && endOdometer < tripToComplete.startOdometer}
            >
              Complete Trip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
