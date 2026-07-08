import {
  Armchair,
  Building2,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  Scissors,
  Store,
  UserRound,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

import type { MeData } from "../types";

export type NavKey =
  | "dashboard"
  | "barbearias"
  | "clientes"
  | "agenda"
  | "servicos"
  | "cadeiras"
  | "pagamentos"
  | "cupom"
  | "cliente";

const navItems: { key: NavKey; label: string; icon: ReactNode }[] = [
  { key: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
  { key: "barbearias", label: "Barbearias", icon: <Building2 size={18} /> },
  { key: "clientes", label: "Clientes", icon: <Users size={18} /> },
  { key: "agenda", label: "Reservas", icon: <CalendarDays size={18} /> },
  { key: "servicos", label: "Servicos", icon: <Scissors size={18} /> },
  { key: "cadeiras", label: "Cadeiras", icon: <Armchair size={18} /> },
  { key: "pagamentos", label: "Pagamentos", icon: <CreditCard size={18} /> },
  { key: "cupom", label: "Cupom termico", icon: <ReceiptText size={18} /> },
  { key: "cliente", label: "Area do cliente", icon: <UserRound size={18} /> },
];

export default function AppShell({
  active,
  me,
  children,
  onNavigate,
  onLogout,
}: {
  active: NavKey;
  me: MeData;
  children: ReactNode;
  onNavigate: (key: NavKey) => void;
  onLogout: () => void;
}) {
  const visibleNav = me.is_cliente ? navItems.filter((item) => item.key === "cliente") : navItems;

  return (
    <main className="min-h-screen bg-[#f7f2ea] text-zinc-950">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-[#2c211d] bg-[#191512] p-4 text-white lg:block">
        <div className="mb-6 flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#c8a45d] text-[#191512]">
            <Scissors size={21} />
          </div>
          <div>
            <p className="font-bold">BarbeariaMDM</p>
              <p className="text-xs text-white/60">{me.is_cliente ? "Reserva online" : "Gestao profissional"}</p>
          </div>
        </div>

        <nav className="space-y-1">
          {visibleNav.map((item) => (
            <button
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium transition ${
                active === item.key ? "bg-[#8b1e24] text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
              key={item.key}
              onClick={() => onNavigate(item.key)}
              type="button"
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 px-5 py-4 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Store className="text-[#8b1e24]" size={22} />
              <div>
                <p className="font-semibold">{me.barbearia?.nome ?? "SuperAdmin"}</p>
                <p className="text-xs text-zinc-500">
                  {me.is_cliente
                    ? "Area do cliente"
                    : `${me.usuario.papel}${me.barbearia?.matriz_nome ? ` - filial de ${me.barbearia.matriz_nome}` : ""}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!me.is_cliente && (
                <span className="rounded-full bg-[#f0dfbc] px-3 py-1 text-xs font-semibold text-[#5a3e18]">
                  Unidade #{me.barbearia?.id ?? "global"}
                </span>
              )}
              <button className="inline-flex items-center gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-50" onClick={onLogout}>
                <LogOut size={16} />
                Sair
              </button>
            </div>
          </div>
        </header>
        <div className="p-5">{children}</div>
      </section>
    </main>
  );
}

