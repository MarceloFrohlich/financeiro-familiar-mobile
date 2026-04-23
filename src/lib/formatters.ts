export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatarData(data: string | Date): string {
  if (data instanceof Date) return data.toLocaleDateString('pt-BR');
  const d = data.includes('T') ? new Date(data) : new Date(data + 'T12:00:00');
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
}

export function formatarDataInput(data: string | Date): string {
  const d = typeof data === 'string' ? new Date(data + 'T00:00:00') : data;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dataAtualInput(): string {
  return formatarDataInput(new Date());
}

export function nomeMes(mes: number, ano: number): string {
  return new Date(ano, mes - 1, 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
}

export function mesAtualLabel(): string {
  const now = new Date();
  return now.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
}

export function aplicarMascaraMoeda(valor: string): string {
  const digits = valor.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function parsearMoeda(valor: string): number {
  return parseFloat(valor.replace(/\./g, '').replace(',', '.')) || 0;
}

export function valorParaMascara(valor: number): string {
  if (!valor) return '';
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
