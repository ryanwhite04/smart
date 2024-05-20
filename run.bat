
set SQLALCHEMY_DATABASE_URI=sqlite:///./app.db

set FLASK_SECRET_KEY="YOUR_SECRET_KEY"
set FLASK_APP=run.py
flask run --port=5003 --host=0.0.0.0
