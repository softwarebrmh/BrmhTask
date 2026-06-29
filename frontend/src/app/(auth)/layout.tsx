export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f7f5] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-gray-950 text-white font-semibold text-base shadow-sm">
            BT
          </div>
          <h1 className="text-2xl font-semibold text-gray-950">BHRM Teams</h1>
          <p className="mt-1 text-sm text-gray-500">Task-centric execution platform</p>
        </div>
        <div className="surface p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
