# core/cache_manager.py
import time
import pandas as pd

# ============================================
# SIMPLE IN-MEMORY CACHE
# ============================================
_cache = {}
_cache_time = {}

def cached_load(loader_func, cache_key, ttl):
    """
    Mengembalikan data dari cache jika masih valid (belum melewati ttl),
    jika tidak, panggil loader_func dan simpan hasilnya ke cache.

    Args:
        loader_func (callable): Fungsi tanpa argumen yang me-load data.
        cache_key (str): Kunci unik untuk data di cache.
        ttl (int): Time-to-live dalam detik.

    Returns:
        DataFrame atau tuple of DataFrames (sudah di-copy).
    """
    now = time.time()
    
    # Cek cache
    if cache_key in _cache and (now - _cache_time.get(cache_key, 0)) < ttl:
        cached_data = _cache[cache_key]
        # Kembalikan salinan agar data asli di cache tidak termodifikasi
        if isinstance(cached_data, tuple):
            return tuple(item.copy() if hasattr(item, 'copy') else item for item in cached_data)
        else:
            return cached_data.copy() if hasattr(cached_data, 'copy') else cached_data

    # Muat data baru
    data = loader_func()
    _cache[cache_key] = data
    _cache_time[cache_key] = now

    # Kembalikan salinan
    if isinstance(data, tuple):
        return tuple(item.copy() if hasattr(item, 'copy') else item for item in data)
    else:
        return data.copy() if hasattr(data, 'copy') else data


def invalidate_cache(cache_key=None):
    """
    Menghapus cache. Jika cache_key tidak diberikan, hapus semua cache.
    """
    global _cache, _cache_time
    if cache_key:
        if cache_key in _cache:
            del _cache[cache_key]
            del _cache_time[cache_key]
    else:
        _cache.clear()
        _cache_time.clear()