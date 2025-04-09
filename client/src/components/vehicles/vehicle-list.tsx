import { Vehicle } from "@shared/schema";
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
import { Car, Pencil, Trash2, Bolt } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

interface VehicleListProps {
  vehicles: Vehicle[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicleId: number) => void;
  onMaintenance: (vehicle: Vehicle) => void;
}

export default function VehicleList({
  vehicles,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onEdit,
  onDelete,
  onMaintenance
}: VehicleListProps) {
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<number | null>(null);

  const totalPages = Math.ceil(totalCount / pageSize);
  const showingFrom = (currentPage - 1) * pageSize + 1;
  const showingTo = Math.min(currentPage * pageSize, totalCount);

  const handleDeleteClick = (vehicleId: number) => {
    setVehicleToDelete(vehicleId);
    setDeleteAlert(true);
  };

  const handleDeleteConfirm = () => {
    if (vehicleToDelete !== null) {
      onDelete(vehicleToDelete);
      setDeleteAlert(false);
      setVehicleToDelete(null);
    }
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">Available</Badge>;
      case 'maintenance':
        return <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">In Maintenance</Badge>;
      case 'in_use':
        return <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">In Use</Badge>;
      case 'out_of_service':
        return <Badge variant="outline" className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">Out of Service</Badge>;
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
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle Info</TableHead>
                <TableHead>Registration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mileage</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow key={vehicle.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-muted rounded-md flex items-center justify-center">
                        <Car className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="ml-3">
                        <p className="font-medium">{vehicle.make}</p>
                        <p className="text-muted-foreground text-xs">{vehicle.model} ({vehicle.year})</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{vehicle.registrationNumber}</TableCell>
                  <TableCell>{renderStatus(vehicle.status)}</TableCell>
                  <TableCell>{vehicle.mileage.toLocaleString()} mi</TableCell>
                  <TableCell>{vehicle.assignedToId ? "Assigned" : "—"}</TableCell>
                  <TableCell>
                    <div className="flex justify-center space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(vehicle)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onMaintenance(vehicle)}>
                        <Bolt className="h-4 w-4" />
                        <span className="sr-only">Maintenance</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(vehicle.id)}>
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
            Showing <span className="font-medium">{showingFrom}</span> to <span className="font-medium">{showingTo}</span> of <span className="font-medium">{totalCount}</span> vehicles
          </div>
          
          {renderPagination()}
        </div>
      </div>
      
      <AlertDialog open={deleteAlert} onOpenChange={setDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this vehicle?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the vehicle and all associated records.
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
    </>
  );
}
