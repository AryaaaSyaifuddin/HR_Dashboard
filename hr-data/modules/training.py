# modules/training.py
import pandas as pd
from flask import request

from config import FILE_PATH
from core.helpers import parse_date_series, get_month_year_str

# LOADER
def load_data():
    try:
        df = pd.read_excel(FILE_PATH, sheet_name="INTERNAL & EXTERNAL TRAINING FE", usecols="B:H")
        df.columns = ["jenis","nama","divisi","pelatihan","lembaga","periode","status"]
        df['jenis']     = df['jenis'].astype(str).str.strip().str.lower()
        df['divisi']    = df['divisi'].astype(str).str.strip()
        df['pelatihan'] = df['pelatihan'].astype(str).str.strip()
        df['status']    = df['status'].astype(str).str.strip().str.lower()
        df['periode']   = parse_date_series(df['periode'])
        df['bulan']     = get_month_year_str(df['periode'])
        return df
    except Exception as e:
        print("ERROR LOAD TRAINING:", e)
        return pd.DataFrame()

# FILTER
def apply_filters(df):
    j  = request.args.get("jenis")
    d  = request.args.get("divisi")
    s  = request.args.get("status")
    st = request.args.get("start")
    en = request.args.get("end")
    if j:  df = df[df['jenis']  == j.lower()]
    if d:  df = df[df['divisi'] == d]
    if s:  df = df[df['status'] == s.lower()]
    if st and en:
        df = df[(df['periode'] >= pd.to_datetime(st)) & (df['periode'] <= pd.to_datetime(en))]
    return df

# KPI CALCULATOR
def calculate_kpi(df):
    return {
        "total": len(df),
        "internal": len(df[df['jenis']=='internal']),
        "external": len(df[df['jenis']=='external']),
        "done": len(df[df['status']=='done']),
        "in_progress": len(df[df['status']=='in progress']),
        "cancel": len(df[df['status']=='cancel'])
    }