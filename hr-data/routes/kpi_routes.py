# routes/kpi_routes.py
from flask import Blueprint, jsonify

from core.cache_manager import cached_load
from config import CACHE_TTL
from modules.kpi import load_data, apply_filters, calculate_summary

kpi_bp = Blueprint('kpi', __name__)

def get_cached_data():
    return cached_load(load_data, 'kpi', CACHE_TTL)

@kpi_bp.route('/dashboard')
def kpi_dashboard():
    kpi_definitions, monthly_2026 = get_cached_data()
    filtered = apply_filters(monthly_2026)
    summary = calculate_summary(filtered)

    # KPI list dengan detail per definisi
    kpi_list = []
    for defn in kpi_definitions:
        rows_kpi = [r for r in monthly_2026 if r['no'] == defn['no']]
        rows_ada = [r for r in rows_kpi if r['actual'] is not None]
        rows_ok  = [r for r in rows_ada if r['status'] == 'tercapai']
        kpi_list.append({
            "no":              defn['no'],
            "kpi":             defn['kpi'],
            "unit":            defn['unit'],
            "target_desc":     defn['target_desc'],
            "is_lower_better": defn['is_lower_better'],
            "bulan_ada":       len(rows_ada),
            "bulan_ok":        len(rows_ok),
            "pct_tercapai":    round(len(rows_ok) / len(rows_ada) * 100, 1) if rows_ada else 0,
            "monthly":         rows_kpi
        })

    # Status trend per bulan
    sm = {}
    for r in monthly_2026:
        b = r['bulan']
        if b not in sm:
            sm[b] = {"bulan": b, "tercapai": 0, "tidak_tercapai": 0, "total": 0}
        sm[b]['total'] += 1
        if r['status'] == 'tercapai':
            sm[b]['tercapai'] += 1
        elif r['status'] == 'tidak_tercapai':
            sm[b]['tidak_tercapai'] += 1
    status_trend = sorted(sm.values(), key=lambda x: x['bulan'])

    bulan_options = sorted(list({r['bulan'] for r in monthly_2026 if r['bulan']}))

    return jsonify({
        "summary":       summary,
        "kpi_list":      kpi_list,
        "monthly_2026":  filtered,
        "status_trend":  status_trend,
        "bulan_options": bulan_options
    })