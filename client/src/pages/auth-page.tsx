import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Car, Users, Route, Wrench } from "lucide-react";

const loginSchema = insertUserSchema.pick({
  username: true,
  password: true,
});

export default function AuthPage() {
  const { user, loginMutation } = useAuth();

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Handle login form submission
  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(values);
  };

  // Redirect if user is already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Form side */}
      <div className="flex items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Fleet Manager</CardTitle>
            <CardDescription>
              Login to access the fleet management system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="********" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Contact an administrator to create an account.
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      
      {/* Hero side */}
      <div className="hidden md:flex flex-col items-center justify-center bg-muted p-8">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold mb-6">Fleet Management System</h1>
          <p className="text-lg mb-6">Efficiently manage your fleet of vehicles, track maintenance, assign to employees, and log trips all in one place.</p>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="flex items-start">
              <Car className="h-5 w-5 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium">Vehicle Management</h3>
                <p className="text-sm text-muted-foreground">Track all vehicle details</p>
              </div>
            </div>
            <div className="flex items-start">
              <Users className="h-5 w-5 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium">Employee Assignment</h3>
                <p className="text-sm text-muted-foreground">Assign vehicles to employees</p>
              </div>
            </div>
            <div className="flex items-start">
              <Route className="h-5 w-5 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium">Trip Logging</h3>
                <p className="text-sm text-muted-foreground">Record trip details and mileage</p>
              </div>
            </div>
            <div className="flex items-start">
              <Wrench className="h-5 w-5 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium">Maintenance Tracking</h3>
                <p className="text-sm text-muted-foreground">Schedule and track repairs</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
