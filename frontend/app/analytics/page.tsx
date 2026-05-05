"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar } from "recharts";

const COLORS = ["#0B1F3A", "#06B6D4", "#22C55E", "#F59E0B", "#EF4444"];

export default function AnalyticsPage() {
  // Prototype: static sample. Wire to backend aggregation endpoints when needed.
  const data = useMemo(
    () => ({
      byCategory: [
        { name: "Infrastructure", value: 14 },
        { name: "Transport", value: 9 },
        { name: "Healthcare", value: 4 },
        { name: "Facilities", value: 6 },
        { name: "Other", value: 3 }
      ],
      overTime: [
        { day: "Mon", count: 8 },
        { day: "Tue", count: 11 },
        { day: "Wed", count: 9 },
        { day: "Thu", count: 14 },
        { day: "Fri", count: 7 }
      ],
      workload: [
        { agency: "DBKL", count: 18 },
        { agency: "APAD", count: 9 },
        { agency: "KKM", count: 4 }
      ]
    }),
    []
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="card p-5 lg:col-span-1">
        <div className="font-medium text-slate-900">Complaints by Category</div>
        <div className="h-72 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.byCategory} dataKey="value" nameKey="name" outerRadius={110}>
                {data.byCategory.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5 lg:col-span-2">
        <div className="font-medium text-slate-900">Complaints Over Time</div>
        <div className="h-72 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.overTime}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#06B6D4" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5 lg:col-span-3">
        <div className="font-medium text-slate-900">Agency Workload</div>
        <div className="h-72 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.workload}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="agency" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#0B1F3A" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

