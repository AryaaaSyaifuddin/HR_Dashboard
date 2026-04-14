# routes/bpjs_routes.py
import pandas as pd
from flask import Blueprint, jsonify

from core.cache_manager import cached_load
from config import CACHE_TTL
from modules.bpjs import load_data, apply_filters, calculate_kpi

bpjs_bp = Blueprint('bpjs', __name__)

def get_cached_data():
    return cached_load(load_data, 'bpjs', CACHE_TTL)

@bpjs_bp.route('/dashboard')
def bpjs_dashboard():
    df_k, df_kes, df_perm, df_bor = get_cached_data()
    df_k, df_kes, df_perm, df_bor = apply_filters(df_k, df_kes, df_perm, df_bor)
    kpi = calculate_kpi(df_kes, df_perm, df_bor, df_k)

    jenis = df_k['jenis_bpjs'].value_counts().reset_index()
    jenis.columns = ['jenis_bpjs', 'jumlah']

    project = df_k['project'].value_counts().reset_index()
    project.columns = ['project', 'jumlah']

    def mk_trend(df, label):
        d = df.copy()
        d['ps'] = d['periode'].dt.strftime('%Y-%m')
        t = d.groupby('ps')['pembayaran'].sum().reset_index()
        t.columns = ['periode', 'pembayaran']
        t['pembayaran'] = t['pembayaran'].astype(int)
        t['kategori'] = label
        return t

    trend = pd.concat([
        mk_trend(df_kes, 'kesehatan'),
        mk_trend(df_perm, 'tk_permanent'),
        mk_trend(df_bor, 'tk_borongan')
    ])

    return jsonify({
        "kpi": kpi,
        "jenis": jenis.to_dict(orient='records'),
        "project": project.to_dict(orient='records'),
        "trend": trend.to_dict(orient='records')
    })