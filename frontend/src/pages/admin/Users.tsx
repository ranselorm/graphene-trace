import React, { useMemo, useState } from "react";
import { Eye, Plus, Trash2 } from "lucide-react";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import moment from "moment";
import { Icon } from "@iconify/react";
import { Input } from "@/components/ui/input";
import { SlidersHorizontal, Download, Upload, X } from "lucide-react";
import {
  type UserRole,
  type UserStatus,
  dummyAvatar,
  initials,
} from "@/constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { useUsers } from "@/hooks/useUsers";
import { useCreateUser, useDeleteUser } from "@/hooks/useCreateUser";
import { toast } from "sonner";

type NewUserRole = "clinician" | "patient";

function roleLabel(role: UserRole) {
  if (role === "admin") return "Admin";
  if (role === "clinician") return "Clinician";
  return "Patient";
}
//USE THIS CODE LATER FOR DYNAMIC STATUS

// function StatusBadge({ status }: { status: UserStatus }) {
//   if (status === "active") {
//     return (
//       <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100">
//         Active
//       </Badge>
//     );
//   }
//   return (
//     <Badge className="bg-rose-100 text-rose-900 hover:bg-rose-100">
//       Disabled
//     </Badge>
//   );
// }

//DUMMY STATUS CODE. HARD CODED

function StatusBadge({ status }: { status: UserStatus }) {
  if (status === true) {
    return (
      <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100">
        Active
      </Badge>
    );
  }
  return (
    <Badge className="bg-rose-100 text-rose-900 hover:bg-rose-100">
      Disabled
    </Badge>
  );
}

function formatCreatedOnDate(value?: string | null) {
  if (!value) {
    return "Mar 11, 2026";
  }

  const parsedDate = moment(value);
  return parsedDate.isValid()
    ? parsedDate.format("MMM D, YYYY")
    : "Mar 11, 2026";
}

