#!/usr/bin/bash
export SQLALCHEMY_DATABASE_URI="sqlite:///./app.db"
export FLASK_SECRET_KEY="YOUR_SECRET_KEY"
export FLASK_APP="run.py"
flask run --port=5003 --host=0.0.0.0
