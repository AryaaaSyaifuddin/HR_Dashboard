# routes/overtime_routes.py
import pandas as pd
from flask import Blueprint, jsonify

from core.cache_manager import cached_load
from config import CACHE_TTL
from modules.overtime import load_data, apply_filters

overtime_bp = Blueprint('overtime', __name__)

def get_cached_data():
    return cached_load(load_data, 'overtime', CACHE_TTL)

@overtime_bp.route('/dashboard')
def overtime_dashboard():
    df_ot, df_abs, df_cost = get_cached_data()
    df_ot, df_abs, df_cost = apply_filters(df_ot, df_abs, df_cost)

    # KPI
    avg_ot_pct  = df_ot['overtime'].mean() * 100 if not df_ot.empty else 0
    avg_abs_pct = df_abs['absensi'].mean() * 100 if not df_abs.empty else 0
    t_cost      = df_cost['total_cost'].sum()
    t_ot_cost   = df_cost['overtime_cost'].sum()

    m_ov = df_ot.groupby(df_ot['bulan'].dt.to_period('M'))['overtime'].mean().sort_index()
    ov_g = round(((m_ov.iloc[-1] - m_ov.iloc[-2]) / m_ov.iloc[-2]) * 100, 2) if len(m_ov) >= 2 else 0

    m_at = df_abs.groupby(df_abs['periode'].dt.to_period('M'))['absensi'].mean().sort_index()
    at_g = round(((m_at.iloc[-1] - m_at.iloc[-2]) / m_at.iloc[-2]) * 100, 2) if len(m_at) >= 2 else 0

    kpi = {
        "avg_overtime_percent": round(avg_ot_pct, 2),
        "avg_absensi_percent": round(avg_abs_pct, 2),
        "total_cost": int(t_cost),
        "total_overtime_cost": int(t_ot_cost),
        "overtime_growth": ov_g,
        "absensi_growth": at_g
    }

    # Overtime summary (rata-rata per bulan)
    ov_sum = df_ot.groupby(df_ot['bulan'].dt.strftime('%b %Y'))['overtime'].mean().reset_index()
    ov_sum.columns = ['bulan', 'overtime']
    ov_sum['overtime'] = ov_sum['overtime'].round(4)
    ov_sum = ov_sum.sort_values('bulan', key=lambda x: pd.to_datetime(x, format='%b %Y'))

    # Attendance summary
    at_sum = df_abs.groupby(df_abs['periode'].dt.strftime('%b %Y'))['absensi'].mean().reset_index()
    at_sum.columns = ['bulan', 'absensi']
    at_sum['absensi'] = at_sum['absensi'].round(4)
    at_sum = at_sum.sort_values('bulan', key=lambda x: pd.to_datetime(x, format='%b %Y'))

    # Overtime by project
    ov_proj = df_ot.groupby('project')['overtime'].mean().reset_index()
    ov_proj['overtime_percent'] = (ov_proj['overtime'] * 100).round(2)
    ov_proj = ov_proj.sort_values('overtime_percent', ascending=False)

    # Cost by project
    cp = df_cost.groupby('project').agg(
        total_cost=('total_cost', 'sum'),
        overtime_cost=('overtime_cost', 'sum'),
        overtime_percent=('overtime_percent', 'mean')
    ).reset_index()
    for c in ['total_cost', 'overtime_cost', 'overtime_percent']:
        cp[c] = cp[c].round(2)

    top5 = cp.nlargest(5, 'overtime_cost')[['project', 'overtime_cost']].round(2)

    # Overtime cost trend
    ct = df_cost.groupby(df_cost['bulan'].dt.strftime('%b %Y'))['overtime_cost'].sum().reset_index()
    ct.columns = ['bulan', 'overtime_cost']
    ct['overtime_cost'] = ct['overtime_cost'].round(2)
    ct = ct.sort_values('bulan', key=lambda x: pd.to_datetime(x, format='%b %Y'))

    return jsonify({
        "kpi": kpi,
        "overtime_summary": ov_sum.to_dict(orient='records'),
        "attendance_summary": at_sum.to_dict(orient='records'),
        "overtime_by_project": ov_proj.to_dict(orient='records'),
        "cost_by_project": cp.to_dict(orient='records'),
        "top_cost_projects": top5.to_dict(orient='records'),
        "overtime_cost_trend": ct.to_dict(orient='records')
    })