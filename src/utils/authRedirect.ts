import type { LocationQueryValue } from 'vue-router'

// Extrai um valor de query string único e seguro (nunca redireciona para fora do app).
function firstQueryValue(v: LocationQueryValue | LocationQueryValue[] | undefined): string {
  const raw = Array.isArray(v) ? v[0] : v
  return raw ? raw.trim() : ''
}

export function getRedirectTarget(query: Record<string, LocationQueryValue | LocationQueryValue[]>): string {
  const redirect = firstQueryValue(query.redirect)
  // Só aceita caminhos internos (começam com "/" e não com "//", que o navegador trata como outro host)
  if (redirect.startsWith('/') && !redirect.startsWith('//')) return redirect
  return '/'
}

export function getInviteToken(query: Record<string, LocationQueryValue | LocationQueryValue[]>): string {
  return firstQueryValue(query.invite)
}

// Lê um token do FRAGMENTO da URL (#token=...), não da querystring: o back-end usa fragmento
// nos e-mails de redefinição de senha e convite para o token nunca vazar em logs de servidor/Referer.
export function getHashToken(): string {
  const match = window.location.hash.match(/token=([^&]*)/)
  return match ? decodeURIComponent(match[1]) : ''
}
