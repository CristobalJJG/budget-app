# Back_py

Backend rewrite minimal en Flask para replicar funcionalidades del backend original.

Quick start:

```
cd Back_py
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py   # or use gunicorn as in Dockerfile
```

Endpoints (prefijo `/api`):
- `/api/auth/register` POST
- `/api/auth/login` POST
- `/api/categories` CRUD
- `/api/services` CRUD
- `/api/transactions` CRUD

DB por defecto: `sqlite:///budget_py.db`.
