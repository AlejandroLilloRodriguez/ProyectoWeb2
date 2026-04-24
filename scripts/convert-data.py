"""
Convierte el dataset de Kaggle (wyattowalsh/basketball) a JSON para MongoDB.
Uso: python scripts/convert-data.py <ruta-carpeta-dataset>
Ejemplo: python scripts/convert-data.py ~/Downloads/basketball
"""

import sys
import os
import json
import math

def clean(val):
    """Convierte NaN y tipos numpy a tipos Python nativos."""
    if val is None:
        return None
    if isinstance(val, float) and math.isnan(val):
        return None
    if hasattr(val, 'item'):
        return val.item()
    return val

def save_json(data, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def main():
    if len(sys.argv) >= 2:
        dataset_dir = os.path.expanduser(sys.argv[1])
    else:
        try:
            import kagglehub
        except ImportError:
            print("Instala kagglehub: pip install kagglehub")
            sys.exit(1)
        print("Descargando dataset desde Kaggle...")
        dataset_dir = kagglehub.dataset_download("wyattowalsh/basketball")
        print(f"Dataset descargado en: {dataset_dir}")

    try:
        import pandas as pd
    except ImportError:
        print("Instala pandas: pip install pandas")
        sys.exit(1)

    # Si los CSV estan en una subcarpeta csv/, usarla directamente
    csv_subdir = os.path.join(dataset_dir, 'csv')
    if os.path.isdir(csv_subdir):
        dataset_dir = csv_subdir

    available = os.listdir(dataset_dir)
    print(f"Archivos encontrados: {available}\n")

    # --- TEAMS ---
    team_file = None
    for name in ['team.csv', 'teams.csv', 'dim_team.csv']:
        if name in available:
            team_file = os.path.join(dataset_dir, name)
            break

    if not team_file:
        print("No se encontró archivo de teams. Busca manualmente en:", available)
        sys.exit(1)

    df_teams = pd.read_csv(team_file)
    print(f"Columnas teams: {list(df_teams.columns)}")

    teams = []
    for _, row in df_teams.iterrows():
        name_val = clean(row.get('full_name') or row.get('nickname') or row.get('name'))
        abbr     = clean(row.get('abbreviation'))
        city     = clean(row.get('city'))
        conf     = clean(row.get('conference'))
        div      = clean(row.get('division'))
        if not name_val or not abbr:
            continue
        teams.append({
            "name":         name_val,
            "city":         city or "",
            "abbreviation": str(abbr).upper(),
            "conference":   conf if conf in ['East', 'West'] else 'East',
            "division":     div or "Atlantic",
            "foundedYear":  clean(row.get('year_founded') or row.get('founded_year')),
            "venue":        clean(row.get('arena') or row.get('venue')),
            "_kaggleId":    clean(row.get('id') or row.get('team_id')),
        })

    save_json(teams, 'data/teams.json')
    print(f"Teams guardados: {len(teams)}")

    # --- PLAYERS ---
    player_file = None
    for name in ['player.csv', 'players.csv', 'dim_player.csv', 'common_player_info.csv']:
        if name in available:
            player_file = os.path.join(dataset_dir, name)
            break

    if not player_file:
        print("No se encontró archivo de players. Busca manualmente en:", available)
        sys.exit(1)

    df_players = pd.read_csv(player_file)
    print(f"Columnas players: {list(df_players.columns)}")

    players = []
    for _, row in df_players.iterrows():
        first = clean(row.get('first_name') or row.get('player_first_name') or "")
        last  = clean(row.get('last_name')  or row.get('player_last_name')  or "")
        full  = clean(row.get('display_first_last') or row.get('full_name') or f"{first} {last}".strip())
        if not full:
            continue
        players.append({
            "firstName":      str(first) if first else full.split()[0] if full else "",
            "lastName":       str(last)  if last  else full.split()[-1] if full else "",
            "fullName":       str(full),
            "position":       clean(row.get('position')),
            "active":         bool(row.get('is_active') or row.get('active') or False),
            "debutYear":      clean(row.get('from_year') or row.get('debut_year')),
            "_kaggleTeamId":  clean(row.get('team_id')),
        })

    save_json(players, 'data/players.json')
    print(f"Players guardados: {len(players)}")

    # --- GAMES ---
    game_file = None
    for name in ['game.csv', 'games.csv', 'dim_game.csv']:
        if name in available:
            game_file = os.path.join(dataset_dir, name)
            break

    if not game_file:
        print("No se encontró archivo de games. Busca manualmente en:", available)
        sys.exit(1)

    df_games = pd.read_csv(game_file, low_memory=False)
    print(f"Columnas games: {list(df_games.columns)}")
    print(f"Total filas games: {len(df_games)}")

    games = []
    for _, row in df_games.iterrows():
        home_pts  = clean(row.get('pts_home')  or row.get('home_pts')  or row.get('home_score'))
        away_pts  = clean(row.get('pts_away')  or row.get('away_pts')  or row.get('away_score'))
        wl_home   = str(clean(row.get('wl_home') or '') or '').strip().upper()
        season_raw = clean(row.get('season_id') or row.get('season') or 0)
        try:
            season = int(str(season_raw)[1:5]) if str(season_raw).startswith('2') else int(str(season_raw)[:4])
        except Exception:
            season = 2000
        date_val = clean(row.get('game_date') or row.get('date') or '2000-01-01')
        games.append({
            "season":             season,
            "date":               str(date_val),
            "status":             "finished",
            "phase":              "regular",
            "homeScore":          int(home_pts) if home_pts is not None else None,
            "awayScore":          int(away_pts) if away_pts is not None else None,
            "arena":              clean(row.get('arena_name') or row.get('arena')),
            "_kaggleHomeTeamId":  clean(row.get('team_id_home') or row.get('home_team_id')),
            "_kaggleAwayTeamId":  clean(row.get('team_id_away') or row.get('away_team_id')),
            "_kaggleWinnerHome":  wl_home == 'W',
        })

    save_json(games, 'data/games.json')
    print(f"Games guardados: {len(games)}")

    if len(games) < 1000:
        print(f"\nATENCION: solo hay {len(games)} partidos. El enunciado pide +1000.")
    else:
        print(f"\nOK: {len(games)} partidos, cumple el requisito de +1000.")

if __name__ == '__main__':
    main()
