# app.py
# ============================================
# ENTRY POINT FLASK - VERSI MODULAR (GABUNGAN PER MODUL)
# ============================================

from flask import Flask
from flask_cors import CORS
from flask_compress import Compress

# -------------------------------------------------------------------
# IMPORT SEMUA BLUEPRINT DARI FOLDER routes/
# (Asumsi: setiap file route mendefinisikan blueprint dengan nama *_bp)
# -------------------------------------------------------------------
from routes.internship_routes import internship_bp
from routes.manpower_routes import manpower_bp
from routes.recruitment_routes import recruitment_bp
from routes.salary_routes import salary_bp
from routes.training_routes import training_bp
from routes.bpjs_routes import bpjs_bp
from routes.overtime_routes import overtime_bp
from routes.mcu_routes import mcu_bp
from routes.kpi_routes import kpi_bp


def create_app():
    """
    Factory function untuk membuat instance Flask.
    Pola ini memudahkan testing dan deployment.
    """
    app = Flask(__name__)
    
    # Middleware
    CORS(app)
    Compress(app)   # Kompresi gzip untuk response
    
    # -----------------------------------------------------------------
    # REGISTER BLUEPRINT (URL Prefix sesuai dengan endpoint sebelumnya)
    # -----------------------------------------------------------------
    app.register_blueprint(internship_bp, url_prefix='/internship')
    app.register_blueprint(manpower_bp, url_prefix='/manpower')
    app.register_blueprint(recruitment_bp, url_prefix='/recruitment')
    app.register_blueprint(salary_bp, url_prefix='/salary')
    app.register_blueprint(training_bp, url_prefix='/training')
    app.register_blueprint(bpjs_bp, url_prefix='/bpjs')
    app.register_blueprint(overtime_bp, url_prefix='/overtime')
    app.register_blueprint(mcu_bp, url_prefix='/mcu')
    app.register_blueprint(kpi_bp, url_prefix='/kpi')
    
    return app


# -------------------------------------------------------------------
# JALANKAN APLIKASI
# -------------------------------------------------------------------
if __name__ == "__main__":
    app = create_app()
    
    # OPSIONAL: Preload semua data ke cache saat server start
    # (Implementasi preload bisa ditambahkan nanti)
    # from core.cache_manager import ...
    # with app.app_context():
    #     preload_all_data()
    
    # Jalankan server Flask
    # debug=True hanya untuk development. Untuk production gunakan Gunicorn.
    app.run(debug=True, threaded=True)