export function UsersToolbar({
  totalCount,
  search,
  onSearchChange,
  roleFilter,
  statusFilter,
  onRoleChange,
  onStatusChange,
  onClearFilters,
  onApplyFilters,
  onAddUser,
}: {
  totalCount: number;

  search: string;
  onSearchChange: (value: string) => void;

  roleFilter: UserRole | "all";
  statusFilter: UserStatus | "all";
  onRoleChange: (value: UserRole | "all") => void;
  onStatusChange: (value: UserStatus | "all") => void;

  onClearFilters: () => void;
  onApplyFilters: () => void;

  onAddUser: () => void;
}) {
  const hasFilters = roleFilter !== "all" || statusFilter !== "all";

  // const [users, setUsers] = React.useState(seedUsers);

  // const filtered = React.useMemo(() => {
  //   const q = search.trim().toLowerCase();

  //   return users.filter((u) => {
  //     const roleOk = roleFilter === "all" || u.role === roleFilter;
  //     const statusOk = statusFilter === "all" || u.status === statusFilter;

  //     const searchOk =
  //       !q ||
  //       u.name.toLowerCase().includes(q) ||
  //       u.email.toLowerCase().includes(q);

  //     return roleOk && statusOk && searchOk;
  //   });
  // }, [users, roleFilter, statusFilter, search]);

  return (
    <div className="rounded-xl bg-white border border-zinc-200 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      {/* Left: title */}
      <div className="flex items-center gap-2">
        <div className="text-base font-semibold text-zinc-900">Users</div>
        <div className="text-xs text-zinc-500 rounded-full border border-zinc-200 px-2 py-0.5">
          {totalCount}
        </div>
      </div>

      {/* Middle: search */}
      <div className="w-full md:max-w-md">
        <Input
          placeholder="Search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="rounded-lg"
        />
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 justify-end">
        <Button variant="outline" size="icon" className="rounded-lg">
          <Upload className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="rounded-lg">
          <Download className="h-4 w-4" />
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="rounded-lg">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filter
              {hasFilters ? (
                <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-blue-500" />
              ) : null}
            </Button>
          </PopoverTrigger>

          <PopoverContent align="end" className="w-85 p-0">
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-zinc-900">
                    Filter
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    Narrow results by role and status.
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-lg"
                  onClick={onClearFilters}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4 space-y-3">
                <div className="space-y-2">
                  <div className="text-xs text-zinc-500">User role</div>
                  <Select
                    value={roleFilter}
                    onValueChange={(v) => onRoleChange(v as any)}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="User Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="clinician">Clinician</SelectItem>
                      <SelectItem value="patient">Patient</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="text-xs text-zinc-500">Status</div>
                  <Select
                    // value={statusFilter}
                    onValueChange={(v) => onStatusChange(v as any)}
                  >
                    <SelectTrigger className="rounded-lg">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    className="rounded-lg"
                    onClick={onClearFilters}
                  >
                    Reset
                  </Button>
                  <Button className="rounded-lg" onClick={onApplyFilters}>
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button className="rounded-lg" onClick={onAddUser}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [statusByUserId, setStatusByUserId] = useState<Record<number, boolean>>(
    {},
  );
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    role: "clinician" | "patient";
    username?: string | null;
  } | null>(null);
  const [newUserRole, setNewUserRole] = useState<NewUserRole>("clinician");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [riskCategory, setRiskCategory] = useState<"low" | "medium" | "high">(
    "low",
  );

  // hooks
  const { data } = useUsers();
  const createUserMutation = useCreateUser();
  const deleteUserMutation = useDeleteUser();

  const filteredUsers = useMemo(() => {
    const sourceUsers = data?.users ?? [];

    const filtered = sourceUsers.filter((u: any) => {
      const roleOk = roleFilter === "all" || u.role === roleFilter;
      const statusOk =
        statusFilter === "all" || Boolean(u.status) === statusFilter;
      const q = search.trim().toLowerCase();
      const searchOk =
        !q ||
        `${u.username ?? ""}`.toLowerCase().includes(q) ||
        `${u.email ?? ""}`.toLowerCase().includes(q) ||
        `${u.full_name ?? ""}`.toLowerCase().includes(q);

      return roleOk && statusOk && searchOk;
    });

    // Newest users first.
    return filtered.sort((a: any, b: any) => {
      const aTime = new Date(
        a.created_at ?? a.date_joined ?? a.createdOn ?? a.createdAt ?? 0,
      ).getTime();
      const bTime = new Date(
        b.created_at ?? b.date_joined ?? b.createdOn ?? b.createdAt ?? 0,
      ).getTime();

      if (aTime !== bTime) return bTime - aTime;

      // Fallback for equal/missing timestamps.
      return Number(b.id ?? 0) - Number(a.id ?? 0);
    });
  }, [data?.users, roleFilter, statusFilter, search]);

  const allChecked =
    filteredUsers.length > 0 && filteredUsers.every((u: any) => selected[u.id]);
  const someChecked =
    filteredUsers.some((u: any) => selected[u.id]) && !allChecked;

  const toggleAll = (checked: boolean) => {
    const next = { ...selected };
    filteredUsers.forEach((u: any) => {
      next[u.id] = checked;
    });
    setSelected(next);
  };

  const toggleOne = (id: number, checked: boolean) => {
    setSelected((prev) => ({ ...prev, [id]: checked }));
  };

  const toggleStatus = (id: number, checked: boolean) => {
    setStatusByUserId((prev) => ({ ...prev, [id]: checked }));
  };

  const resetAddUserForm = () => {
    setNewUserRole("clinician");
    setFullName("");
    setEmail("");
    setUsername("");
    setPassword("");
    setSpecialty("");
    setDateOfBirth("");
    setRiskCategory("low");
  };

  const getErrorMessage = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data as any;
      return (
        data?.error || data?.detail || error.message || "Failed to create user"
      );
    }
    if (error instanceof Error) return error.message;
    return "Failed to create user";
  };

  const isCreateUserFormValid =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    username.trim().length > 0 &&
    password.trim().length > 0;

  const handleCreateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password || !username) {
      toast.error("Email, username and password are required");
      return;
    }

    createUserMutation.mutate(
      {
        role: newUserRole,
        full_name: fullName,
        email,
        username,
        password,
        specialty: newUserRole === "clinician" ? specialty : undefined,
        date_of_birth: newUserRole === "patient" ? dateOfBirth : undefined,
        risk_category: newUserRole === "patient" ? riskCategory : undefined,
      },
      {
        onSuccess: () => {
          toast.success(`${newUserRole} created successfully`, {
            style: {
              background: "#2e5090",
              color: "#ffffff",
              border: "0.5px solid #dbeafe",
            },
          });
          setIsAddUserOpen(false);
          resetAddUserForm();
        },
        onError: (error) => {
          toast.error(getErrorMessage(error), {
            style: {
              background: "#FF5C5C",
              color: "#ffffff",
              border: "0.5px solid #FF8A8A",
            },
          });
        },
      },
    );
  };

  const handleDeleteUser = (
    userId: number,
    role: "clinician" | "patient",
    username?: string | null,
  ) => {
    setDeleteTarget({ id: userId, role, username });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const { id, role } = deleteTarget;
    const label = role === "clinician" ? "Clinician" : "Patient";

    deleteUserMutation.mutate(
      { id, role },
      {
        onSuccess: () => {
          toast.success(`${label} deleted successfully`, {
            style: {
              background: "#2e5090",
              color: "#ffffff",
              border: "0.5px solid #dbeafe",
            },
          });
          setDeleteTarget(null);
        },
        onError: (error) => {
          toast.error(getErrorMessage(error), {
            style: {
              background: "#FF5C5C",
              color: "#ffffff",
              border: "0.5px solid #FF8A8A",
            },
          });
        },
      },
    );
  };

  return (
    <div className="">
      <UsersToolbar
        totalCount={data?.users?.length ?? 0}
        search={search}
        onSearchChange={setSearch}
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        onRoleChange={setRoleFilter}
        onStatusChange={setStatusFilter}
        onClearFilters={() => {
          setRoleFilter("all");
          setStatusFilter("all");
        }}
        onApplyFilters={() => {}}
        // onAddUser={() => console.log("open create user modal")}
        onAddUser={() => setIsAddUserOpen(true)}
      />

      <Card className="border-none bg-white shadow-none mt-4">
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-11">
                  <Checkbox
                    checked={
                      allChecked ? true : someChecked ? "indeterminate" : false
                    }
                    onCheckedChange={(v) => toggleAll(!!v)}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Created On</TableHead>
                {/* <TableHead>Last Login</TableHead> */}
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredUsers.map((user: any) => (
                <TableRow key={user?.id} className="hover:bg-zinc-50">
                  <TableCell>
                    <Checkbox
                      checked={!!selected[user?.id]}
                      onCheckedChange={(v) => toggleOne(user?.id, !!v)}
                      aria-label={`Select ${user?.username}`}
                    />
                  </TableCell>

                  <TableCell className="py-5">
                    <div className="flex items-center gap-3">
                      <Avatar className="8-7 w-8">
                        <AvatarImage
                          src={
                            user?.avatarUrl ??
                            dummyAvatar(
                              user?.username ?? user?.name,
                              "initials",
                            )
                          }
                          alt={user?.username}
                        />
                        <AvatarFallback className="text-white text-xs">
                          {initials(user?.username)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="leading-tight">
                        <div className="font-medium text-zinc-900">
                          {user?.username}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-zinc-700">{user?.email}</TableCell>
                  <TableCell className="text-zinc-700">
                    {roleLabel(user?.role)}
                  </TableCell>
                  <TableCell className="text-zinc-700">
                    {formatCreatedOnDate(
                      user?.created_on ??
                        user?.createdAt ??
                        user?.createdOn ??
                        user?.date_joined ??
                        user?.created_at,
                    )}
                  </TableCell>
                  {/* <TableCell className="text-zinc-700">{u.lastLogin}</TableCell> */}

                  <TableCell>
                    <StatusBadge status={statusByUserId[user?.id] ?? true} />
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-lg"
                      >
                        <Eye className="h-4 w-4 text-zinc-700" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-lg"
                      >
                        {/* <Pencil className="h-4 w-4 text-zinc-700" /> */}
                        <Icon icon="mage:edit" />
                      </Button>
                      {user?.role !== "admin" ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-lg"
                          disabled={deleteUserMutation.isPending}
                          onClick={() =>
                            handleDeleteUser(
                              user?.id,
                              user?.role,
                              user?.username,
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4 text-rose-600" />
                        </Button>
                      ) : null}
                      {/* <Switch
                        checked={u.status === "active"}
                        onCheckedChange={(checked) =>
                          toggleStatus(u.id, checked)
                        }
                      /> */}
                      <Switch
                        checked={statusByUserId[user?.id] ?? true}
                        onCheckedChange={(checked) =>
                          toggleStatus(user?.id, checked)
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-10 text-center text-zinc-500"
                  >
                    No users match your filters.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-200 px-4 py-3">
          <div className="text-sm text-zinc-500">Page 1 of 10</div>

          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-lg" disabled>
              Previous
            </Button>
            <Button variant="outline" className="rounded-lg">
              1
            </Button>
            <Button variant="outline" className="rounded-lg">
              2
            </Button>
            <Button variant="outline" className="rounded-lg">
              3
            </Button>
            <Button variant="outline" className="rounded-lg">
              4
            </Button>
            <div className="px-2 text-zinc-500">…</div>
            <Button variant="outline" className="rounded-lg">
              10
            </Button>
            <Button variant="outline" className="rounded-lg">
              Next
            </Button>
          </div>
        </div>
      </Card>
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.role}?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">
                {deleteTarget?.username || "this user"}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="rounded-lg"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteUserMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="rounded-lg bg-[#FF5C5C] hover:bg-[#e85555] text-white"
              onClick={confirmDelete}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAddUserOpen}
        onOpenChange={(open) => {
          setIsAddUserOpen(open);
          if (!open) resetAddUserForm();
        }}
      >
        {/* <DialogTrigger>Open</DialogTrigger> */}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add user and assign a role</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="fieldgroup-full_name">
                  Full Name
                </FieldLabel>
                <Input
                  id="fieldgroup-full_name"
                  type="text"
                  placeholder="Ran Selorm"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="fieldgroup-email">Email</FieldLabel>
                <Input
                  id="fieldgroup-email"
                  type="email"
                  placeholder="ranselorm@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="fieldgroup-username">Username</FieldLabel>
                <Input
                  id="fieldgroup-username"
                  type="text"
                  placeholder="ranselorm"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="fieldgroup-password">Password</FieldLabel>
                <Input
                  id="fieldgroup-password"
                  type="password"
                  placeholder="Password123"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="fieldgroup-role">Role</FieldLabel>
                <Select
                  value={newUserRole}
                  onValueChange={(value) =>
                    setNewUserRole(value as NewUserRole)
                  }
                >
                  <SelectTrigger id="fieldgroup-role" className="w-full">
                    <SelectValue placeholder="Assign a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Roles</SelectLabel>
                      <SelectItem value="clinician">Clinician</SelectItem>
                      <SelectItem value="patient">Patient</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>

              {newUserRole === "clinician" ? (
                <Field>
                  <FieldLabel htmlFor="fieldgroup-specialty">
                    Specialty
                  </FieldLabel>
                  <Input
                    id="fieldgroup-specialty"
                    type="text"
                    placeholder="Cardiology"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                  />
                </Field>
              ) : null}

              {newUserRole === "patient" ? (
                <>
                  <Field>
                    <FieldLabel htmlFor="fieldgroup-dob">
                      Date of Birth
                    </FieldLabel>
                    <Input
                      id="fieldgroup-dob"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="fieldgroup-risk">
                      Risk Category
                    </FieldLabel>
                    <Select
                      value={riskCategory}
                      onValueChange={(value) =>
                        setRiskCategory(value as "low" | "medium" | "high")
                      }
                    >
                      <SelectTrigger id="fieldgroup-risk" className="w-full">
                        <SelectValue placeholder="Risk category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </>
              ) : null}

              <Field orientation="horizontal">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddUserOpen(false);
                    resetAddUserForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    createUserMutation.isPending || !isCreateUserFormValid
                  }
                >
                  {createUserMutation.isPending ? "Submitting..." : "Submit"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
