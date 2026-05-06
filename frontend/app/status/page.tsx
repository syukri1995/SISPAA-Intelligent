"use client";

import { useState } from "react";
import { baseUrl } from "@/lib/api";

interface ComplaintStatus {
  id: string;
  complaint_text: string;
  location_text: string;
  status: string;
  created_at: string;
  updated_at: string;
  agency: string | null;
}

export default function StatusTracker() {
  const [searchType, setSearchType] = useState<"id" | "email">("id");
  const [searchValue, setSearchValue] = useState("");
  const [results, setResults] = useState<ComplaintStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchValue.trim()) {
      setError("Please enter a value to search");
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      let endpoint = "";
      
      if (searchType === "id") {
        endpoint = `${baseUrl}/complaint/${searchValue.trim()}/status`;
      } else {
        endpoint = `${baseUrl}/complaint/search?email=${encodeURIComponent(searchValue.trim())}`;
      }

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setError("No complaints found matching your search.");
        } else {
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.detail || "Failed to search complaints");
        }
        return;
      }

      const data = await response.json();
      
      // Handle single result (search by ID) or multiple results (search by email)
      if (Array.isArray(data)) {
        setResults(data);
      } else {
        setResults([data]);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("Failed to search complaints. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Track Your Complaint</h1>
        <p className="text-gray-600">Enter your complaint ID or email to check the status</p>
      </div>

      <form onSubmit={handleSearch} className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Type</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="id"
                  checked={searchType === "id"}
                  onChange={(e) => setSearchType(e.target.value as "id")}
                  className="mr-2"
                />
                <span>Complaint ID</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="email"
                  checked={searchType === "email"}
                  onChange={(e) => setSearchType(e.target.value as "email")}
                  className="mr-2"
                />
                <span>Email Address</span>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              {searchType === "id" ? "Complaint ID" : "Email Address"}
            </label>
            <input
              id="search"
              type={searchType === "id" ? "text" : "email"}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={searchType === "id" ? "e.g., 550e8400-e29b-41d4..." : "e.g., john@example.com"}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {results.map((complaint) => (
          <div key={complaint.id} className="bg-white border rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Complaint ID: {complaint.id.slice(0, 8)}...</h2>
                <p className="text-sm text-gray-600">Submitted on {formatDate(complaint.created_at)}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(complaint.status)}`}>
                {complaint.status || "Unknown"}
              </span>
            </div>

            <div className="space-y-3 border-t pt-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Complaint Details</p>
                <p className="text-gray-600">{complaint.complaint_text}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700">Location</p>
                <p className="text-gray-600">{complaint.location_text}</p>
              </div>

              {complaint.agency && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Assigned Agency</p>
                  <p className="text-gray-600">{complaint.agency}</p>
                </div>
              )}

              <div className="pt-2">
                <p className="text-xs text-gray-500">Last updated: {formatDate(complaint.updated_at)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {results.length === 0 && !error && !loading && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-2">No complaints found yet</p>
          <p className="text-sm text-gray-500">Use the form above to search for your complaint</p>
        </div>
      )}
    </div>
  );
}
