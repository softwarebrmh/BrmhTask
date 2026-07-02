export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f7f5] px-4 py-10">
      {/* Ambient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(600px 300px at 50% -50px, rgba(15,23,42,0.06), transparent 70%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(15,23,42,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.035) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          maskImage: 'radial-gradient(ellipse 70% 50% at 50% 0%, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 50% at 50% 0%, black 30%, transparent 75%)',
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gray-950 text-base font-semibold text-white shadow-[0_4px_14px_rgba(15,23,42,0.25)]">
            BT
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-950">BHRM Teams</h1>
          <p className="mt-1 text-sm text-gray-500">Task-centric execution platform</p>
        </div>
        <div className="rounded-2xl border border-gray-200/80 bg-white p-8 shadow-[0_4px_24px_rgba(15,23,42,0.06)]">
          {children}
        </div>
      </div>
    </div>
  );
}
