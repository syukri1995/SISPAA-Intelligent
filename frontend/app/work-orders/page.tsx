"use client";

export default function WorkOrdersPage() {
  return (
    <div className="card p-5">
      <div className="font-medium text-slate-900">Work Orders</div>
      <div className="mt-2 text-sm text-slate-600">
        Prototype note: work orders are created via `/complaint`. Extend backend with a `/work-orders` endpoint to list and expand timeline.
      </div>
    </div>
  );
}

