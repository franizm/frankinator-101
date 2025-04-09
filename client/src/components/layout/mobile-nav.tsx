import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/ui/theme-provider";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Sun, Moon, Menu, LayoutDashboard, Car, Users, Route, 
  Bolt, Calendar, BarChart, LogOut 
} from 'lucide-react';

export default function MobileNav() {
  const { user, logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  // Base navigation items
  let navItems = [
    { href: "/", label: "Dashboard", icon: <LayoutDashboard className="mr-3 h-4 w-4" /> },
    { href: "/vehicles", label: "Vehicles", icon: <Car className="mr-3 h-4 w-4" /> },
    { href: "/employees", label: "Employees", icon: <Users className="mr-3 h-4 w-4" /> },
    { href: "/trips", label: "Trips", icon: <Route className="mr-3 h-4 w-4" /> },
    { href: "/maintenance", label: "Maintenance", icon: <Bolt className="mr-3 h-4 w-4" /> },
    { href: "/bookings", label: "Bookings", icon: <Calendar className="mr-3 h-4 w-4" /> },
    { href: "/reports", label: "Reports", icon: <BarChart className="mr-3 h-4 w-4" /> },
  ];
  
  // Add Users page link for admins
  if (user?.role === "admin") {
    navItems.push({ href: "/users", label: "User Management", icon: <Users className="mr-3 h-4 w-4" /> });
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
    setOpen(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="md:hidden bg-card border-b border-border sticky top-0 z-10">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-lg font-bold">Fleet Manager</h1>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="mr-2">
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
          
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <div className="p-4 border-b border-border">
                <h1 className="text-xl font-bold">Fleet Manager</h1>
              </div>
              
              <nav className="p-4 space-y-1">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <a
                      className={`flex items-center px-4 py-2 text-sm rounded-md ${
                        location === item.href
                          ? "bg-muted font-medium"
                          : "hover:bg-muted/50 font-medium"
                      }`}
                      onClick={() => setOpen(false)}
                    >
                      {item.icon}
                      {item.label}
                    </a>
                  </Link>
                ))}
              </nav>
              
              <div className="p-4 border-t border-border mt-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarFallback>{user?.name ? getInitials(user.name) : "U"}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user?.name || "User"}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                    <span className="sr-only">Logout</span>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
