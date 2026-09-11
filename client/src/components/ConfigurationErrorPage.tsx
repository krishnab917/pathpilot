type ConfigurationErrorPageProps = {
  missingVariables: string[];
};

export default function ConfigurationErrorPage({
  missingVariables,
}: ConfigurationErrorPageProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-slate-950">
      <section className="w-full max-w-xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-700">
          PathPilot configuration required
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          This deployment is not ready yet.
        </h1>
        <p className="mt-3 leading-6 text-slate-600">
          The browser configuration for Supabase is missing. Add these variables
          in the Vercel project settings, then redeploy this application.
        </p>
        <ul className="mt-5 space-y-2 border-l-2 border-blue-600 pl-4 font-mono text-sm text-slate-800">
          {missingVariables.map(variable => (
            <li key={variable}>{variable}</li>
          ))}
        </ul>
        <p className="mt-6 text-sm leading-6 text-slate-500">
          These are public, build-time variables. Do not put service-role, AI,
          or other server-only secrets in variables beginning with <code>VITE_</code>.
        </p>
      </section>
    </main>
  );
}
