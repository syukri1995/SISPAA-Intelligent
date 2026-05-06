export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">SISPAA</div>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Page not found</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          The route you requested does not exist.
        </p>
      </div>
    </div>
  );
}
