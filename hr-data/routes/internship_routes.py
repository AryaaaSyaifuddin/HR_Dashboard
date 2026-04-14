# routes/internship_routes.py
from flask import Blueprint, jsonify

from core.cache_manager import cached_load
from config import CACHE_TTL
from modules.internship import load_data, apply_filters, calculate_kpi
from modules.internship import filter_by_kpi_type

internship_bp = Blueprint('internship', __name__)

def get_cached_data():
    return cached_load(load_data, 'internship', CACHE_TTL)

@internship_bp.route('/dashboard')
def get_dashboard():
    df = get_cached_data()
    df = apply_filters(df)
    kpi = calculate_kpi(df)

    institusi = df['institusi'].value_counts().reset_index()
    institusi.columns = ['institusi', 'jumlah']

    permohonan = df['bulan'].value_counts().sort_index().reset_index()
    permohonan.columns = ['bulan', 'jumlah']

    penempatan = df['penempatan'].value_counts().reset_index()
    penempatan.columns = ['penempatan', 'jumlah']

    ket = df['ket'].value_counts().reset_index()
    ket.columns = ['ket', 'jumlah']

    return jsonify({
        "kpi": kpi,
        "institusi": institusi.to_dict(orient='records'),
        "permohonan": permohonan.to_dict(orient='records'),
        "penempatan": penempatan.to_dict(orient='records'),
        "ket": ket.to_dict(orient='records')
    })

@internship_bp.route('/records/<kpi_type>')
def get_records_by_kpi(kpi_type):
    from datetime import datetime, timedelta
    import pandas as pd

    df = get_cached_data()
    df = apply_filters(df)

    today = pd.to_datetime(datetime.today().date())
    batas = today + timedelta(days=14)

    # Mapping kpi_type ke kondisi filter
    if kpi_type == 'onboard':
        filtered = df[df['status'] == 'onboard']
    elif kpi_type == 'butuh surat balasan':
        filtered = df[df['status'] == 'butuh surat balasan']
    elif kpi_type == 'ajukan ulang':
        filtered = df[df['status'] == 'ajukan ulang']
    elif kpi_type == 'selesai':
        filtered = df[df['status'] == 'selesai']
    elif kpi_type == 'akan_berakhir':
        filtered = df[(df['berakhir'].notna()) & (df['berakhir'] >= today) & (df['berakhir'] <= batas)]
    elif kpi_type == 'total':
        filtered = df
    else:
        return jsonify({"error": f"Unknown KPI type: {kpi_type}"}), 400

    # Pilih kolom yang relevan
    columns_to_show = ['nama', 'program', 'institusi', 'kota', 'penempatan', 'durasi', 'status', 'permohonan', 'berakhir']
    available_cols = [c for c in columns_to_show if c in filtered.columns]
    result_df = filtered[available_cols].copy()

    # Format tanggal
    if 'permohonan' in result_df.columns:
        result_df['permohonan'] = result_df['permohonan'].dt.strftime('%Y-%m-%d')
    if 'berakhir' in result_df.columns:
        result_df['berakhir'] = result_df['berakhir'].dt.strftime('%Y-%m-%d')

    records = result_df.replace({pd.NaT: None, float('nan'): None}).to_dict(orient='records')

    return jsonify({
        "kpi_type": kpi_type,
        "count": len(records),
        "data": records
    })