// src/utils/mascaras.js
export function mascararCpf(valor) {
  const n = String(valor ?? '').replace(/\D/g, '');
  if (n.length !== 11) return '-';
  return `${n.slice(0, 3)}.•••.•••-${n.slice(9)}`;
}

export function mascararCnh(valor, visiveisFim = 3) {
  const limpo = String(valor ?? '').trim();
  if (!limpo || limpo === 'Não informada') return 'Não informada';
  if (limpo.includes('•')) return limpo;
  if (limpo.length <= visiveisFim) return '•'.repeat(limpo.length);
  return '•'.repeat(limpo.length - visiveisFim) + limpo.slice(-visiveisFim);
}