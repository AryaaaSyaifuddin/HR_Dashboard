# modules/kpi.py
import pandas as pd
from flask import request

from config import FILE_PATH
from core.helpers import safe_float_percent

# LOADER
def load_data():
    try:
        df = pd.read_excel(FILE_PATH, sheet_name="KPI", header=None)

        kpi_definitions = []
        for row in range(3, 22):
            no_v = df.iloc[row, 1]
            if pd.isna(no_v):
                continue
            try:
                no_int = int(float(str(no_v)))
            except:
                continue
            kpi_name = str(df.iloc[row, 2]).strip()
            if not kpi_name or kpi_name == 'nan':
                continue
            variable    = str(df.iloc[row, 3]).strip()
            unit        = str(df.iloc[row, 4]).strip()
            target_desc = str(df.iloc[row, 5]).strip()
            is_lower    = any(k in kpi_name.lower() for k in ['pelanggaran','turn over'])
            kpi_definitions.append({
                'no': no_int,
                'kpi': kpi_name,
                'variable': variable,
                'unit': unit,
                'target_desc': target_desc,
                'is_lower_better': is_lower
            })

        monthly_2026 = []
        for i in range(26, 44):
            row_data = df.iloc[i]
            if pd.isna(row_data[1]) or pd.isna(row_data[2]):
                continue
            kpi_name = str(row_data[2]).strip()
            if not kpi_name or kpi_name == 'nan':
                continue
            try:
                no_int = int(float(str(row_data[1])))
            except:
                continue

            bulan_dt  = pd.to_datetime(row_data[3], errors='coerce')
            bulan_str = bulan_dt.strftime('%b %Y') if pd.notna(bulan_dt) else None
            target    = safe_float_percent(row_data[4])
            actual    = safe_float_percent(row_data[5])

            is_lower = any(k in kpi_name.lower() for k in ['pelanggaran','turn over'])
            status = None
            if target is not None and actual is not None:
                status = 'tercapai' if (actual <= target if is_lower else actual >= target) else 'tidak_tercapai'

            kpi_no_actual = ((no_int - 1) % 9) + 1
            meta = next((d for d in kpi_definitions if d['no'] == kpi_no_actual), None)

            monthly_2026.append({
                'no':     kpi_no_actual,
                'kpi':    kpi_name,
                'bulan':  bulan_str,
                'target': target,
                'actual': actual,
                'status': status,
                'unit':   meta['unit'] if meta else ''
            })

        return kpi_definitions, monthly_2026

    except Exception as e:
        print("ERROR LOAD KPI:", e)
        import traceback
        traceback.print_exc()
        return [], []

# FILTER
def apply_filters(monthly_2026):
    bulan  = request.args.get("bulan")
    kpi_no = request.args.get("no")
    status = request.args.get("status")
    result = monthly_2026
    if bulan:
        result = [r for r in result if r['bulan'] == bulan]
    if kpi_no:
        try:
            n = int(kpi_no)
            result = [r for r in result if r['no'] == n]
        except:
            pass
    if status:
        result = [r for r in result if r['status'] == status]
    return result

# KPI CALCULATOR (summary)
def calculate_summary(filtered):
    total    = len(filtered)
    tercapai = sum(1 for r in filtered if r['status'] == 'tercapai')
    tidak    = sum(1 for r in filtered if r['status'] == 'tidak_tercapai')
    return {
        "total_kpi":      total,
        "tercapai":       tercapai,
        "tidak_tercapai": tidak,
        "pct_tercapai":   round(tercapai / total * 100, 1) if total > 0 else 0
    }