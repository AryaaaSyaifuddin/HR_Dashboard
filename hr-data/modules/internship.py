# modules/internship.py
import pandas as pd
from datetime import datetime, timedelta
from flask import request

from config import FILE_PATH
from core.helpers import parse_date_series, get_month_year_str

# LOADER
def load_data():
    try:
        df = pd.read_excel(FILE_PATH, sheet_name="INTERNSHIP", skiprows=2, usecols="B:M")
        df.columns = ["nama","program","institusi","kota","ket","permohonan",
                      "penempatan","durasi","status","final_project","potensi","berakhir"]
        df['institusi']  = df['institusi'].astype(str).str.strip()
        df['status']     = df['status'].astype(str).str.strip().str.lower()
        df['penempatan'] = df['penempatan'].astype(str).str.strip()
        df['permohonan'] = parse_date_series(df['permohonan'])
        df['bulan']      = get_month_year_str(df['permohonan'])
        df['berakhir']   = parse_date_series(df['berakhir'], dayfirst=True)
        return df
    except Exception as e:
        print("ERROR LOAD INTERNSHIP:", e)
        return pd.DataFrame()

# FILTER
def apply_filters(df):
    i = request.args.get("institusi")
    p = request.args.get("penempatan")
    s = request.args.get("status")
    st = request.args.get("start")
    en = request.args.get("end")
    if i:  df = df[df['institusi']  == i]
    if p:  df = df[df['penempatan'] == p]
    if s:  df = df[df['status']     == s.lower()]
    if st and en:
        df = df[(df['permohonan'] >= pd.to_datetime(st)) & (df['permohonan'] <= pd.to_datetime(en))]
    return df

# KPI CALCULATOR
def calculate_kpi(df):
    today = pd.to_datetime(datetime.today().date())
    batas = today + timedelta(days=14)
    ab = df[(df['berakhir'].notna()) & (df['berakhir'] >= today) & (df['berakhir'] <= batas)]
    return {
        "onboard": len(df[df['status']=='onboard']),
        "butuh_surat_balasan": len(df[df['status']=='butuh surat balasan']),
        "ajukan_ulang": len(df[df['status']=='ajukan ulang']),
        "selesai": len(df[df['status']=='selesai']),
        "akan_berakhir": len(ab),
        "total": len(df)
    }