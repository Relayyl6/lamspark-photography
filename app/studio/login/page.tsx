"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, ShieldAlert, UserCheck } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/studio";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      router.push(from);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Authentication error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md bg-warm-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl relative z-10">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gold/20 text-gold mb-4 border border-gold/30">
          <Lock className="w-5 h-5" />
        </div>
        <p className="text-gold tracking-[0.25em] text-xs uppercase font-medium">LamSparks Studio Ops</p>
        <h1 className="font-editorial text-3xl font-light text-cream mt-1">Staff Access</h1>
        <p className="text-muted text-xs mt-2">
          Restricted portal for studio staff only. Client sessions do not require login.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-900/30 border border-red-500/40 text-red-200 text-xs flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted mb-1.5 font-medium">
            Staff Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@lamsparks.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-cream placeholder:text-muted/60 text-sm focus:outline-none focus:border-gold transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wider text-muted mb-1.5 font-medium">
            Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/15 text-cream placeholder:text-muted/60 text-sm focus:outline-none focus:border-gold transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 rounded-xl bg-gold text-deep font-medium text-sm tracking-wide hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-deep border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <UserCheck className="w-4 h-4" />
              <span>Sign In to Studio</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-white/10 text-center">
        <p className="text-[11px] text-muted leading-relaxed">
          Authorized personnel: Credentials are provisioned via the secure environment configuration. Role-based permissions (Owner, Full, Limited) are strictly enforced upon sign-in.
        </p>
      </div>
    </div>
  );
}

export default function StudioLoginPage() {
  return (
    <div className="min-h-screen bg-deep text-cream flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Editorial backdrop circles */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

      <Suspense fallback={<div className="text-gold text-xs">Loading studio portal...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
