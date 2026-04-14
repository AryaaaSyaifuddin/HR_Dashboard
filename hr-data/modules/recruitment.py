# modules/recruitment.py
import pandas as pd
from flask import request

from config import FILE_PATH
from core.helpers import parse_date_series, get_month_year_str

# LOADER
def load_data():
    try:
        print("\n" + "="*50)
        print("🔍 LOADING RECRUITMENT DATA...")
        print("="*50)
        
        xl = pd.ExcelFile(FILE_PATH)
        all_sheets = xl.sheet_names
        recruitment_sheets = [s for s in all_sheets if 'recruitment' in s.lower()]
        
        print(f"📋 Found {len(recruitment_sheets)} recruitment sheet(s):")
        for i, sheet in enumerate(recruitment_sheets, 1):
            print(f"   {i}. {sheet}")
        
        if not recruitment_sheets:
            print("⚠️ WARNING: No recruitment sheets found!")
            return pd.DataFrame(columns=["nama", "posisi", "periode", "status", "source_sheet"])
        
        df_list = []
        total_rows = 0
        
        for sheet in recruitment_sheets:
            try:
                df = pd.read_excel(FILE_PATH, sheet_name=sheet, usecols="B:E")
                if df.empty:
                    print(f"   ⚠️ Sheet '{sheet}' is empty, skipping...")
                    continue
                df.columns = ["nama", "posisi", "periode", "status"]
                df['source_sheet'] = sheet
                
                df = df.dropna(subset=['nama', 'posisi'], how='all')
                df['nama'] = df['nama'].astype(str).str.strip()
                df = df[df['nama'] != 'nan']
                
                rows_loaded = len(df)
                total_rows += rows_loaded
                df_list.append(df)
                
                print(f"   ✅ Loaded {rows_loaded:4d} rows from '{sheet}'")
                
            except Exception as e:
                print(f"   ❌ Error loading sheet '{sheet}': {str(e)[:50]}...")
                continue
        
        if not df_list:
            print("❌ No valid data loaded from any sheet!")
            return pd.DataFrame(columns=["nama", "posisi", "periode", "status", "source_sheet"])
        
        df = pd.concat(df_list, ignore_index=True)
        print(f"\n📊 Total rows before cleaning: {total_rows}")
        
        df['posisi'] = df['posisi'].astype(str).str.strip()
        df['posisi'] = df['posisi'].replace(['nan', 'NaN', ''], pd.NA)
        
        df['status'] = df['status'].astype(str).str.strip().str.lower()
        df['status'] = df['status'].replace({
            'on process user': 'on process',
            'on process hr': 'on process',
            'nan': pd.NA,
            '': pd.NA
        })
        
        df['periode'] = parse_date_series(df['periode'])
        df['bulan'] = get_month_year_str(df['periode'])
        
        df = df.dropna(subset=['nama'])
        df = df[df['nama'] != '']
        
        print(f"📊 Total rows after cleaning: {len(df)}")
        print(f"📅 Date range: {df['periode'].min()} to {df['periode'].max()}")
        print(f"💼 Unique positions: {df['posisi'].nunique()}")
        print(f"📌 Status distribution: {dict(df['status'].value_counts())}")
        print("="*50 + "\n")
        
        return df
        
    except Exception as e:
        print(f"❌ ERROR LOAD RECRUITMENT: {e}")
        import traceback
        traceback.print_exc()
        return pd.DataFrame(columns=["nama", "posisi", "periode", "status", "source_sheet"])

# FILTER
def apply_filters(df):
    s  = request.args.get("status")
    p  = request.args.get("posisi")
    st = request.args.get("start")
    en = request.args.get("end")
    if s:  df = df[df['status'] == s.lower()]
    if p:  df = df[df['posisi'] == p]
    if st and en:
        df = df[(df['periode'] >= pd.to_datetime(st)) & (df['periode'] <= pd.to_datetime(en))]
    return df

# KPI CALCULATOR
def calculate_kpi(df):
    if df.empty:
        return {"total": 0, "accepted": 0, "rejected": 0, "on_process": 0}
    return {
        "total": len(df),
        "accepted": len(df[df['status'] == 'accepted']),
        "rejected": len(df[df['status'] == 'rejected']),
        "on_process": len(df[df['status'] == 'on process'])
    }