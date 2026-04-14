# modules/manpower.py
import pandas as pd
from flask import request

from config import FILE_PATH

# LOADER
def load_data():
    try:
        df = pd.read_excel(FILE_PATH, sheet_name="MAN POWER", usecols="B:H")
        df.columns = ["nama","jenis_kelamin","jabatan","branch","group_project","ring","status_kontrak"]
        df['jabatan']        = df['jabatan'].astype(str).str.strip()
        df['branch']         = df['branch'].astype(str).str.strip()
        df['group_project']  = df['group_project'].astype(str).str.strip()
        df['status_kontrak'] = df['status_kontrak'].astype(str).str.strip().str.lower()
        return df
    except Exception as e:
        print("ERROR LOAD MANPOWER:", e)
        return pd.DataFrame()

# FILTER
def apply_filters(df):
    b  = request.args.get("branch")
    j  = request.args.get("jabatan")
    sk = request.args.get("status_kontrak")
    gp = request.args.get("group_project")
    if b:  df = df[df['branch']         == b]
    if j:  df = df[df['jabatan']        == j]
    if sk: df = df[df['status_kontrak'] == sk.lower()]
    if gp: df = df[df['group_project']  == gp]
    return df

# KPI CALCULATOR
def calculate_kpi(df):
    return {
        "total": len(df),
        "permanent": len(df[df['status_kontrak']=='permanent']),
        "kontrak": len(df[df['status_kontrak']=='kontrak'])
    }