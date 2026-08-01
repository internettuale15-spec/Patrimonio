# Family Wealth Manager

Gestionale del patrimonio familiare condiviso tra Mirco e Debora — non un semplice
tracker di spese, ma un vero software di gestione finanze personali.

## Stack
React + Vite + TypeScript + TailwindCSS + shadcn/ui + Recharts + React Router +
Zustand + Supabase (DB, Auth, Realtime).

## Setup

```bash
npm install
cp .env.example .env   # inserisci URL e anon key del tuo progetto Supabase
```

Nel dashboard Supabase, apri l'SQL editor e incolla il contenuto di
`supabase/schema.sql` per creare tutte le tabelle, i trigger e le policy RLS.

Poi:

```bash
npm run dev
```

## Cosa contiene questa Fase 1 (fondamenta)

- **Schema database completo** (`supabase/schema.sql`): households, profiles,
  categories, recurrences, incomes, expenses, home_expenses (con trigger che le
  duplica automaticamente in expenses), investments + snapshots + cashflows,
  assets/liabilities, net_worth_snapshots, goals, budgets, deadlines. RLS basata
  su `household_id` così Mirco e Debora vedono/scrivono sempre gli stessi dati.
- **Scaffold progetto**: struttura cartelle (`components/pages/layouts/hooks/
  services/store/types/utils/lib/supabase`), routing con React Router, layout
  responsive (sidebar desktop + bottom nav mobile), tema chiaro/scuro via CSS
  variables + classe `.dark`.
- **Store Zustand**: `authStore` (sessione/household) e `financeStore` (fetch
  di tutte le tabelle + sottoscrizione realtime Supabase per la sync tra i due
  utenti).
- **Dashboard funzionante** con tutti i widget richiesti (patrimonio, liquidità,
  investimenti, entrate/spese/risparmio mese e anno, budget utilizzato, obiettivi
  raggiunti, ultimi movimenti) e i due grafici (andamento patrimonio, andamento
  risparmio) via Recharts. I dati sono placeholder — il collegamento reale ai
  dati Supabase è la Fase 2.
- **Pagine placeholder** per tutte le altre sezioni (Entrate, Spese, Casa,
  Investimenti, Patrimonio, Obiettivi, Budget, Calendario, Report, Previsioni),
  già collegate al router e alla navigazione.

## Fase 2 — Entrate & Spese (completata)

- **Seed categorie** (`supabase/seed_categories.sql`): tutte le categorie della
  spec (entrate, spese fisse, spese variabili, casa). Esegui sostituendo
  `:household_id` con l'UUID del tuo household.
- **Storage bucket**: crea su Supabase uno storage bucket pubblico chiamato
  `attachments` (Dashboard → Storage → New bucket) per gli allegati scontrino/fattura.
- **`TransactionForm`** (generico, riusabile per entrate e spese): categoria,
  importo, data, descrizione, ricorrenza (una tantum/mensile/annuale con giorno
  del mese), allegato facoltativo per le spese. Se la ricorrenza non è "una
  tantum", crea prima la riga in `recurrences` poi la prima occorrenza.
- **`CategoryBreakdownCharts`**: tre viste (torta/barre/andamento) via tab.
  Cliccando una fetta o una barra si apre un pannello con importo, percentuale
  sul totale e confronto col mese precedente.
- **`useMonthlyBreakdown`**: hook che aggrega entrate/spese per categoria
  (mese corrente vs precedente) e calcola la serie storica degli ultimi 6 mesi;
  supporta un filtro per kind categoria (usato per separare Fisse/Variabili).
- **Pagina Entrate**: stat cards (mese/mese precedente/anno), grafici, lista
  movimenti, modale di inserimento.
- **Pagina Spese**: tab Fisse/Variabili, ciascuna con le stesse componenti.
- Nota: la generazione automatica delle occorrenze successive di una
  ricorrenza (es. lo stipendio del mese dopo) va fatta lato server con una
  Supabase Edge Function schedulata (cron giornaliero) che legge le
  `recurrences` con `next_run_date <= oggi` — non ancora implementata in
  questa fase, è nella roadmap "Automazioni".

## Fase 3 — Casa & Investimenti (completata)

- **Pagina Casa**: `CasaForm` inserisce in `home_expenses` (il trigger DB già
  presente duplica automaticamente la riga in `expenses`, categoria "Casa" —
  nessun doppio inserimento). Stessi grafici interattivi e lista movimenti
  delle altre sezioni, riusando `useMonthlyBreakdown` (ora esteso per
  supportare anche `home_expenses`) e `CategoryBreakdownCharts`.
