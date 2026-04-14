# modules/mcu.py
import pandas as pd
from flask import request

from config import FILE_PATH
from core.helpers import clean_uang_bpjs, parse_date_series, get_short_month_year_str

# LOADER
def load_data():
    try:
        df_mcu = pd.read_excel(FILE_PATH, sheet_name="MCU FEB 2026", usecols="B:H")
        df_mcu.columns = ["nama","divisi","project","tahun","periode","tipe_mcu","hasil_mcu"]
        df_mcu['nama']      = df_mcu['nama'].astype(str).str.strip()
        df_mcu['project']   = df_mcu['project'].astype(str).str.strip()
        df_mcu['divisi']    = df_mcu['divisi'].astype(str).str.strip()
        df_mcu['hasil_mcu'] = df_mcu['hasil_mcu'].astype(str).str.strip().str.lower()
        df_mcu['periode']   = parse_date_series(df_mcu['periode'])
        df_mcu['bulan']     = get_short_month_year_str(df_mcu['periode'])

        df_karyawan = pd.read_excel(FILE_PATH, sheet_name="MCU FEB 2026", usecols="K:O")
        df_karyawan.columns = ["nama","branch","job","ring","gender"]
        df_karyawan['nama']   = df_karyawan['nama'].astype(str).str.strip()
        df_karyawan['gender'] = df_karyawan['gender'].astype(str).str.strip().str.lower()

        df_pay = pd.read_excel(FILE_PATH, sheet_name="Pay MCU 2026", usecols="T:W")
        df_pay.columns = ["nama","project","periode","pembayaran"]
        df_pay['nama']    = df_pay['nama'].astype(str).str.strip()
        df_pay['project'] = df_pay['project'].astype(str).str.strip()
        df_pay = df_pay[(df_pay['project'].notna()) & (df_pay['project'] != '') & (df_pay['project'] != 'nan')]

        df_pay['pembayaran'] = df_pay['pembayaran'].apply(clean_uang_bpjs)
        df_pay = df_pay.dropna(subset=['pembayaran'])
        df_pay['periode'] = parse_date_series(df_pay['periode'])
        df_pay['periode'] = get_short_month_year_str(df_pay['periode'])
        
        return df_mcu, df_karyawan, df_pay
    except Exception as e:
        print("ERROR LOAD MCU:", e)
        return pd.DataFrame(), pd.DataFrame(), pd.DataFrame()

# FILTER
def apply_filters(df_mcu, df_pay):
    pr = request.args.get("project")
    h  = request.args.get("hasil")
    st = request.args.get("start")
    en = request.args.get("end")
    if pr:
        df_mcu = df_mcu[df_mcu['project'] == pr]
        df_pay = df_pay[df_pay['project'] == pr]
    if h:
        df_mcu = df_mcu[df_mcu['hasil_mcu'] == h.lower()]
    if st and en:
        df_mcu = df_mcu[(df_mcu['periode'] >= pd.to_datetime(st)) & (df_mcu['periode'] <= pd.to_datetime(en))]
    return df_mcu, df_pay

# KPI CALCULATOR
def calculate_kpi(df, df_pay):
    total = len(df)
    fit   = len(df[df['hasil_mcu'].str.contains('fit',  na=False)])
    unfit = len(df[df['hasil_mcu'].str.contains('unfit',na=False)])
    return {
        "total_mcu": total,
        "fit": fit,
        "unfit": unfit,
        "fit_rate": round(fit/total*100, 2) if total > 0 else 0,
        "total_cost": int(df_pay['pembayaran'].sum())
    }