import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f6fb] px-4 py-8 text-slate-900 sm:px-6">
      <section className="grid w-full max-w-4xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-900/[0.06] md:grid-cols-[0.9fr_1.1fr]">
        <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0b1020] p-8 text-white md:flex lg:p-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-indigo-500 text-lg font-bold">P</span>
              <span><span className="block text-sm font-bold">ProofFlow</span><span className="mt-0.5 block text-xs text-slate-400">Verified work intelligence</span></span>
            </div>
            <p className="mt-14 text-xs font-bold uppercase tracking-wider text-indigo-300">Work, with proof</p>
            <h1 className="mt-3 max-w-sm text-3xl font-bold leading-tight tracking-tight">Don&apos;t just claim your work. Prove it.</h1>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">Connect project tasks to evidence, GitHub activity and AI review in one clear record.</p>
          </div>
          <ol className="mt-12 space-y-3 border-l border-slate-700 pl-4">
            <li className="text-sm font-medium text-slate-200"><span className="text-indigo-300">01</span><span className="ml-3">Claim work</span></li>
            <li className="text-sm font-medium text-slate-200"><span className="text-indigo-300">02</span><span className="ml-3">Attach evidence</span></li>
            <li className="text-sm font-medium text-slate-200"><span className="text-indigo-300">03</span><span className="ml-3">Verify progress</span></li>
          </ol>
          <p className="mt-10 text-xs text-slate-500">ProofFlow project workspace</p>
        </div>

        <div className="p-6 sm:p-9 lg:p-10">
          <div className="mb-7 md:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-indigo-600 text-lg font-bold text-white">P</div>
            <h1 className="mt-3 text-xl font-bold tracking-tight text-slate-950">ProofFlow</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">Don&apos;t just claim your work. Prove it.</p>
          </div>
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600">
              <ShieldCheck size={17} />
              Secure workspace access
            </div>
            <h2 className="mt-3 text-xl font-bold text-slate-950">
              Sign in to your account
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Continue to your verified project workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Email
              </label>
              <div className="relative">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-md border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Password
              </label>
              <div className="relative">
                <LockKeyhole size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-md border border-slate-300 bg-white py-3 pl-10 pr-12 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}