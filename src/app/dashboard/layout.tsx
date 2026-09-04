import Link from "next/link";

const NAV = [
  { href: "/dashboard", label: "Visão geral" },
  { href: "/dashboard/leads", label: "Leads" },
  { href: "/dashboard/automations", label: "Automações" },
  { href: "/dashboard/settings", label: "Conexão Instagram" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-line bg-white px-5 py-8">
        <span className="font-display text-xl">FJJ-Connect</span>
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-sm px-3 py-2 text-sm text-ink/70 transition hover:bg-signalSoft hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 px-10 py-8">{children}</main>
    </div>
  );
}
