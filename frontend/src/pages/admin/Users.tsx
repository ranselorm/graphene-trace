import React, { useState } from "react";
import { Eye, Plus } from "lucide-react";

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
  seedUsers,
  dummyAvatar,
  initials,
} from "@/constants";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";

function roleLabel(role: UserRole) {
  if (role === "admin") return "Admin";
  if (role === "clinician") return "Clinician";
  return "Patient";
}

function StatusBadge({ status }: { status: UserStatus }) {
  if (status === "active") {
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

          <PopoverContent align="end" className="w-[340px] p-0">
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
                    value={statusFilter}
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
  const [users, setUsers] = React.useState(seedUsers);
  const [selected, setSelected] = React.useState<Record<number, boolean>>({});
  const [roleFilter, setRoleFilter] = React.useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = React.useState<UserStatus | "all">(
    "all",
  );
  const [search, setSearch] = React.useState("");
  const [isAddUserOpen, setIsAddUserOpen] = useState(true);

  const filtered = React.useMemo(() => {
    return users.filter((u) => {
      const roleOk = roleFilter === "all" || u.role === roleFilter;
      const statusOk = statusFilter === "all" || u.status === statusFilter;
      return roleOk && statusOk;
    });
  }, [users, roleFilter, statusFilter]);

  const allChecked =
    filtered.length > 0 && filtered.every((u) => selected[u.id]);
  const someChecked = filtered.some((u) => selected[u.id]) && !allChecked;

  const toggleAll = (checked: boolean) => {
    const next = { ...selected };
    filtered.forEach((u) => {
      next[u.id] = checked;
    });
    setSelected(next);
  };

  const toggleOne = (id: number, checked: boolean) => {
    setSelected((prev) => ({ ...prev, [id]: checked }));
  };

  const toggleStatus = (id: number, checked: boolean) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: checked ? "active" : "disabled" } : u,
      ),
    );
  };

  return (
    <div className="">
      <UsersToolbar
        totalCount={filtered.length}
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
                <TableHead>Last Login</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id} className="hover:bg-zinc-50">
                  <TableCell>
                    <Checkbox
                      checked={!!selected[u.id]}
                      onCheckedChange={(v) => toggleOne(u.id, !!v)}
                      aria-label={`Select ${u.name}`}
                    />
                  </TableCell>

                  <TableCell className="py-5">
                    <div className="flex items-center gap-3">
                      <Avatar className="8-7 w-8">
                        <AvatarImage
                          src={u.avatarUrl ?? dummyAvatar(u.name, "initials")}
                          alt={u.name}
                        />
                        <AvatarFallback className="text-white text-xs">
                          {initials(u.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="leading-tight">
                        <div className="font-medium text-zinc-900">
                          {u.name}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-zinc-700">{u.email}</TableCell>
                  <TableCell className="text-zinc-700">
                    {roleLabel(u.role)}
                  </TableCell>
                  <TableCell className="text-zinc-700">
                    {moment(u.createdOn, "M/DD/YY").format("MMM D, YYYY")}
                  </TableCell>
                  <TableCell className="text-zinc-700">{u.lastLogin}</TableCell>

                  <TableCell>
                    <StatusBadge status={u.status} />
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
                      <Switch
                        checked={u.status === "active"}
                        onCheckedChange={(checked) =>
                          toggleStatus(u.id, checked)
                        }
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filtered.length === 0 ? (
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
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        {/* <DialogTrigger>Open</DialogTrigger> */}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add user and assign a role</DialogTitle>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="fieldgroup-email">Full Name</FieldLabel>
              <Input
                id="fieldgroup-full_name"
                type="email"
                placeholder="Ran Selorm"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="fieldgroup-email">Email</FieldLabel>
              <Input
                id="fieldgroup-email"
                type="email"
                placeholder="ranselorm@example.com"
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="fieldgroup-email">Roles</FieldLabel>
              <Select>
                <SelectTrigger className="w-full max-w-48">
                  <SelectValue placeholder="Assign a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Roles</SelectLabel>
                    <SelectItem value="apple">Admin</SelectItem>
                    <SelectItem value="banana">Clinician</SelectItem>
                    <SelectItem value="blueberry">Patient</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field orientation="horizontal">
              <Button type="reset" variant="outline">
                Cancel
              </Button>
              <Button type="submit">Submit</Button>
            </Field>
          </FieldGroup>
        </DialogContent>
      </Dialog>
    </div>
  );
}