- **Pagina Investimenti**: CRUD investimenti (`InvestmentForm`), calcolo
  automatico di valore/gain/loss (`useInvestments`), grafico di allocazione
  per tipo con drill-down al click (`AllocationChart`), lista portafoglio con
  gain/loss colorato. L'evoluzione storica richiede popolare
  `investment_snapshots` (nota lasciata in pagina, va nella roadmap Automazioni).

## Fase 4 — Patrimonio (completata)

- **`usePatrimonio`**: aggrega assets + liabilities + valore investimenti
  (riusa `useInvestments`) per calcolare Totale Attività, Totale Passività e
  Patrimonio Netto in automatico. La liquidità è la somma di conti correnti + contanti.
- **Storico reale**: bottone "Salva snapshot oggi" scrive in
  `net_worth_snapshots` (upsert su household+data, così ripremendo lo stesso
  giorno aggiorna invece di duplicare). Il grafico storico legge da questa
  tabella — non è più un placeholder come nella Dashboard iniziale. In
  produzione conviene automatizzarlo con una Edge Function schedulata.
- **Tab Attività/Passività**: form dedicati (`AssetForm`, `LiabilityForm`) e
  liste. Gli investimenti (ETF/azioni/ecc.) non vanno duplicati qui: il loro
  valore confluisce automaticamente nel totale attività dalla sezione Investimenti.

## Fase 5 — Obiettivi & Budget (completata)

- **Obiettivi**: `useGoals` calcola la percentuale di completamento; `GoalCard`
  mostra barra di avanzamento, importo attuale/target, data prevista e un
  form inline per registrare un versamento (aggiorna sia `goal_contributions`
  che `current_amount` sul goal).
- **Budget**: `useBudgets` unisce i budget impostati (tabella `budgets`) con
  la spesa reale del mese (query su `expenses` filtrata per categoria/mese),
  calcolando speso/residuo/percentuale. `BudgetBar` mostra il colore
  verde/giallo/rosso richiesto in base alla soglia di utilizzo. Il form usa
  upsert su `household_id, category_id, month, year` così reimpostare lo
  stesso mese aggiorna invece di duplicare.

## Fase 6 — Calendario (completata)

- **`useDeadlines`**: calcola giorni residui e uno stato (scaduta/urgente/
  prossima/futura) in base a `notify_days_before`. Le scadute e le prossime
  sono separate in due sezioni, con badge colorato "notifica" quando si entra
  nella finestra configurata.
- **`DeadlineForm`**: titolo, categoria (Mutuo/Bolletta/Assicurazione/PAC/
  Abbonamento/Altro), importo facoltativo, data, giorni di preavviso notifica.
- **`DeadlineList`**: checkbox per segnare come pagata (aggiorna `is_paid`),
  badge di stato, importo.
- Nota: queste sono notifiche *in-app* (badge visivo); vere notifiche push
  del sistema operativo richiedono un service worker/PWA — nella roadmap
  funzionalità future.

## Fase 7 — Report & Previsioni (completata)

- **Report**: selettore anno, entrate/spese/risparmio annuali, media mensile
  e giornaliera, confronto percentuale con l'anno precedente, grafico a barre
  entrate vs spese per mese, tabella spese per categoria (`useAnnualReport`).
- **Previsioni**: proiezione a fine anno di entrate, spese, risparmio e
  patrimonio netto, calcolata come dati già registrati + (media mensile ×
  mesi rimanenti) — `usePrevisioni`, che combina `useAnnualReport` e
  `usePatrimonio`. Nota esplicita in pagina sui limiti del metodo (non
  considera eventi straordinari futuri).

**Tutte le sezioni previste dalla spec originale hanno ora una pagina
funzionante** (Dashboard, Entrate, Spese, Casa, Investimenti, Patrimonio,
Obiettivi, Budget, Calendario, Report, Previsioni).

## Fase 8 — Auth reale (completata)

