import { Booking, Vehicle, User } from "@shared/schema";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, Trash2, MoreVertical, Calendar } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";

interface BookingListProps {
  bookings: Booking[];
  vehicles: Vehicle[];
  users: User[];
  currentUser: User | null;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onEdit: (booking: Booking) => void;
  onDelete: (bookingId: number) => void;
  onStatusChange: (bookingId: number, status: string) => void;

}

export default function BookingList({
  bookings,
  vehicles,
  users,
  currentUser,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onEdit,
  onDelete,
  onStatusChange
}: BookingListProps) {
  const [deleteAlert, setDeleteAlert] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<number | null>(null);

  const totalPages = Math.ceil(totalCount / pageSize);
  const showingFrom = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showingTo = Math.min(currentPage * pageSize, totalCount);

  const handleDeleteClick = (bookingId: number) => {
    setBookingToDelete(bookingId);
    setDeleteAlert(true);
  };

  const handleDeleteConfirm = () => {
    if (bookingToDelete !== null) {
      onDelete(bookingToDelete);
      setDeleteAlert(false);
      setBookingToDelete(null);
    }
  };

  const getVehicleInfo = (vehicleId: number) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.registrationNumber})` : 'Unknown Vehicle';
  };

  const getUserInfo = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">Approved</Badge>;
      case 'declined':
        return <Badge variant="outline" className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">Declined</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">Cancelled</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canChangeStatus = (booking: Booking) => {
    return currentUser?.role === 'admin' && booking.status !== 'completed';
  };

  const canEdit = (booking: Booking) => {
    // Admin can edit non-completed bookings
    if (currentUser?.role === 'admin') {
      return booking.status !== 'completed';
    }
    
    // Users can only edit their pending bookings
    return booking.userId === currentUser?.id && booking.status === 'pending';
  };

  const canDelete = (booking: Booking) => {
    // Admin can delete any booking
    if (currentUser?.role === 'admin') {
      return true;
    }
    
    // Users can only delete their pending or approved bookings
    return booking.userId === currentUser?.id && 
           (booking.status === 'pending' || booking.status === 'approved');
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
      
      {bookings.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No bookings found</h3>
            <p className="text-muted-foreground mb-4">No bookings are currently available.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  {currentUser?.role === 'admin' && <TableHead>Booked By</TableHead>}
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id} className="hover:bg-muted/50">
                    <TableCell>{getVehicleInfo(booking.vehicleId)}</TableCell>
                    {currentUser?.role === 'admin' && <TableCell>{getUserInfo(booking.userId)}</TableCell>}
                    <TableCell>{typeof booking.startTime === 'string' ? format(new Date(booking.startTime), 'MMM d, yyyy h:mm a') : format(booking.startTime, 'MMM d, yyyy h:mm a')}</TableCell>
                    <TableCell>{typeof booking.endTime === 'string' ? format(new Date(booking.endTime), 'MMM d, yyyy h:mm a') : format(booking.endTime, 'MMM d, yyyy h:mm a')}</TableCell>
                    <TableCell>{booking.purpose || '—'}</TableCell>
                    <TableCell>{renderStatus(booking.status)}</TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEdit(booking) && (
                              <DropdownMenuItem onClick={() => onEdit(booking)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {canDelete(booking) && (
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(booking.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                            {currentUser?.role === 'admin' && booking.status === 'pending' && (
                              <>
                                <DropdownMenuItem 
                                  onClick={() => onStatusChange(booking.id, 'approved')}
                                  className="text-green-600 dark:text-green-400"
                                >
                                  Approve
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => onStatusChange(booking.id, 'declined')}
                                  className="text-red-600 dark:text-red-400"
                                >
                                  Decline
                                </DropdownMenuItem>
                              </>
                            )}
                            {booking.status === 'approved' && (
                              <DropdownMenuItem 
                                onClick={() => onStatusChange(booking.id, 'completed')}
                              >
                                Mark as Completed
                              </DropdownMenuItem>
                            )}
                            {(booking.status === 'pending' || booking.status === 'approved') && (
                              <DropdownMenuItem 
                                onClick={() => onStatusChange(booking.id, 'cancelled')}
                                className="text-gray-600 dark:text-gray-400"
                              >
                                Cancel
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="py-3 px-4 border-t flex flex-wrap md:flex-nowrap items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{showingFrom}</span> to <span className="font-medium">{showingTo}</span> of <span className="font-medium">{totalCount}</span> bookings
            </div>
            
            {renderPagination()}
          </div>
        </div>
      )}
      
      <AlertDialog open={deleteAlert} onOpenChange={setDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the booking record.
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
