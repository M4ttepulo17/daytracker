# DayTracker

App personale per il tracking giornaliero delle abitudini: descrizione della
giornata, sonno, lettura, Instagram, preghiera, allenamento, musica, studio,
progetti economici e voto giornaliero. Include cronologia, statistiche
avanzate, streak e backup/ripristino dati.

## Stack tecnologico

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Autenticazione**: NextAuth (Credentials provider, password hashate con bcrypt, sessioni JWT)
- **Grafici**: Recharts
- **Icone**: lucide-react

## Struttura del progetto

```
daytracker/
├── prisma/
│   ├── schema.prisma        # Modello dati (User, Settings, Sport, Day)
│   └── seed.ts               # Crea l'utente iniziale e gli sport di default
├── src/
│   ├── app/
│   │   ├── (app)/             # Gruppo route protette (richiede login)
│   │   │   ├── layout.tsx     # Auth guard + bottom navigation
│   │   │   ├── dashboard/      # Schermata "Oggi"
│   │   │   ├── history/        # Cronologia / modifica giorni passati
│   │   │   ├── stats/          # Statistiche e grafici
│   │   │   └── settings/       # Obiettivi, sport, tema, backup
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/  # NextAuth handler
│   │   │   ├── days/                 # CRUD giornate
│   │   │   ├── sports/               # CRUD sport personalizzati
│   │   │   ├── settings/             # Obiettivi utente
│   │   │   ├── stats/                # Statistiche aggregate + streak
│   │   │   ├── export/               # Export JSON/CSV
│   │   │   └── import/               # Import/ripristino JSON
│   │   ├── login/             # Pagina di login
│   │   ├── layout.tsx         # Root layout (provider auth + tema)
│   │   ├── page.tsx           # Redirect a /dashboard o /login
│   │   └── globals.css
│   ├── components/            # Componenti UI riutilizzabili
│   ├── lib/                    # Prisma client, auth config, validazione (Zod)
│   ├── types/                  # Tipi condivisi
│   └── middleware.ts           # Protezione route autenticate
├── .env.example
└── package.json
```

## Modello dati (Prisma)

- **User**: email + password hashata (bcrypt)
- **Settings**: obiettivi personalizzabili (sonno, pagine, studio, Instagram,
  numero minimo di parole) e tema
- **Sport**: lista sport personalizzabile (soft-delete con `archived` per non
  perdere lo storico)
- **Day**: record giornaliero unico per `(userId, date)`, con tutti i campi
  del tracker. Ogni record ha `createdAt`/`updatedAt` per audit storico.

I dati sono persistenti su PostgreSQL: aggiornare il codice o ridistribuire
l'app **non** comporta perdita di dati, poiché il database è esterno
all'applicazione.

## Setup locale

1. **Installa le dipendenze**

   ```bash
   npm install
   ```

2. **Configura le variabili d'ambiente**

   ```bash
   cp .env.example .env
   ```

   Compila `DATABASE_URL` con una connessione PostgreSQL (Docker, Railway,
   Render, Neon, Supabase). Genera `NEXTAUTH_SECRET` con:

   ```bash
   openssl rand -base64 32
   ```

3. **Applica lo schema al database**

   ```bash
   npx prisma migrate dev --name init
   ```

4. **Crea il tuo utente** (imposta `SEED_EMAIL` e `SEED_PASSWORD` nel `.env`)

   ```bash
   npm run seed
   ```

5. **Avvia in sviluppo**

   ```bash
   npm run dev
   ```

   Apri http://localhost:3000 e accedi con le credenziali del seed.

## Sicurezza

- Password hashate con bcrypt (12 round)
- Sessioni gestite tramite JWT firmati con `NEXTAUTH_SECRET`, nessun dato
  sensibile esposto al client
- Tutte le API verificano la sessione server-side (`getServerSession`) prima
  di leggere/scrivere dati
- `middleware.ts` blocca l'accesso a tutte le pagine e API protette per utenti
  non autenticati
- Nessuna funzionalità multiutente: ogni `User` vede solo i propri dati
  (filtrati per `userId` in ogni query)

## Deployment

### Opzione consigliata: Vercel + Neon/Supabase/Railway (Postgres)

1. Crea un database PostgreSQL gestito (Neon, Supabase, Railway) e copia la
   connection string.
2. Crea un nuovo progetto su Vercel collegando il repository.
3. Imposta le variabili d'ambiente su Vercel:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (es. `https://tuoapp.vercel.app`)
4. Esegui `npx prisma migrate deploy` (puntando a `DATABASE_URL` di
   produzione) e poi `npm run seed` una sola volta per creare l'utente.
5. Accedi a `/dashboard` con le credenziali del seed.

### Opzione alternativa: Railway / Render (full stack)

1. Crea un servizio PostgreSQL.
2. Crea un servizio Web dal repository: build command `npm run build`, start
   command `npm run start`.
3. Configura le stesse variabili d'ambiente (`DATABASE_URL` userà il database
   interno fornito dalla piattaforma).
4. Esegui `npx prisma migrate deploy` e `npm run seed` come job una tantum.

## Aggiornamenti futuri

Per modificare lo schema del database senza perdere dati:

```bash
npx prisma migrate dev --name nome_modifica   # in locale
npx prisma migrate deploy                      # in produzione
```

Le migrazioni Prisma sono incrementali e preservano i dati esistenti.

## Backup

Dalla schermata **Impostazioni**:

- Esporta tutti i dati in **JSON** (completo, usabile per ripristino) o
  **CSV** (per analisi esterne)
- Importa un backup JSON: i giorni esistenti vengono aggiornati, quelli
  mancanti vengono aggiunti, senza eliminare dati

Si consiglia di esportare periodicamente un backup JSON come ulteriore
sicurezza, oltre alla persistenza del database.

## Funzionalità principali

- **Dashboard giornaliera**: compila la giornata corrente con validazione
  (numero minimo di parole configurabile, voto obbligatorio)
- **Cronologia**: vedi e modifica qualsiasi giorno passato, raggruppato per
  mese
- **Statistiche**: medie settimanali/mensili, percentuali di abitudini
  completate, grafici di trend a 30 giorni, statistiche per sport, record
  personali
- **Streak**: giorni consecutivi di compilazione (attuale e record)
- **Impostazioni**: obiettivi personalizzabili, gestione sport personalizzati,
  tema chiaro/scuro/sistema, backup e ripristino