- **`Login`**: tab Accedi/Registrati. La registrazione chiede nome, email,
  password e un "codice famiglia" facoltativo (l'`household_id`): lasciato
  vuoto crea un nuovo household, altrimenti l'utente si unisce a quello
  esistente — così Mirco crea il nucleo e Debora si unisce con il codice che
  Mirco le condivide da Impostazioni.
- **`Onboarding`**: se Supabase richiede la conferma email, dopo il click sul
  link di conferma l'utente ha una sessione ma non ancora un profilo — questa
  pagina completa la creazione del profilo/household al primo accesso.
- **`Impostazioni`**: mostra il nome utente, il codice famiglia da copiare e
  condividere, pulsante di logout.
- **`authStore`** ora gestisce l'intero ciclo di vita auth: `init()` ascolta
  `supabase.auth.onAuthStateChange`, così login/logout si riflettono subito
  in tutta l'app; `App.tsx` instrada automaticamente tra Login → Onboarding →
  App principale in base allo stato.
- **Policy RLS aggiuntive** in `schema.sql`: un utente può creare/aggiornare
  solo il proprio profilo (`profiles_insert_own`, `profiles_update_own`),
  necessario per il flusso di signup lato client.
- Nota: per velocizzare i test in sviluppo, in Supabase Dashboard →
  Authentication → Providers → Email puoi disattivare "Confirm email" così
  la sessione è disponibile subito dopo la registrazione (salta l'Onboarding).

**Il progetto è ora navigabile end-to-end con autenticazione reale.**

## Fase 9 — Automazioni (completata)

Due Supabase Edge Functions in `supabase/functions/`:

- **`generate-recurrences`**: per ogni `recurrence` attiva con `next_run_date`
  già passata, trova l'ultima riga incomes/expenses generata da quella
  ricorrenza (la usa come template), inserisce la nuova occorrenza e avanza
  `next_run_date` (o disattiva la ricorrenza se ha superato `end_date`).
- **`daily-snapshot`**: per ogni household calcola attività, passività,
  liquidità, valore investimenti e patrimonio netto, e fa upsert in
  `net_worth_snapshots` per la data odierna — sostituisce il bottone manuale
  "Salva snapshot oggi" con un job automatico.

### Deploy delle Edge Functions

```bash
npm install -g supabase
supabase login
supabase link --project-ref <il-tuo-project-ref>

supabase functions deploy generate-recurrences
supabase functions deploy daily-snapshot
```

Le function usano la Service Role Key per bypassare la RLS (girano lato
server su tutti gli household, non nel contesto di un singolo utente).
Supabase la inietta già automaticamente come `SUPABASE_SERVICE_ROLE_KEY`
nell'ambiente delle Edge Functions — non serve configurarla a mano.

### Schedulazione giornaliera

Nel dashboard Supabase → **Database → Cron Jobs** (oppure via `pg_cron` +
`pg_net` in SQL editor), crea due job che chiamano le function ogni giorno,
ad esempio alle 06:00:

```sql
select cron.schedule(
  'generate-recurrences-daily',
  '0 6 * * *',
  $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/generate-recurrences',
    headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_KEY>')
  );
  $$
);

select cron.schedule(
  'daily-snapshot-daily',
  '5 6 * * *',
  $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/daily-snapshot',
    headers := jsonb_build_object('Authorization', 'Bearer <SERVICE_ROLE_KEY>')
  );
  $$
);
```

(Lo snapshot va programmato qualche minuto dopo le ricorrenze, così include
già le entrate/spese generate quello stesso giorno.)

### Non incluso in questa fase

- Aggiornamento automatico di `investment_snapshots`/`current_price` da
  un'API prezzi (Twelve Data, FMP...) — richiede una API key personale e va
  aggiunto come terza Edge Function quando vorrai collegarla.
- Notifiche push reali (le scadenze mostrano badge in-app, non notifiche di sistema).

---

## Stato finale del progetto

Tutte le sezioni della spec originale sono implementate e collegate a
Supabase con RLS, realtime, autenticazione reale e automazioni server-side:
Dashboard, Entrate, Spese, Casa, Investimenti, Patrimonio, Obiettivi, Budget,
Calendario, Report, Previsioni, Auth/Onboarding/Impostazioni.

### Prima di iniziare a usarlo con Debora

1. Crea il progetto Supabase, esegui `supabase/schema.sql` poi
   `supabase/seed_categories.sql` (sostituendo `:household_id` dopo aver
   creato il primo utente).
2. Crea lo storage bucket pubblico `attachments`.
3. `npm install`, configura `.env`, `npm run dev`.
4. Registrati come Mirco (crea il nucleo), copia il codice famiglia da
   Impostazioni, fallo registrare Debora incollandolo.
5. Deploy delle due Edge Functions e schedulazione cron come sopra.
6. (Facoltativo) deploy del frontend su Vercel/Netlify con le stesse
   variabili ambiente del `.env`.

### Roadmap funzionalità future (dalla spec originale)

- Import automatico estratti conto CSV
- Collegamento API bancarie (Open Banking)
- Scansione scontrini via OCR
- Modulo dedicato mutui/prestiti con piano ammortamento
- Simulatore pensione
- Simulatore investimenti (Monte Carlo / scenari)
- Calcolo FIRE (Financial Independence, Retire Early)
- Notifiche push reali (PWA)
- Widget smartphone (PWA)
- Esportazione Excel/PDF dei report
- Dashboard personalizzabili (drag & drop widget)
- Analisi AI delle spese con suggerimenti di risparmio
