# routes/training_routes.py
from flask import Blueprint, jsonify

from core.cache_manager import cached_load
from config import CACHE_TTL
from modules.training import load_data, apply_filters, calculate_kpi

training_bp = Blueprint('training', __name__)

def get_cached_data():
    return cached_load(load_data, 'training', CACHE_TTL)

@training_bp.route('/dashboard')
def training_dashboard():
    df = get_cached_data()
    df = apply_filters(df)
    kpi = calculate_kpi(df)

    jenis = df['jenis'].value_counts().reset_index()
    jenis.columns = ['jenis', 'jumlah']

    divisi = df['divisi'].value_counts().reset_index()
    divisi.columns = ['divisi', 'jumlah']

    pelatihan = df['pelatihan'].value_counts().reset_index()
    pelatihan.columns = ['pelatihan', 'jumlah']

    status = df['status'].value_counts().reset_index()
    status.columns = ['status', 'jumlah']

    trend = df['bulan'].value_counts().sort_index().reset_index()
    trend.columns = ['bulan', 'jumlah']

    return jsonify({
        "kpi": kpi,
        "jenis": jenis.to_dict(orient='records'),
        "divisi": divisi.to_dict(orient='records'),
        "pelatihan": pelatihan.to_dict(orient='records'),
        "status": status.to_dict(orient='records'),
        "trend": trend.to_dict(orient='records')
    })