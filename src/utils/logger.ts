/**
 * Logging estruturado do frontend — sem SaaS por enquanto.
 *
 * O backend já gera um `X-Request-ID` em toda resposta (internal/middleware/logging.go)
 * e já loga isso via slog. Cada erro capturado aqui tenta incluir esse mesmo request_id,
 * para dar pra achar a linha exata no log do backend a partir do que o usuário reportar.
 *
 * Sem envio pra servidor: fica no console (estruturado, filtrável no DevTools) e num
 * buffer curto em localStorage, para poder pedir pro usuário exportar em caso de bug.
 * Quando decidirem um backend de observabilidade (Sentry, GlitchTip etc.), é só trocar
 * o corpo de `logError` para também enviar pra lá — o resto do app não muda.
 */

export interface LogEntry {
  timestamp: string;
  scope: string;
  message: string;
  requestId?: string;
  route?: string;
  stack?: string;
  extra?: Record<string, unknown>;
}

const STORAGE_KEY = 'finager_error_log';
const MAX_ENTRIES = 30;

function readBuffer(): LogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function appendToBuffer(entry: LogEntry) {
  try {
    const buffer = readBuffer();
    buffer.push(entry);
    while (buffer.length > MAX_ENTRIES) buffer.shift();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buffer));
  } catch {
    // localStorage indisponível (modo privado, cota cheia): não é crítico, só não persiste
  }
}

/**
 * Registra um erro de forma estruturada.
 * `scope` identifica de onde veio ('api', 'vue', 'window', 'unhandledrejection', ou o nome
 * de uma ação específica como 'transactions.updateTags') para facilitar filtrar no console.
 */
export function logError(scope: string, error: unknown, extra?: Record<string, unknown>) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    scope,
    message: error instanceof Error ? error.message : String(error),
    requestId: extra?.requestId as string | undefined,
    route: typeof window !== 'undefined' ? window.location.pathname : undefined,
    stack: error instanceof Error ? error.stack : undefined,
    extra,
  };

  console.error(`[${scope}]`, entry.message, entry);
  appendToBuffer(entry);
}

/** Últimos erros registrados nesta sessão (e sessões anteriores no mesmo navegador). */
export function getRecentErrors(): LogEntry[] {
  return readBuffer();
}

/** Instala os capturadores globais (erros não tratados fora do Vue e promises rejeitadas). */
export function installGlobalErrorLogging() {
  window.addEventListener('error', (event) => {
    logError('window', event.error ?? event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    logError('unhandledrejection', event.reason);
  });
}
