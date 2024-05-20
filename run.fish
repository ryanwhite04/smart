set -x SQLALCHEMY_DATABASE_URI "sqlite:///./app.db"
set -x FLASK_SECRET_KEY "YOUR_SECRET_KEY"
set -x FLASK_APP "run.py"
set -x FLASK_DEBUG 1
python -m flask run --port=5000