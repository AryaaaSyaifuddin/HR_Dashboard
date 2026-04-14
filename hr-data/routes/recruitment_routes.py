# routes/recruitment_routes.py
import pandas as pd
from flask import Blueprint, jsonify

from core.cache_manager import cached_load
from config import CACHE_TTL
from modules.recruitment import load_data, apply_filters, calculate_kpi

recruitment_bp = Blueprint('recruitment', __name__)

def get_cached_data():
    return cached_load(load_data, 'recruitment', CACHE_TTL)

@recruitment_bp.route('/dashboard')
def recruitment_dashboard():
    df = get_cached_data()
    df = apply_filters(df)
    kpi = calculate_kpi(df)

    # Status counts
    status = df['status'].value_counts().reset_index()
    status.columns = ['status', 'jumlah']

    # Posisi counts
    posisi = df['posisi'].value_counts().reset_index()
    posisi.columns = ['posisi', 'jumlah']

    # Trend per bulan (total dan accepted)
    trend_total = df.groupby('bulan').size().reset_index(name='jumlah')
    trend_accepted = df[df['status'] == 'accepted'].groupby('bulan').size().reset_index(name='accepted')
    trend = pd.merge(trend_total, trend_accepted, on='bulan', how='left')
    trend['accepted'] = trend['accepted'].fillna(0).astype(int)
    trend['_sort'] = pd.to_datetime(trend['bulan'], format='%B %Y', errors='coerce')
    trend = trend.sort_values('_sort').drop('_sort', axis=1)

    # Funnel
    funnel_order = ['on process', 'mcu', 'accepted', 'rejected', 'mengundurkan diri']
    fd = df['status'].value_counts()
    funnel = [{"status": f, "jumlah": int(fd.get(f, 0))} for f in funnel_order]

    return jsonify({
        "kpi": kpi,
        "status": status.to_dict(orient='records'),
        "posisi": posisi.to_dict(orient='records'),
        "trend": trend.to_dict(orient='records'),
        "funnel": funnel
    })