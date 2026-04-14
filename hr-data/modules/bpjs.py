# modules/bpjs.py
import pandas as pd
from flask import request

from config import FILE_PATH
from core.helpers import clean_uang_bpjs, parse_date_series

# LOADER
def load_data():
    try:
        df_karyawan = pd.read_excel(FILE_PATH, sheet_name="BPJS", usecols="B:D")
        df_karyawan.columns = ["nama","project","jenis_bpjs"]
        df_karyawan['project']    = df_karyawan['project'].astype(str).str.strip()
        df_karyawan['jenis_bpjs'] = df_karyawan['jenis_bpjs'].astype(str).str.strip().str.lower()
        df_karyawan               = df_karyawan.dropna(subset=['nama'])

        def clean_uang(df, col):
            df = df.copy()
            df[col] = df[col].apply(clean_uang_bpjs)
            return df.dropna(subset=[col])

        df_kes = pd.read_excel(FILE_PATH, sheet_name="BPJS", usecols="G:H")
        df_kes.columns = ["periode","pembayaran"]
        df_kes = clean_uang(df_kes, 'pembayaran')
        df_kes['periode'] = parse_date_series(df_kes['periode'])

        df_perm = pd.read_excel(FILE_PATH, sheet_name="PAY BPJS TK", usecols="C:D")
        df_perm.columns = ["periode","pembayaran"]
        df_perm = clean_uang(df_perm, 'pembayaran')
        df_perm['periode'] = parse_date_series(df_perm['periode'])

        df_bor = pd.read_excel(FILE_PATH, sheet_name="PAY BPJS TK", usecols="F:G")
        df_bor.columns = ["periode","pembayaran"]
        df_bor = clean_uang(df_bor, 'pembayaran')
        df_bor['periode'] = parse_date_series(df_bor['periode'])

        return df_karyawan, df_kes, df_perm, df_bor
    except Exception as e:
        print("ERROR LOAD BPJS:", e)
        return pd.DataFrame(), pd.DataFrame(), pd.DataFrame(), pd.DataFrame()

# FILTER
def apply_filters(df_k, df_kes, df_perm, df_bor):
    pr = request.args.get("project")
    j  = request.args.get("jenis_bpjs")
    p  = request.args.get("periode")
    if pr: df_k = df_k[df_k['project'] == pr]
    if j:  df_k = df_k[df_k['jenis_bpjs'] == j.lower()]
    if p:
        df_kes  = df_kes[df_kes['periode']   == p]
        df_perm = df_perm[df_perm['periode'] == p]
        df_bor  = df_bor[df_bor['periode']   == p]
    return df_k, df_kes, df_perm, df_bor

# KPI CALCULATOR
def calculate_kpi(df_kes, df_perm, df_bor, df_k):
    return {
        "bpjs_kesehatan": int(df_kes['pembayaran'].sum()),
        "bpjs_tk_permanent": int(df_perm['pembayaran'].sum()),
        "bpjs_tk_borongan": int(df_bor['pembayaran'].sum()),
        "total_semua": int(df_kes['pembayaran'].sum()+df_perm['pembayaran'].sum()+df_bor['pembayaran'].sum()),
        "total_karyawan_bpjs": len(df_k)
    }