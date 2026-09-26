import { LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#f6f8fc] p-6">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-medium text-indigo-600">ProofFlow AI</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
          Settings
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage your ProofFlow workspace.
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-slate-500">
            This workspace is being prepared.
          </p>
          <button
            type="button"
            onClick={logout}
            className="mt-5 flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}