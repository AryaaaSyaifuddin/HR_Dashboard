# modules/overtime.py
import pandas as pd
from flask import request

from config import FILE_PATH
from core.helpers import clean_number, parse_date_series

# -------------------------------------------------------------------
# LOADER
# -------------------------------------------------------------------
def load_data():
    try:
        df_overtime = pd.read_excel(FILE_PATH, sheet_name="OVERTIME DAN ABSENSI", usecols="B:D", skiprows=3)
        df_overtime.columns = ["project","bulan","overtime"]

        df_absensi = pd.read_excel(FILE_PATH, sheet_name="OVERTIME DAN ABSENSI", usecols="F:G", skiprows=3)
        df_absensi.columns = ["periode","absensi"]

        df_cost = pd.read_excel(FILE_PATH, sheet_name="OVERTIME DAN ABSENSI", usecols="I:M", skiprows=3)
        df_cost.columns = ["project","bulan","total_cost","overtime_cost","overtime_percent"]

        for col in ['total_cost','overtime_cost','overtime_percent']:
            df_cost[col] = df_cost[col].apply(clean_number)

        df_overtime['overtime'] = pd.to_numeric(df_overtime['overtime'], errors='coerce')
        df_absensi['absensi']   = pd.to_numeric(df_absensi['absensi'],   errors='coerce')
        df_overtime['bulan']    = parse_date_series(df_overtime['bulan'])
        df_absensi['periode']   = parse_date_series(df_absensi['periode'])
        df_cost['bulan']        = parse_date_series(df_cost['bulan'])

        df_overtime = df_overtime.dropna(subset=['project','bulan','overtime'])
        df_absensi  = df_absensi.dropna(subset=['periode','absensi'])
        df_cost     = df_cost.dropna(subset=['project','bulan','total_cost','overtime_cost'])
        return df_overtime, df_absensi, df_cost
    except Exception as e:
        print("ERROR LOAD OVERTIME:", e)
        return pd.DataFrame(), pd.DataFrame(), pd.DataFrame()

# -------------------------------------------------------------------
# FILTER
# -------------------------------------------------------------------
def apply_filters(df_ot, df_abs, df_cost):
    pr = request.args.get("project")
    st = request.args.get("start")
    en = request.args.get("end")
    if pr:
        df_ot   = df_ot[df_ot['project']   == pr]
        df_cost = df_cost[df_cost['project'] == pr]
    if st and en:
        s = pd.to_datetime(st)
        e = pd.to_datetime(en)
        df_ot   = df_ot[(df_ot['bulan']     >= s) & (df_ot['bulan']     <= e)]
        df_abs  = df_abs[(df_abs['periode'] >= s) & (df_abs['periode']  <= e)]
        df_cost = df_cost[(df_cost['bulan'] >= s) & (df_cost['bulan']   <= e)]
    return df_ot, df_abs, df_cost

# -------------------------------------------------------------------
# KPI CALCULATOR (tidak terpisah, akan dihitung di route)
# -------------------------------------------------------------------
# Untuk overtime, KPI dihitung langsung di route karena kompleksitasnya.