function PagePlaceholder({ title, description }) {
  return (
    <div className="min-h-screen bg-[#f6f8fc] p-6">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-medium text-indigo-600">ProofFlow AI</p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
          {title}
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          {description}
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-slate-500">
            This workspace is being prepared.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PagePlaceholder;