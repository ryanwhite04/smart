import os
import uuid

from flask import Flask
from flask_login import LoginManager
from flask_migrate import Migrate
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy

from sqlalchemy.sql import func

login = LoginManager()
db = SQLAlchemy()
migrate = Migrate()
socketio = SocketIO()


username_pattern = r'^[a-zA-Z0-9_]+$'
password_pattern = r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$'
password_requirements = 'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character @$!%*?&.'


def create_app(config_env='development'):
    app = Flask(__name__)
#    app.config.from_object(config_dict[config_env])
    app.config['SQLALCHEMY_DATABASE_URI'] =  os.environ['SQLALCHEMY_DATABASE_URI']
    app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY')

    register_extensions(app)
    register_blueprints(app)

    with app.app_context():
        # upgrade pending database migrations
        #_upgrade()

        # create admin for empty database
        db.create_all()
        from app.models import User
        from app.models import Teacher 
        from app.models import Student
        from app.models import Class
        from app.models import ClassTeacher
        from app.models import ClassStudent
        from app.models import Test
        from app.models import Question
        from app.models import Answer
        from app.models import StudentResponse
        if len(User.query.all()) == 0:
            print( 'Creating default user, please change the password.' )
            a = User(username='admin', is_admin=True)
            a.set_password( 'Adminadmin1!' )
            db.session.add(a)
            db.session.flush()
            print( 'Creating test teachers' )
            t1 = Teacher(id = "cce77604cea14f2e87e83f70ac3d4e42", name='Joe', surname='Blogs')
            db.session.add(t1)
            db.session.flush()
            t2 = Teacher(id = "548714b117f945eb832e9c0249c89a72", name='Jody', surname='Vlogs')
            db.session.add(t2)
            db.session.flush()
            print( 'Creating test class' )
            c1 = Class(id = "4affd421e12842ca9580f015b98d245c", name='Test Class')
            db.session.add(c1)
            db.session.flush()
            ct1 = ClassTeacher(id = uuid.uuid4().hex, teacher_id = t1.id, class_id = c1.id )
            db.session.add(ct1)
            db.session.flush()
            c2 = Class(id = "714c5682f8144643a064e324b9c10c9b", name='Test Class 2')
            db.session.add(c2)
            db.session.flush()
            ct2 = ClassTeacher(id = uuid.uuid4().hex, teacher_id = t2.id, class_id = c2.id )
            db.session.add(ct2)
            db.session.flush()
            
            db.session.commit()

    return app

def register_extensions(app):
    db.init_app(app)
    login.init_app(app)
    login.login_view = 'main.login'
    migrate.init_app(app, db)
    socketio.init_app(app)
    return None

def register_blueprints(app):
    from .main import bp
    app.register_blueprint(bp)
    return None




