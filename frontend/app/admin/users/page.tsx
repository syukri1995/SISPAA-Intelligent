"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, getAccessToken } from "@/lib/auth";
import { baseUrl } from "@/lib/api";

interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: "admin" | "supervisor" | "worker" | "public";
  agency: string | null;
  is_active: boolean;
  created_at: string;
}

export default function UserManagement() {
  const router = useRouter();
  const [user, setUser] = useState(getCurrentUser());
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<string>("");
  const [editAgency, setEditAgency] = useState<string>("");

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      router.push("/dashboard");
      return;
    }
    setUser(currentUser);

    // Fetch users
    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      const response = await fetch(`${baseUrl}/auth/workers`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }

      const data = await response.json();
      setUsers(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err instanceof Error ? err.message : "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (u: User) => {
    setEditingId(u.id);
    setEditRole(u.role);
    setEditAgency(u.agency || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditRole("");
    setEditAgency("");
  };

  const saveEdit = async (userId: string) => {
    try {
      const token = getAccessToken();
      const response = await fetch(`${baseUrl}/auth/users/${userId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: editRole,
          agency: editAgency || null,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update user: ${response.statusText}`);
      }

      // Refresh users list
      await fetchUsers();
      setEditingId(null);
    } catch (err) {
      console.error("Error updating user:", err);
      setError(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  if (!user || user.role !== "admin") {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (loading) {
    return <div className="text-center py-10">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-gray-600">Create, edit, and manage user accounts</p>
        </div>
        <button
          onClick={() => router.push("/auth/register")}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          New User
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      <div className="bg-white border rounded-lg overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Username</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Full Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Agency</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{u.username}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{u.email}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{u.full_name || "—"}</td>
                <td className="px-6 py-4 text-sm">
                  {editingId === u.id ? (
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      <option value="admin">Admin</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="worker">Staff</option>
                      <option value="public">Public</option>
                    </select>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {u.role}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm">
                  {editingId === u.id ? (
                    <input
                      type="text"
                      value={editAgency}
                      onChange={(e) => setEditAgency(e.target.value)}
                      placeholder="e.g., DBKL"
                      className="px-2 py-1 border rounded text-sm w-20"
                    />
                  ) : (
                    u.agency || "—"
                  )}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${u.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                    {u.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm flex gap-2">
                  {editingId === u.id ? (
                    <>
                      <button
                        onClick={() => saveEdit(u.id)}
                        className="text-green-600 hover:text-green-800 font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => startEdit(u)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No users found</p>
        </div>
      )}
    </div>
  );
}
