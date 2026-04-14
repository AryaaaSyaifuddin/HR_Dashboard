# routes/salary_routes.py
import pandas as pd
from flask import Blueprint, jsonify

from core.cache_manager import cached_load
from config import CACHE_TTL
from modules.salary import load_data, apply_filters, calculate_kpi

salary_bp = Blueprint('salary', __name__)

def get_cached_data():
    return cached_load(load_data, 'salary', CACHE_TTL)

@salary_bp.route('/dashboard')
def salary_dashboard():
    df_gaji, df_pph = get_cached_data()
    df_gaji = apply_filters(df_gaji, "periode")
    df_pph  = apply_filters(df_pph,  "periode")
    kpi = calculate_kpi(df_gaji, df_pph)

    # Gaji per project
    gaji_project = df_gaji.groupby('project')['gaji'].sum().reset_index().sort_values('gaji', ascending=False)

    # Gaji trend
    gaji_trend = df_gaji.groupby('periode')['gaji'].sum().reset_index()
    gaji_trend['_s'] = pd.to_datetime(gaji_trend['periode'], format='%b %Y')
    gaji_trend = gaji_trend.sort_values('_s').drop('_s', axis=1)

    # PPh per project
    pph_project = df_pph.groupby('project')['pph21'].sum().reset_index().sort_values('pph21', ascending=False)

    # PPh trend
    pph_trend = df_pph.groupby('periode')['pph21'].sum().reset_index()
    pph_trend['_s'] = pd.to_datetime(pph_trend['periode'], format='%b %Y')
    pph_trend = pph_trend.sort_values('_s').drop('_s', axis=1)

    return jsonify({
        "kpi": kpi,
        "gaji_project": gaji_project.to_dict(orient='records'),
        "gaji_trend": gaji_trend.to_dict(orient='records'),
        "pph_project": pph_project.to_dict(orient='records'),
        "pph_trend": pph_trend.to_dict(orient='records')
    })