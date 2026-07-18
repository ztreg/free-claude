#!/usr/bin/env python3
"""
Aktiebevakare - folj aktier och spara end-of-day-data i en egen SQLite-databas.

Kommandon:
    python tracker.py add ERIC-B.ST VOLV-B.ST     # borja folja aktier
    python tracker.py remove ERIC-B.ST            # sluta folja
    python tracker.py list                        # visa bevakade aktier
    python tracker.py update                       # hamta EOD for alla bevakade
    python tracker.py update --backfill 90         # hamta 90 dagar bakat forsta gangen
    python tracker.py show ERIC-B.ST --days 30     # visa sparad data
    python tracker.py export prices.csv            # exportera allt till CSV

Yahoo Finance ar primar kalla, Stooq anvands som fallback om Yahoo strular.
Data lagras i stocks.db (SQLite) bredvid det har skriptet.
"""

import argparse
import sqlite3
import sys
from datetime import datetime, timedelta, date
from pathlib import Path

DB_PATH = Path(__file__).parent / "stocks.db"


# --------------------------------------------------------------------------- #
#  Databas
# --------------------------------------------------------------------------- #
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS watchlist (
            ticker   TEXT PRIMARY KEY,
            added_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS prices (
            ticker  TEXT    NOT NULL,
            date    TEXT    NOT NULL,   -- YYYY-MM-DD
            open    REAL,
            high    REAL,
            low     REAL,
            close   REAL,
            volume  INTEGER,
            source  TEXT,
            PRIMARY KEY (ticker, date)
        );
        """
    )
    conn.commit()
    return conn


# --------------------------------------------------------------------------- #
#  Datakallor
# --------------------------------------------------------------------------- #
def fetch_yahoo(ticker, start):
    """Returnerar lista av dict med OHLCV fran Yahoo Finance."""
    import yfinance as yf

    df = yf.Ticker(ticker).history(start=start, interval="1d", auto_adjust=False)
    rows = []
    for idx, r in df.iterrows():
        rows.append(
            {
                "date": idx.date().isoformat(),
                "open": _f(r.get("Open")),
                "high": _f(r.get("High")),
                "low": _f(r.get("Low")),
                "close": _f(r.get("Close")),
                "volume": _i(r.get("Volume")),
                "source": "yahoo",
            }
        )
    return rows


def fetch_stooq(ticker, start):
    """Fallback via Stooq (gratis CSV, ingen nyckel). Konverterar Yahoo-suffix."""
    import pandas as pd

    stooq_symbol = _to_stooq_symbol(ticker)
    url = (
        f"https://stooq.com/q/d/l/?s={stooq_symbol}"
        f"&d1={start.replace('-', '')}&d2={date.today().strftime('%Y%m%d')}&i=d"
    )
    df = pd.read_csv(url)
    if "Date" not in df.columns:  # Stooq svarar "No data" som en rad utan kolumner
        return []
    rows = []
    for _, r in df.iterrows():
        rows.append(
            {
                "date": str(r["Date"]),
                "open": _f(r.get("Open")),
                "high": _f(r.get("High")),
                "low": _f(r.get("Low")),
                "close": _f(r.get("Close")),
                "volume": _i(r.get("Volume")),
                "source": "stooq",
            }
        )
    return rows


def _to_stooq_symbol(ticker):
    """ERIC-B.ST -> eric-b.st  (Stooq anvander gemener). Justera vid behov."""
    return ticker.lower()


def _f(v):
    try:
        f = float(v)
        return None if f != f else round(f, 4)  # filtrera NaN
    except (TypeError, ValueError):
        return None


def _i(v):
    try:
        return int(v)
    except (TypeError, ValueError):
        return None


# --------------------------------------------------------------------------- #
#  Kommandon
# --------------------------------------------------------------------------- #
def cmd_add(conn, tickers):
    now = datetime.now().isoformat(timespec="seconds")
    for t in tickers:
        t = t.strip().upper()
        conn.execute(
            "INSERT OR IGNORE INTO watchlist (ticker, added_at) VALUES (?, ?)",
            (t, now),
        )
        print(f"  + foljer {t}")
    conn.commit()


def cmd_remove(conn, tickers):
    for t in tickers:
        t = t.strip().upper()
        conn.execute("DELETE FROM watchlist WHERE ticker = ?", (t,))
        print(f"  - slutar folja {t}")
    conn.commit()


def cmd_list(conn):
    rows = conn.execute(
        """
        SELECT w.ticker,
               COUNT(p.date)  AS n,
               MAX(p.date)    AS senast,
               (SELECT close FROM prices
                 WHERE ticker = w.ticker ORDER BY date DESC LIMIT 1) AS sista_kurs
        FROM watchlist w
        LEFT JOIN prices p ON p.ticker = w.ticker
        GROUP BY w.ticker
        ORDER BY w.ticker
        """
    ).fetchall()
    if not rows:
        print("Inga aktier bevakas an. Lagg till med:  python tracker.py add ERIC-B.ST")
        return
    print(f"{'Ticker':<14}{'Rader':>7}{'Senast':>13}{'Sista kurs':>13}")
    print("-" * 47)
    for r in rows:
        kurs = "-" if r["sista_kurs"] is None else f"{r['sista_kurs']:.2f}"
        print(f"{r['ticker']:<14}{r['n']:>7}{(r['senast'] or '-'):>13}{kurs:>13}")


def cmd_update(conn, backfill_days):
    tickers = [r["ticker"] for r in conn.execute("SELECT ticker FROM watchlist")]
    if not tickers:
        print("Inga aktier att uppdatera. Lagg till nagra forst.")
        return

    today = date.today().isoformat()
    for t in tickers:
        # hamta fran dagen efter senast sparade datum, annars backfill
        last = conn.execute(
            "SELECT MAX(date) AS d FROM prices WHERE ticker = ?", (t,)
        ).fetchone()["d"]
        if last:
            start = (date.fromisoformat(last) + timedelta(days=1)).isoformat()
        else:
            start = (date.today() - timedelta(days=backfill_days)).isoformat()

        if start > today:  # redan uppdaterad t.o.m. igar/idag
            print(f"  {t:<14} aktuell")
            continue

        rows, used = _fetch_with_fallback(t, start)
        n = _upsert(conn, t, rows)
        status = f"{n} nya rader via {used}" if n else "inget nytt (inga handelsdagar i intervallet)"
        print(f"  {t:<14} {status}")
    conn.commit()


def _fetch_with_fallback(ticker, start):
    """Yahoo ar primar. Stooq anvands BARA om Yahoo faktiskt kastar ett fel."""
    try:
        return fetch_yahoo(ticker, start), "yahoo"
    except Exception as e:
        print(f"    (yahoo misslyckades for {ticker}: {e} - provar stooq)")
    try:
        return fetch_stooq(ticker, start), "stooq"
    except Exception as e:
        print(f"    (stooq misslyckades ocksa for {ticker}: {e})")
    return [], "-"


def _upsert(conn, ticker, rows):
    n = 0
    for r in rows:
        cur = conn.execute(
            """
            INSERT INTO prices (ticker, date, open, high, low, close, volume, source)
            VALUES (:ticker, :date, :open, :high, :low, :close, :volume, :source)
            ON CONFLICT(ticker, date) DO NOTHING
            """,
            {**r, "ticker": ticker},
        )
        n += cur.rowcount
    return n


def cmd_show(conn, ticker, days):
    ticker = ticker.strip().upper()
    rows = conn.execute(
        "SELECT date, open, high, low, close, volume FROM prices "
        "WHERE ticker = ? ORDER BY date DESC LIMIT ?",
        (ticker, days),
    ).fetchall()
    if not rows:
        print(f"Ingen data for {ticker}.")
        return
    print(f"{ticker}  (senaste {len(rows)} dagar)")
    print(f"{'Datum':<12}{'Open':>9}{'High':>9}{'Low':>9}{'Close':>9}{'Volym':>12}")
    print("-" * 60)
    for r in reversed(rows):
        print(
            f"{r['date']:<12}{_c(r['open']):>9}{_c(r['high']):>9}"
            f"{_c(r['low']):>9}{_c(r['close']):>9}{(r['volume'] or 0):>12,}"
        )


def _c(v):
    return "-" if v is None else f"{v:.2f}"


def cmd_export(conn, path):
    import csv

    rows = conn.execute(
        "SELECT ticker, date, open, high, low, close, volume, source "
        "FROM prices ORDER BY ticker, date"
    ).fetchall()
    with open(path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["ticker", "date", "open", "high", "low", "close", "volume", "source"])
        for r in rows:
            w.writerow([r[k] for k in r.keys()])
    print(f"Exporterade {len(rows)} rader till {path}")


# --------------------------------------------------------------------------- #
#  CLI
# --------------------------------------------------------------------------- #
def main():
    p = argparse.ArgumentParser(description="Folj aktier och spara EOD-data i SQLite.")
    sub = p.add_subparsers(dest="cmd", required=True)

    a = sub.add_parser("add", help="lagg till aktier att folja")
    a.add_argument("tickers", nargs="+")

    r = sub.add_parser("remove", help="sluta folja aktier")
    r.add_argument("tickers", nargs="+")

    sub.add_parser("list", help="visa bevakade aktier")

    u = sub.add_parser("update", help="hamta EOD for alla bevakade")
    u.add_argument("--backfill", type=int, default=30,
                   help="antal dagar bakat forsta gangen (standard 30)")

    s = sub.add_parser("show", help="visa sparad data for en aktie")
    s.add_argument("ticker")
    s.add_argument("--days", type=int, default=30)

    e = sub.add_parser("export", help="exportera all data till CSV")
    e.add_argument("path")

    args = p.parse_args()
    conn = get_db()

    if args.cmd == "add":
        cmd_add(conn, args.tickers)
    elif args.cmd == "remove":
        cmd_remove(conn, args.tickers)
    elif args.cmd == "list":
        cmd_list(conn)
    elif args.cmd == "update":
        cmd_update(conn, args.backfill)
    elif args.cmd == "show":
        cmd_show(conn, args.ticker, args.days)
    elif args.cmd == "export":
        cmd_export(conn, args.path)


if __name__ == "__main__":
    main()