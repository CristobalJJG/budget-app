from flask import Flask, jsonify
from config import Config
from db import db, ma, jwt
from sqlalchemy import create_engine, text
from routes.auth import auth_bp
from routes.categories import categories_bp
from routes.services import services_bp
from routes.transactions import transactions_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    ma.init_app(app)
    jwt.init_app(app)

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(categories_bp, url_prefix="/api/categories")
    app.register_blueprint(services_bp, url_prefix="/api/services")
    app.register_blueprint(transactions_bp, url_prefix="/api/transactions")

    @app.route("/")
    def index():
        return jsonify({"msg": "Budget Python backend running"})

    with app.app_context():
        # If configured to use MySQL/MariaDB, ensure the database exists (same env vars as JS backend)
        db_name = app.config.get('DB_NAME')
        if db_name and app.config.get('SQLALCHEMY_DATABASE_URI', '').startswith('mysql'):
            user = app.config.get('DB_USER')
            pwd = app.config.get('DB_PASSWORD')
            host = app.config.get('DB_HOST', 'localhost')
            port = app.config.get('DB_PORT', '3306')
            admin_uri = f"mysql+pymysql://{user}:{pwd}@{host}:{port}/"
            try:
                engine = create_engine(admin_uri)
                with engine.connect() as conn:
                    conn.execute(text(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"))
            except Exception:
                pass

        db.create_all()

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
