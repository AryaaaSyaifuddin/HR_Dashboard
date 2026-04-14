# modules/salary.py
import pandas as pd
from flask import request

from config import FILE_PATH
from core.helpers import parse_date_series, get_short_month_year_str

# LOADER
def load_data():
    try:
        df_gaji = pd.read_excel(FILE_PATH, sheet_name="GAJI DAN PPH21", usecols="B:D", skiprows=3)
        df_gaji.columns = ["project","periode","gaji"]
        df_gaji['project']    = df_gaji['project'].astype(str).str.strip()
        df_gaji['gaji']       = pd.to_numeric(df_gaji['gaji'], errors='coerce')
        df_gaji               = df_gaji.dropna(subset=['project','gaji'])
        df_gaji['periode_dt'] = parse_date_series(df_gaji['periode'])
        df_gaji['periode']    = get_short_month_year_str(df_gaji['periode_dt'])
        df_gaji               = df_gaji.dropna(subset=['periode'])

        df_pph = pd.read_excel(FILE_PATH, sheet_name="GAJI DAN PPH21", usecols="G:I", skiprows=3)
        df_pph.columns = ["project","periode","pph21"]
        df_pph['project']    = df_pph['project'].astype(str).str.strip()
        df_pph['pph21']      = pd.to_numeric(df_pph['pph21'], errors='coerce')
        df_pph               = df_pph.dropna(subset=['project','pph21'])
        df_pph['periode_dt'] = parse_date_series(df_pph['periode'])
        df_pph['periode']    = get_short_month_year_str(df_pph['periode_dt'])
        df_pph               = df_pph.dropna(subset=['periode'])
        
        return df_gaji, df_pph
    except Exception as e:
        print("ERROR LOAD SALARY:", e)
        return pd.DataFrame(), pd.DataFrame()

# FILTER
def apply_filters(df, column_periode):
    p  = request.args.get("periode")
    pr = request.args.get("project")
    if p:  df = df[df[column_periode] == p]
    if pr: df = df[df['project'] == pr]
    return df

# KPI CALCULATOR
def calculate_kpi(df_gaji, df_pph):
    return {
        "total_gaji": int(df_gaji['gaji'].sum()),
        "total_pph21": int(df_pph['pph21'].sum()),
        "jumlah_project": df_gaji['project'].nunique()
    }