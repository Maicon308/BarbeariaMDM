import { useEffect, useState } from "react";

import AppShell, { type NavKey } from "./components/AppShell";
import ThermalReceipt from "./components/ThermalReceipt";
import Dashboard from "./pages/Dashboard";
import CustomerPortal from "./pages/CustomerPortal";
import LoginPage from "./pages/LoginPage";
import OperationsPage from "./pages/OperationsPage";
import api from "./services/api";
import type { MeData, ReceiptData } from "./types";

const demoReceipt: ReceiptData = {
  barbearia: "Barbearia MDM",
  whatsapp: "(00) 00000-0000",
  cliente: "Cliente Exemplo",
  barbeiro: "Barbeiro Principal",
  data: new Date().toLocaleString("pt-BR"),
  servicos: [
    { nome: "Corte degrade", valor: 45 },
    { nome: "Barba completa", valor: 35 },
  ],
  pagamentos: [{ forma: "PIX", valor: 80 }],
  total: 80,
};

export default function App() {
  const [me, setMe] = useState<MeData | null>(null);
  const [active, setActive] = useState<NavKey>("dashboard");
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    setLoading(true);
    try {
      const { data } = await api.get<MeData>("/me/");
      setMe(data);
      setActive(data.is_cliente ? "cliente" : "dashboard");
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (localStorage.getItem("barbearia_mdm_access_token")) {
      void loadMe();
      return;
    }
    setLoading(false);
  }, []);

  function logout() {
    localStorage.removeItem("barbearia_mdm_access_token");
    localStorage.removeItem("barbearia_mdm_refresh_token");
    setMe(null);
  }

  if (loading) {
    return <div className="grid min-h-screen place-items-center bg-[#191512] text-white">Carregando...</div>;
  }

  if (!me) {
    return <LoginPage onLogin={loadMe} />;
  }

  return (
    <AppShell active={active} me={me} onLogout={logout} onNavigate={setActive}>
      {active === "dashboard" && <Dashboard />}
      {active === "barbearias" && <OperationsPage moduleKey="barbearias" />}
      {active === "clientes" && <OperationsPage moduleKey="clientes" />}
      {active === "agenda" && <OperationsPage moduleKey="agenda" />}
      {active === "servicos" && <OperationsPage moduleKey="servicos" />}
      {active === "cadeiras" && <OperationsPage moduleKey="cadeiras" />}
      {active === "pagamentos" && <OperationsPage moduleKey="pagamentos" />}
      {active === "cliente" && <CustomerPortal />}
      {active === "cupom" && (
        <div className="mx-auto max-w-xl rounded-lg border border-zinc-200 bg-white p-4">
          <h1 className="mb-4 text-2xl font-black text-[#191512]">Cupom termico</h1>
          <ThermalReceipt receipt={demoReceipt} />
        </div>
      )}
    </AppShell>
  );
}
