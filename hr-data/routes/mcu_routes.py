# routes/mcu_routes.py
import pandas as pd
from flask import Blueprint, jsonify

from core.cache_manager import cached_load
from config import CACHE_TTL
from modules.mcu import load_data, apply_filters, calculate_kpi

mcu_bp = Blueprint('mcu', __name__)

def get_cached_data():
    return cached_load(load_data, 'mcu', CACHE_TTL)

@mcu_bp.route('/dashboard')
def mcu_dashboard():
    df_mcu, df_karyawan, df_pay = get_cached_data()
    df_full = pd.merge(df_mcu, df_karyawan, on="nama", how="left")
    df_full, df_pay = apply_filters(df_full, df_pay)
    kpi = calculate_kpi(df_full, df_pay)

    hasil = df_full['hasil_mcu'].value_counts().reset_index()
    hasil.columns = ['hasil', 'jumlah']

    divisi = df_full['divisi'].value_counts().reset_index()
    divisi.columns = ['divisi', 'jumlah']

    project = df_full['project'].value_counts().reset_index()
    project.columns = ['project', 'jumlah']

    gender = df_full['gender'].value_counts().reset_index()
    gender.columns = ['gender', 'jumlah']

    trend = df_full['bulan'].value_counts().reset_index()
    trend.columns = ['bulan', 'jumlah']
    trend['_s'] = pd.to_datetime(trend['bulan'], format='%b %Y', errors='coerce')
    trend = trend.sort_values('_s').drop('_s', axis=1)

    cost_project = df_pay.groupby('project')['pembayaran'].sum().reset_index()
    cost_trend = df_pay.groupby('periode')['pembayaran'].sum().reset_index()
    cost_trend['_s'] = pd.to_datetime(cost_trend['periode'], format='%b %Y', errors='coerce')
    cost_trend = cost_trend.sort_values('_s').drop('_s', axis=1)

    top_project = cost_project.sort_values('pembayaran', ascending=False).head(5)

    return jsonify({
        "kpi": kpi,
        "hasil_mcu": hasil.to_dict(orient='records'),
        "divisi": divisi.to_dict(orient='records'),
        "project": project.to_dict(orient='records'),
        "trend": trend.to_dict(orient='records'),
        "gender": gender.to_dict(orient='records'),
        "cost_project": cost_project.to_dict(orient='records'),
        "cost_trend": cost_trend.to_dict(orient='records'),
        "top_project": top_project.to_dict(orient='records')
    })