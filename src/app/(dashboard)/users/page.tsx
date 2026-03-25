"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus, Trash2, Shield, User, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Profile } from "@/lib/types";

export default function UsersPage() {
  const supabase = createClient();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // New user form
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "user">("user");
  const [creating, setCreating] = useState(false);

  const loadUsers = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true });
    setProfiles(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async () => {
    if (!newEmail || !newPassword || !newName) {
      toast.error("All fields are required");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setCreating(true);
    try {
      // Use the admin invite endpoint via edge function or direct signup
      const response = await fetch("/api/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          full_name: newName,
          role: newRole,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to create user");

      toast.success("User created successfully");
      setDialogOpen(false);
      setNewEmail("");
      setNewPassword("");
      setNewName("");
      setNewRole("user");
      loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
          <p className="text-muted-foreground">
            Add and manage team members who can create proposals.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger
            render={
              <Button className="bg-[#1B5E20] hover:bg-[#0D3311] text-white">
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            }
          />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="user@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as "admin" | "user")}
                  className="w-full rounded-md border border-input px-3 py-2 bg-background text-sm"
                >
                  <option value="user">User (can create proposals)</option>
                  <option value="admin">Admin (full access)</option>
                </select>
              </div>
              <Button
                onClick={handleCreateUser}
                disabled={creating}
                className="w-full bg-[#1B5E20] hover:bg-[#0D3311] text-white"
              >
                {creating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="mr-2 h-4 w-4" />
                )}
                Create User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-3">
          {profiles.map((profile) => (
            <Card key={profile.id}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#E8F5E9] flex items-center justify-center">
                      {profile.role === "admin" ? (
                        <Shield className="h-5 w-5 text-[#1B5E20]" />
                      ) : (
                        <User className="h-5 w-5 text-[#1B5E20]" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{profile.full_name || "Unnamed"}</p>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={
                        profile.role === "admin"
                          ? "bg-[#E8F5E9] text-[#1B5E20] border-0"
                          : "bg-gray-100 text-gray-700 border-0"
                      }
                    >
                      {profile.role === "admin" ? "Admin" : "User"}
                    </Badge>
                    {profile.id === currentUserId && (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-0">
                        You
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
