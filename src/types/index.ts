export interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  perfil: 'admin' | 'membro';
  id_familia: number | null;
  familia: { id_familia: number; nome: string; codigo_convite?: string } | null;
}

export interface Familia {
  id_familia: number;
  nome: string;
  codigo_convite: string;
  ativo: boolean;
  usuarios: MembroFamilia[];
}

export interface MembroFamilia {
  id_usuario: number;
  nome: string;
  email: string;
  perfil: 'admin' | 'membro';
  data_criacao: string;
}

export interface ConviteMembro {
  id_convite: number;
  id_familia: number;
  nome: string;
  parentesco: string;
  email: string;
  token_convite: string;
  status: 'pendente' | 'cadastrado' | 'cancelado';
  data_criacao: string;
}

export interface CategoriaEntrada {
  id_categoria_entrada: number;
  id_familia: number | null;
  nome: string;
  icone: string;
  cor: string;
  ativo: boolean;
}

export interface CategoriaSaida {
  id_categoria_saida: number;
  id_familia: number | null;
  nome: string;
  icone: string;
  cor: string;
  ativo: boolean;
}

export interface CategoriaInvestimento {
  id_categoria_investimento: number;
  id_familia: number | null;
  nome: string;
  icone: string;
  cor: string;
  ativo: boolean;
}

export interface Entrada {
  id_entrada: number;
  id_familia: number;
  id_usuario: number;
  id_categoria_entrada: number;
  descricao: string;
  valor: number;
  data_entrada: string;
  observacao?: string;
  data_criacao: string;
  categoria: CategoriaEntrada;
  usuario: { nome: string };
}

export interface Saida {
  id_saida: number;
  id_familia: number;
  id_usuario: number;
  id_categoria_saida: number;
  descricao: string;
  valor: number;
  data_saida: string;
  observacao?: string;
  data_criacao: string;
  categoria: CategoriaSaida;
  usuario: { nome: string };
}

export interface Investimento {
  id_investimento: number;
  id_familia: number;
  id_usuario: number;
  id_categoria_investimento: number;
  descricao: string;
  valor: number;
  data_investimento: string;
  tipo_rendimento?: string;
  indice_rendimento?: string;
  taxa_percentual?: number;
  prazo_meses?: number;
  observacao?: string;
  data_criacao: string;
  categoria: CategoriaInvestimento;
  usuario: { nome: string };
}

export interface ResumoMes {
  total_entradas: number;
  total_saidas: number;
  saldo_mes: number;
  saldo_acumulado: number;
}

export interface EvolucaoMensal {
  mes: number;
  mes_ano: string;
  entradas: number;
  saidas: number;
  saldo: number;
}

export interface CategoriaValor {
  categoria: string;
  cor: string;
  valor: number;
}

export interface Movimentacao {
  tipo: 'entrada' | 'saida';
  id: number;
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  cor_categoria: string;
  usuario: string;
}

export interface DashboardData {
  resumo_mes: ResumoMes;
  evolucao_mensal: EvolucaoMensal[];
  top_categorias_saida: CategoriaValor[];
  distribuicao_saidas_por_categoria: CategoriaValor[];
  entradas_por_categoria: CategoriaValor[];
  ultimas_movimentacoes: Movimentacao[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ItemImportacao {
  descricao: string;
  valor: number;
  quantidade?: number;
  categoria_sugerida?: string;
  id_categoria_sugerida?: number;
  cor_categoria?: string;
  data?: string;
  observacao?: string;
  id_categoria_saida?: number;
}

export interface ResultadoImportacao {
  id_importacao: number;
  itens: ItemImportacao[];
  total: number;
}

export type StatusSaudeFinanceira = 'ruim' | 'médio' | 'bom' | 'excelente';

export interface AcaoPrioritaria {
  titulo: string;
  descricao: string;
  impacto: 'alto' | 'médio' | 'baixo';
  prazo: 'imediato' | '30 dias' | '3 meses' | '6 meses';
}

export interface DiagnosticoIA {
  status: StatusSaudeFinanceira;
  score: number;
  resumo: string;
  pontos_positivos: string[];
  pontos_de_atencao: string[];
  acoes_prioritarias: AcaoPrioritaria[];
}

export interface MetricasSaudeFinanceira {
  renda_media_mensal: number;
  gastos_media_mensal: number;
  taxa_poupanca: number;
  comprometimento_renda: number;
  reserva_emergencia_meses: number;
  total_investido: number;
  qtd_investimentos: number;
  meses_analisados: number;
}

export interface SaudeFinanceiraData {
  metricas: MetricasSaudeFinanceira;
  historico_mensal: { mes_ano: string; entradas: number; saidas: number; saldo: number }[];
  top_categorias_gasto: CategoriaValor[];
  diagnostico: DiagnosticoIA;
}
