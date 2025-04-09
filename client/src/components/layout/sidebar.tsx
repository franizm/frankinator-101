import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/components/ui/theme-provider";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  Sun, Moon, LayoutDashboard, Car, Users, Route, 
  Bolt, Calendar, BarChart, LogOut
} from 'lucide-react';

export default function Sidebar() {
  const { user, logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  const [location] = useLocation();

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
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <aside className="w-64 bg-card border-r border-border h-screen flex flex-col fixed">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold">Fleet Manager</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <a
              className={`flex items-center px-4 py-2 text-sm rounded-md ${
                location === item.href
                  ? "bg-muted font-medium"
                  : "hover:bg-muted/50 font-medium"
              }`}
            >
              {item.icon}
              {item.label}
            </a>
          </Link>
        ))}
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarFallback>{user?.name ? getInitials(user.name) : "U"}</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium truncate">{user?.name || "User"}</span>
          <div className="ml-auto flex gap-1">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
}
