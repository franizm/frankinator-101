import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface VehicleFilterProps {
  status: string;
  setStatus: (status: string) => void;
  make: string;
  setMake: (make: string) => void;
  year: string;
  setYear: (year: string) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  makes: string[];
  years: string[];
}

export default function VehicleFilter({
  status,
  setStatus,
  make,
  setMake,
  year,
  setYear,
  sortBy,
  setSortBy,
  makes,
  years
}: VehicleFilterProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/4">
            <Label className="block text-sm font-medium mb-1">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="maintenance">In Maintenance</SelectItem>
                <SelectItem value="in_use">In Use</SelectItem>
                <SelectItem value="out_of_service">Out of Service</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-1/4">
            <Label className="block text-sm font-medium mb-1">Make</Label>
            <Select value={make} onValueChange={setMake}>
              <SelectTrigger>
                <SelectValue placeholder="All Makes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Makes</SelectItem>
                {makes.map((makeName) => (
                  <SelectItem key={makeName} value={makeName}>{makeName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-1/4">
            <Label className="block text-sm font-medium mb-1">Model Year</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger>
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map((yearValue) => (
                  <SelectItem key={yearValue} value={yearValue}>{yearValue}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="w-full md:w-1/4">
            <Label className="block text-sm font-medium mb-1">Sort By</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="mileage">Mileage (High to Low)</SelectItem>
                <SelectItem value="make">Make (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
