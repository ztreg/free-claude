# Aktiebevakare

Följ aktier och spara automatiskt end-of-day-data (öppning, högsta, lägsta, slut, volym)
i en egen SQLite-databas (`stocks.db`). Yahoo Finance är primär källa, Stooq används som
fallback om Yahoo strular.

## Installation (en gång)

Kräver Python 3.9+.

```bash
cd stocktracker
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Användning

```bash
# Börja följa aktier (Stockholmsaktier har suffixet .ST)
python tracker.py add ERIC-B.ST VOLV-B.ST INVE-B.ST

# Visa vad du följer + senaste sparade kurs
python tracker.py list

# Hämta EOD-data för alla bevakade aktier
python tracker.py update

# Första gången kan du fylla på historik bakåt (t.ex. 90 dagar)
python tracker.py update --backfill 90

# Titta på sparad data för en aktie
python tracker.py show ERIC-B.ST --days 30

# Sluta följa
python tracker.py remove VOLV-B.ST

# Exportera allt till CSV (t.ex. för Excel)
python tracker.py export prices.csv
```

`update` är idempotent: den hämtar bara dagar som saknas, så du kan köra den hur ofta
du vill utan dubbletter. Kör du på en helg/röd dag säger den bara "aktuell".

### Ticker-format
- Stockholm: `ERIC-B.ST`, `VOLV-B.ST`, `INVE-B.ST`
- Index: `^OMX`, `^OMXS30`
- Hitta rätt ticker på finance.yahoo.com genom att söka på bolaget.

## Automatisk körning varje kväll

Börsen i Stockholm stänger 17:30. Kör t.ex. 18:30 så all data hunnit uppdateras.

### macOS / Linux (cron)
```bash
crontab -e
```
Lägg till (byt ut sökvägen till din mapp):
```
30 18 * * 1-5  cd /full/sokvag/stocktracker && ./venv/bin/python tracker.py update >> update.log 2>&1
```
`1-5` = måndag–fredag.

### Windows (Task Scheduler)
1. Öppna "Task Scheduler" → "Create Basic Task".
2. Trigger: Daily, kl 18:30.
3. Action: "Start a program".
   - Program: `C:\full\sokvag\stocktracker\venv\Scripts\python.exe`
   - Arguments: `tracker.py update`
   - Start in: `C:\full\sokvag\stocktracker`

## Databasen

`stocks.db` är en vanlig SQLite-fil. Öppna med valfritt verktyg (DB Browser for SQLite,
`sqlite3 stocks.db`, eller vilket språk som helst). Tabeller:

- `watchlist(ticker, added_at)`
- `prices(ticker, date, open, high, low, close, volume, source)` — nyckel: (ticker, date)

## Noteringar
- Yahoo har inget officiellt API; `yfinance` reverse-engineerar det och kan gå sönder
  ibland. Därför finns Stooq som fallback vid fel. Stooqs symbolformat för nordiska
  aktier är dock inkonsekvent — behöver du förlita dig på fallbacken kan du behöva justera
  `_to_stooq_symbol()` i `tracker.py`.
- Endast för privat/hobbybruk. Datan är fördröjd och kan innehålla luckor.
