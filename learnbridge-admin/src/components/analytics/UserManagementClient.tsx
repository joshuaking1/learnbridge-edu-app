// src/components/admin/UserManagementClient.tsx
"use client";
import { useState, useTransition, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { searchAndFilterUsers } from "@/app/dashboard/users/actions";
import { useDebounce } from "@/hooks/useDebounce"; // We will create this hook next

// Define a more complete user type
type User = {
    id: string;
    full_name: string | null;
    email: string | undefined;
    role: string | null;
    is_admin: boolean;
    created_at: string;
    last_sign_in_at: string | null;
}

export const UserManagementClient = ({ initialUsers }: { initialUsers: User[] }) => {
    const [users, setUsers] = useState(initialUsers);
    const [isPending, startTransition] = useTransition();
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    
    const debouncedSearchTerm = useDebounce(searchTerm, 300); // Debounce input by 300ms

    const performSearch = useCallback(() => {
        startTransition(async () => {
            const result = await searchAndFilterUsers(debouncedSearchTerm, roleFilter);
            if (result.users) {
                setUsers(result.users);
            }
        });
    }, [debouncedSearchTerm, roleFilter]);

    // This effect triggers the search whenever the debounced search term or the filter changes.
    useEffect(() => {
        performSearch();
    }, [performSearch]);

    return (
        <div className="mt-6">
            <div className="flex items-center justify-between py-4">
                <Input 
                    placeholder="Search users by name or email..." 
                    className="max-w-sm bg-slate-800 border-slate-600"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px] bg-slate-800 border-slate-600">
                        <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="rounded-md border border-slate-700 relative">
                 {isPending && <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin"/></div>}
      <div className="rounded-md border border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700">
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Last Seen</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="border-slate-700">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {user.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold">{user.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.user_data?.[0]?.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        user.role === "teacher" ? "default" : "secondary"
                      }
                    >
                      {user.role}
                    </Badge>
                    {user.is_admin && (
                      <Badge variant="destructive">Admin</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {user.user_data?.[0]?.last_sign_in_at
                    ? new Date(
                        user.user_data[0].last_sign_in_at
                      ).toLocaleString()
                    : "Never"}
                </TableCell>
                <TableCell>
                  {new Date(user.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuItem>View Activity Log</DropdownMenuItem>
                      <DropdownMenuItem className="text-yellow-500">
                        Suspend User
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500">
                        Ban User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
            </div>
        </div>
    );
};
