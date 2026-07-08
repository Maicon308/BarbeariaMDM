export type DashboardData = {
  data: string;
  faturamento_hoje: string | number;
  agendados_hoje: number;
  concluidos_hoje: number;
  cancelados_hoje: number;
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

