export type DashboardData = {
  data: string;
  faturamento_hoje: string | number;
  agendados_hoje: number;
  concluidos_hoje: number;
  cancelados_hoje: number;
};

export type UserData = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  papel: "SUPERADMIN" | "DONO" | "GERENTE" | "BARBEIRO" | "ATENDENTE" | "CLIENTE";
  whatsapp: string;
  barbearia: number | null;
  senha_visivel_admin?: string;
  nome_completo?: string;
};

export type BarbeariaData = {
  id: number;
  nome: string;
  documento: string;
  whatsapp: string;
  endereco: string;
  plano: number;
  plano_nome?: string;
  matriz: number | null;
  matriz_nome?: string;
  ativa: boolean;
};

export type PlanoData = {
  id: number;
  nome: string;
  tipo: "BASICO" | "PRO" | "VIP";
  preco_mensal: string | number;
  limite_barbeiros: number | null;
  limite_clientes: number | null;
  permite_filiais: boolean;
  ativo: boolean;
};

export type ClienteData = {
  id: number;
  nome: string;
  whatsapp: string;
  email: string;
  barbearia: number;
  total_gasto?: string | number;
};

export type ServicoData = {
  id: number;
  nome: string;
  valor: string | number;
  duracao_minutos: number;
  barbearia: number;
  ativo: boolean;
};

export type CadeiraData = {
  id: number;
  identificador: string;
  barbearia: number;
  ativa: boolean;
};

export type MeData = {
  usuario: UserData;
  barbearia: BarbeariaData | null;
  filiais: BarbeariaData[];
  is_cliente: boolean;
  is_superadmin: boolean;
};

export type ReceiptService = {
  nome: string;
  valor: number;
};

export type ReceiptPayment = {
  forma: string;
  valor: number;
};

export type ReceiptData = {
  barbearia: string;
  whatsapp: string;
  cliente: string;
  barbeiro: string;
  data: string;
  servicos: ReceiptService[];
  pagamentos: ReceiptPayment[];
  total: number;
};
