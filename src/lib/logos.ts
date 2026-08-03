/**
 * Risoluzione loghi per banche, broker, ETF/azioni e crypto.
 *
 * Nessuna API key richiesta:
 *  - Banche/broker: Clearbit Logo API (https://logo.clearbit.com/<dominio>),
 *    risalendo al dominio tramite un dizionario di keyword note.
 *  - ETF/azioni: endpoint immagini pubblico di Financial Modeling Prep,
 *    che espone il logo per ticker senza autenticazione.
 *  - Crypto: set di icone open-source (spothq/cryptocurrency-icons) via CDN.
 *
 * Tutti gli URL possono restituire 404 (nome non mappato, ticker non
 * riconosciuto): il componente <AssetLogo> gestisce il fallback su iniziali.
 */

// Keyword (minuscole) -> dominio, usate come "contiene" sul nome libero
// inserito dall'utente (es. "Conto Corrente Intesa Sanpaolo" -> intesa).
const INSTITUTION_DOMAINS: Record<string, string> = {
  "intesa": "intesasanpaolo.com",
  "unicredit": "unicredit.it",
  "bancoposta": "poste.it",
  "poste italiane": "poste.it",
  "fineco": "finecobank.com",
  "widiba": "widiba.it",
  "ing": "ing.it",
  "n26": "n26.com",
  "revolut": "revolut.com",
  "hype": "hype.it",
  "illimity": "illimity.com",
  "bper": "bper.it",
  "mps": "mps.it",
  "monte dei paschi": "mps.it",
  "banco bpm": "bancobpm.it",
  "credit agricole": "credit-agricole.it",
  "crédit agricole": "credit-agricole.it",
  "deutsche bank": "deutsche-bank.it",
  "che banca": "chebanca.it",
  "chebanca": "chebanca.it",
  "banca sella": "sella.it",
  "webank": "webank.it",
  "directa": "directa.it",
  "degiro": "degiro.it",
  "trade republic": "traderepublic.com",
  "traderepublic": "traderepublic.com",
  "scalable capital": "scalable.capital",
  "scalable": "scalable.capital",
  "binance": "binance.com",
  "coinbase": "coinbase.com",
  "kraken": "kraken.com",
  "etoro": "etoro.com",
  "interactive brokers": "interactivebrokers.com",
  "ibkr": "interactivebrokers.com",
  "moneyfarm": "moneyfarm.com",
  "banca sistema": "bancasistema.it",
  "banca mediolanum": "bancamediolanum.it",
  "mediolanum": "bancamediolanum.it",
  "cassa depositi": "cdp.it",
  "cariparma": "cariparma.it",
};

/** Cerca la prima keyword nota contenuta nel nome libero (banca/broker). */
function resolveInstitutionDomain(freeText: string | null | undefined): string | null {
  if (!freeText) return null;
  const lower = freeText.toLowerCase();
  for (const [keyword, domain] of Object.entries(INSTITUTION_DOMAINS)) {
    if (lower.includes(keyword)) return domain;
  }
  return null;
}

/** Logo di una banca/conto/broker a partire da un nome libero. */
export function getInstitutionLogoUrl(freeText: string | null | undefined, size = 64): string | null {
  const domain = resolveInstitutionDomain(freeText);
  if (!domain) return null;
  return `https://logo.clearbit.com/${domain}?size=${size}`;
}

// Ticker crypto comuni -> file icona (spothq/cryptocurrency-icons, colore).
const CRYPTO_ICON_TICKERS = new Set([
  "btc", "eth", "sol", "ada", "xrp", "doge", "dot", "matic", "link", "ltc",
  "bnb", "usdt", "usdc", "avax", "atom", "trx", "xlm", "algo", "near",
]);

/** Logo per un ticker crypto, se riconosciuto tra i più comuni. */
function getCryptoLogoUrl(ticker: string): string | null {
  const t = ticker.trim().toLowerCase();
  if (!CRYPTO_ICON_TICKERS.has(t)) return null;
  return `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${t}.png`;
}

/** Logo per un ticker ETF/azione tramite l'endpoint immagini pubblico FMP. */
function getSecurityLogoUrl(ticker: string): string {
  return `https://images.financialmodelingprep.com/symbol/${ticker.trim().toUpperCase()}.png`;
}

/**
 * Risolve il miglior URL logo disponibile per un investimento, in base al
 * tipo. Ritorna null se non c'è un ticker/nome da cui partire (il chiamante
 * mostrerà il fallback a iniziali).
 */
export function getInvestmentLogoUrl(params: {
  type: string;
  ticker?: string | null;
  broker?: string | null;
  name?: string | null;
}): string | null {
  const { type, ticker, broker, name } = params;

  if (type === "crypto" && ticker) {
    const cryptoLogo = getCryptoLogoUrl(ticker);
    if (cryptoLogo) return cryptoLogo;
  }

  if ((type === "etf" || type === "pac" || type === "azione") && ticker) {
    return getSecurityLogoUrl(ticker);
  }

  // conto_deposito, fondo_pensione, liquidita: preferiamo il logo dell'istituto
  return getInstitutionLogoUrl(broker || name);
}
