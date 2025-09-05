// learnbridge-admin/src/components/admin/UserManagementClient.tsx
"use client";
import { useState, useTransition, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  Loader2,
  UserX,
  UserCheck,
  Eye,
  History,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  searchAndFilterUsers,
  toggleUserSuspension,
  banUser,
} from "@/app/dashboard/users/actions";
import { useDebounce } from "@/hooks/useDebounce";

// For brevity
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type User = any;

export const UserManagementClient = ({
  initialUsers,
}: {
  initialUsers: User[];
}) => {
  const [users, setUsers] = useState(initialUsers);
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [alertState, setAlertState] = useState<{
    action: () => void;
    title: string;
    description: string;
  } | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const performSearch = useCallback(() => {
    startTransition(async () => {
      const result = await searchAndFilterUsers(
        debouncedSearchTerm,
        roleFilter
      );
      if (result?.users) setUsers(result.users);
    });
  }, [debouncedSearchTerm, roleFilter]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const handleSuspend = (user: User) => {
    setAlertState({
      action: () =>
        startTransition(() => toggleUserSuspension(user.id, user.status)),
      title: `Are you sure you want to ${
        user.status === "active" ? "suspend" : "unsuspend"
      } this user?`,
      description:
        "Suspended users cannot create new content. This action can be undone.",
    });
  };

  const handleBan = (user: User) => {
    setAlertState({
      action: () => startTransition(() => banUser(user.id)),
      title: "Are you sure you want to permanently ban this user?",
      description:
        "This action is irreversible. The user will be logged out and unable to sign in again.",
    });
  };

  const getStatusBadge = (status: string) => {
    if (status === "banned") return <Badge variant="destructive">Banned</Badge>;
    if (status === "suspended")
      return (
        <Badge variant="secondary" className="bg-yellow-500 text-white">
          Suspended
        </Badge>
      );
    return null;
  };

  return (
    <>
      <div className="mt-6">
        {/* Search and Filter */}
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
          {isPending && (
            <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center z-10">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-800/50">
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: User) => (
                <TableRow key={user.id} className="border-slate-800">
                  <TableCell>
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
                    <Badge
                      variant={
                        user.role === "teacher" ? "default" : "secondary"
                      }
                    >
                      {user.role}
                    </Badge>
                    {user.is_admin && (
                      <Badge variant="destructive" className="ml-2">
                        Admin
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <History className="mr-2 h-4 w-4" />
                          View Activity Log
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleSuspend(user)}
                          className="text-yellow-400"
                        >
                          {user.status === "active" ? (
                            <>
                              <ShieldAlert className="mr-2 h-4 w-4" />
                              Suspend User
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Unsuspend User
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleBan(user)}
                          className="text-red-500"
                        >
                          <UserX className="mr-2 h-4 w-4" />
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

      {/* Confirmation Dialog (replaces AlertDialog using existing Dialog components) */}
      <Dialog
        open={!!alertState}
        onOpenChange={(open) => {
          if (!open) setAlertState(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{alertState?.title}</DialogTitle>
            <DialogDescription>{alertState?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlertState(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                alertState?.action();
                setAlertState(null);
              }}
              className={
                alertState?.title?.toLowerCase().includes("ban")
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-yellow-500 hover:bg-yellow-600"
              }
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
