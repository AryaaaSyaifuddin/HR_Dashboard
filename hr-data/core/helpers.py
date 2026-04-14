# core/helpers.py
import pandas as pd
from datetime import datetime, timedelta

# ============================================
# DATA CLEANING HELPERS
# ============================================

def clean_number(x):
    """
    Membersihkan string angka dengan format Rp atau pemisah ribuan.
    Digunakan di loader Overtime.
    """
    if pd.isna(x):
        return None
    if isinstance(x, (int, float)):
        return float(x)
    
    s = str(x).strip()
    # Hapus 'Rp' dan spasi
    s = s.replace('Rp', '').replace(' ', '')
    
    # Tangani pemisah ribuan dan desimal
    if '.' in s and ',' in s:
        # Format Indonesia: 1.234,56 -> 1234.56
        s = s.replace('.', '').replace(',', '.')
    elif ',' in s:
        parts = s.split(',')
        # Jika koma sebagai pemisah ribuan (contoh: 1,234)
        if len(parts) > 1 and len(parts[-1]) <= 2 and '.' not in s:
            # Kemungkinan koma adalah desimal (misal 1234,56)
            s = s.replace(',', '.')
        else:
            # Koma sebagai pemisah ribuan, hapus saja
            s = s.replace(',', '')
    elif '.' in s and s.count('.') > 1:
        # Titik sebagai pemisah ribuan, hapus
        s = s.replace('.', '')
    
    try:
        return float(s)
    except ValueError:
        return None


def clean_uang_bpjs(x):
    """
    Membersihkan nilai pembayaran BPJS / MCU yang mungkin berformat 'Rp 1.000.000'.
    Digunakan di loader BPJS dan MCU.
    """
    if isinstance(x, (int, float)):
        return int(x) if pd.notna(x) else None
    
    s = str(x).strip()
    s = s.replace('Rp', '').replace(' ', '').replace('.', '')
    if ',' in s:
        s = s.split(',')[0]   # Buang desimal
    try:
        return int(s)
    except ValueError:
        return None


def safe_float_percent(v):
    """
    Mengkonversi string persentase atau angka ke float.
    Digunakan di loader KPI (fungsi sf).
    """
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return None
    s = str(v).replace('%', '').strip()
    if s in ('nan', 'NaN', ''):
        return None
    try:
        return round(float(s), 4)
    except ValueError:
        return None


def json_safe_records(df):
    """
    Mengubah DataFrame menjadi list of dict yang aman untuk JSON.
    Mengganti NaN, Inf, -Inf menjadi None.
    (Sebenarnya Flask jsonify sudah menangani, tapi fungsi ini bisa dipakai jika perlu kontrol lebih)
    """
    cleaned = df.copy()
    cleaned = cleaned.replace([float('inf'), float('-inf')], pd.NA)
    # Konversi ke object lalu ganti NaN/NaT dengan None
    cleaned = cleaned.astype(object).where(pd.notna(cleaned), None)
    return cleaned.to_dict(orient='records')


def parse_date_series(series, dayfirst=False, errors='coerce'):
    """
    Wrapper untuk pd.to_datetime dengan opsi default sering dipakai.
    """
    return pd.to_datetime(series, dayfirst=dayfirst, errors=errors)


def get_month_year_str(dt_series):
    """
    Mengubah kolom datetime menjadi string 'Bulan Tahun' (contoh: 'January 2026')
    """
    return dt_series.dt.strftime('%B %Y')


def get_short_month_year_str(dt_series):
    """
    Mengubah kolom datetime menjadi string 'SingkatanBulan Tahun' (contoh: 'Jan 2026')
    """
    return dt_series.dt.strftime('%b %Y')


def calculate_date_range_today_delta(days=14):
    """
    Mengembalikan (today, today + timedelta(days)).
    Berguna untuk filter 'akan_berakhir'.
    """
    today = pd.to_datetime(datetime.today().date())
    future = today + timedelta(days=days)
    return today, future