import functools
import os
import uuid
from datetime import datetime, timedelta
import json
import dateutil
from dateutil import parser

from flask import current_app, flash, jsonify, redirect, render_template, request, session, url_for, Response
from flask_login import current_user, login_required, login_user, logout_user
from flask_socketio import disconnect, emit, join_room, leave_room
from markupsafe import escape
from pytz import timezone
from sqlalchemy import func, and_
from sqlalchemy.orm import aliased

from app import db, login, password_requirements, socketio
from app.forms import AddUserForm, ChangeEmailForm, ChangePasswordForm, ChangeUsernameForm, LoginForm
from app.models import User, Teacher, Student, Class, Test, Question, Answer, StudentResponse, ClassTeacher, TestStudent

from . import bp



@login.user_loader
def load_user(id):
    return User.query.get(int(id))

def root_dir():  # pragma: no cover
    return os.path.abspath(os.path.dirname(__file__))


def get_file(filename):  # pragma: no cover
    try:
        src = os.path.join(root_dir(), filename)
        # Figure out how flask returns static files
        # Tried:
        # - render_template
        # - send_file
        # This should not be so non-obvious
        return open(src).read()
    except IOError as exc:
        return str(exc)
    

@bp.route('/classroom/<path:path>', methods=['GET'])
def get_resource(path):  # pragma: no cover
    mimetypes = {
        ".css": "text/css",
        ".html": "text/html",
        ".js": "application/javascript",
    }
    complete_path = os.path.join(root_dir(), "../../public/" + path)
    ext = os.path.splitext("../../public/" + path)[1]
    mimetype = mimetypes.get(ext, "text/html")
    content = get_file(complete_path)
    return Response(content, mimetype=mimetype)



@bp.route('/dashboard/', methods=['GET'])
def dashboard():
    teachers = [{"id": teacher.id, "name": teacher.name} for teacher in Teacher.query.all()]
    classes = [{"id": cls.id, "name": cls.name} for cls in Class.query.all()]
    students = [{"id": student.id, "name": student.name} for student in Student.query.all()]

    return render_template('dashboard.html', title='Dashboard', 
                           teachers=teachers, classes=classes, students=students)



#
# REST API route: /dashboard/teacher/
# Method: POST
# MIME Type: JSON
# JSON Structure:
# {
#     "teacher_id": string, uuid
#     "start_time": time string, ISO 8601
#     "end_time": time string, ISO 8601
# }
# Returns: JSON data.  200 on completion.  400 on error.
# {
#     "teacher_id": string, uuid
#     "start_time": time string, ISO 8601
#     "end_time": time string, ISO 8601
#     "tests":
#     [
#         { 
#             "test_id": uuid, 
#             "class_name": string
#             "name": string
#             "date_taken": time string
#             "overall_accuracy": float
#             "overall_participation": float
#             "total_students": integer
#             "total_questions": integer
#         },
#         ...
#     ]
# }
#
@bp.route('/dashboard/teacher/', methods=['POST'])
def dashboard_teacher():
    # Check if request contains JSON data
    if not request.is_json:
        return jsonify({"error": "Request must contain JSON data"}), 400

    # Parse JSON data from request
    json_data = request.get_json()

    # Check if JSON data contains required fields
    if 'teacher_id' not in json_data or 'start_time' not in json_data or 'end_time' not in json_data:
        return jsonify({"error": "JSON data must contain 'teacher_id', 'start_time' and 'end_time' fields"}), 400

    teacher = Teacher.query.filter_by(id=json_data['teacher_id']).first()

    if teacher is None:
        return jsonify({"error": "No teacher found for teacher_id " +json_data['teacher_id']}), 400
 
    classes = ClassTeacher.query.filter_by(teacher_id=json_data['teacher_id']).all()

    json_data['tests'] = []

    for cls in classes:
        tests = Test.query.filter_by(class_id=cls.class_id).filter(Test.date_taken.between(dateutil.parser.isoparse(json_data['start_time']), dateutil.parser.isoparse(json_data['end_time']))).all()
        for test in tests:
            cls = Class.query.filter_by(id=test.class_id).first()
            total_students = TestStudent.query.filter_by(test_id=test.id).count()
            total_questions = Question.query.filter_by(test_id=test.id).count()
            max_num_of_responses = db.session.query(Question).filter_by(test_id=test.id).count()
            overall_accuracy = db.session.query(StudentResponse, Answer, Question).join(StudentResponse.answer).join(Answer.question).filter_by(test_id=test.id).filter(Answer.is_correct==True).count()/max_num_of_responses
            overall_participation = db.session.query(StudentResponse, Answer, Question).join(StudentResponse.answer).join(Answer.question).filter_by(test_id=test.id).count()/max_num_of_responses
            test_record = { 
                "test_id": test.id, 
                "class_name": cls.name, 
                "name": test.name, 
                "date_taken": test.date_taken,
                "student_accuracy": overall_accuracy,
                "student_participation": overall_participation,
                "total_students": str(total_students),
                "total_questions": str(total_questions)
                }
            json_data['tests'].append(test_record)
    
    return json_data, 200

#
# REST API route: /dashboard/class/
# Method: POST
# MIME Type: JSON
# JSON Structure:
# {
#     "class_id": string, uuid
#     "start_time": time string, ISO 8601
#     "end_time": time string, ISO 8601
# }
# Returns: JSON data.  200 on completion.  400 on error.
# {
#     "class_id": string, uuid
#     "start_time": time string, ISO 8601
#     "end_time": time string, ISO 8601
#     "tests":
#     [
#         { 
#             "test_id": uuid, 
#             "class_name": string
#             "name": string
#             "date_taken": time string
#             "overall_accuracy": float
#             "overall_participation": float
#             "total_students": integer
#             "total_questions": integer
#         },
#         ...
#     ]
# }
#
@bp.route('/dashboard/class/', methods=['POST'])
def dashboard_class():
    # Check if request contains JSON data
    if not request.is_json:
        return jsonify({"error": "Request must contain JSON data"}), 400

    # Parse JSON data from request
    json_data = request.get_json()

    # Check if JSON data contains required fields
    if 'class_id' not in json_data or 'start_time' not in json_data or 'end_time' not in json_data:
        return jsonify({"error": "JSON data must contain 'class_id', 'start_time' and 'end_time' fields"}), 400

    cls = Class.query.filter_by(id=json_data['class_id']).first()

    if cls is None:
        return jsonify({"error": "No class found for class_id " +json_data['class_id']}), 400
 
    json_data['tests'] = []
    tests = Test.query.filter_by(class_id=json_data['class_id']).filter(Test.date_taken.between(dateutil.parser.isoparse(json_data['start_time']), dateutil.parser.isoparse(json_data['end_time']))).all()

    for test in tests:
        total_students = TestStudent.query.filter_by(test_id=test.id).count()
        total_questions = Question.query.filter_by(test_id=test.id).count()
        max_num_of_responses = db.session.query(Question).filter_by(test_id=test.id).count() * total_students
        overall_accuracy = db.session.query(StudentResponse, Answer, Question).join(StudentResponse.answer).join(Answer.question).filter_by(test_id=test.id).filter(Answer.is_correct==True).count()/max_num_of_responses
        overall_participation = db.session.query(StudentResponse, Answer, Question).join(StudentResponse.answer).join(Answer.question).filter_by(test_id=test.id).count()/max_num_of_responses
        test_record = { 
            "test_id": test.id, 
            "class_name": cls.name, 
            "name": test.name, 
            "date_taken": test.date_taken,
            "overall_accuracy": overall_accuracy,
            "overall_participation": overall_participation,
            "total_students": str(total_students),
            "total_questions": str(total_questions)
            }
        json_data['tests'].append(test_record)
   
    return json_data, 200

#
# REST API route: /dashboard/student/
# Method: POST
# MIME Type: JSON
# JSON Structure:
# {
#     "student_id": string, uuid
#     "start_time": time string, ISO 8601
#     "end_time": time string, ISO 8601
# }
# Returns: JSON data.  200 on completion.  400 on error.
# {
#     "student_id": string, uuid
#     "start_time": time string, ISO 8601
#     "end_time": time string, ISO 8601
#     "tests":
#     [
#         { 
#             "test_id": uuid, 
#             "class_name": string
#             "name": string
#             "date_taken": time string
#             "student_accuracy": float
#             "student_participation": float
#             "total_questions": integer
#         },
#         ...
#     ]
# }
#
@bp.route('/dashboard/student/', methods=['POST'])
def dashboard_student():
    # Check if request contains JSON data
    if not request.is_json:
        return jsonify({"error": "Request must contain JSON data"}), 400

    # Parse JSON data from request
    json_data = request.get_json()

    # Check if JSON data contains required fields
    if 'student_id' not in json_data or 'start_time' not in json_data or 'end_time' not in json_data:
        return jsonify({"error": "JSON data must contain 'student_id', 'start_time' and 'end_time' fields"}), 400

    student = Student.query.filter_by(id=json_data['student_id']).first()

    if student is None:
        return jsonify({"error": "No student found for student_id " +json_data['student_id']}), 400
 
    json_data['tests'] = []
    test_students = TestStudent.query.filter_by(student_id=json_data['student_id'])

    for test_student in test_students:
        tests = Test.query.filter_by(id=test_student.test_id).filter(Test.date_taken.between(dateutil.parser.isoparse(json_data['start_time']), dateutil.parser.isoparse(json_data['end_time']))).all()
        for test in tests:
            cls = Class.query.filter_by(id=test.class_id).first()
            total_students = TestStudent.query.filter_by(test_id=test_student.test_id).count()
            total_questions = Question.query.filter_by(test_id=test_student.test_id).count()
            max_num_of_responses = db.session.query(Question).filter_by(test_id=test_student.test_id).count()
            overall_accuracy = db.session.query(StudentResponse, Answer, Question).join(StudentResponse.answer).join(Answer.question).filter(StudentResponse.student_id==test_student.student_id).filter_by(test_id=test_student.test_id).filter(Answer.is_correct==True).count()/max_num_of_responses
            overall_participation = db.session.query(StudentResponse, Answer, Question).join(StudentResponse.answer).join(Answer.question).filter(StudentResponse.student_id==test_student.student_id).filter_by(test_id=test_student.test_id).count()/max_num_of_responses
            test_record = { 
                "test_id": test_student.test_id, 
                "class_name": cls.name, 
                "name": test.name, 
                "date_taken": test.date_taken,
                "student_accuracy": overall_accuracy,
                "student_participation": overall_participation,
                "total_students": str(total_students),
                "total_questions": str(total_questions)
                }
            json_data['tests'].append(test_record)
    
    return json_data, 200

# root #################################################################################
@bp.route('/') # reroutes to about page
def root():
    return redirect(url_for('main.about'))

# student ###############################################################################
@bp.route('/student/list/', methods=['GET'])
def student_list():
    query = db.session.query(Student).all()

    # Convert the query result to a list of dictionaries
    result = [row.as_dict() for row in query]

    # Convert the list of dictionaries to JSON
    json_data = json.dumps(result, indent=4)

    return json_data, 200
@bp.route('/student/enrol/', methods=['POST'])
def student_enrol():
    return 200
@bp.route('/student/unenrol/', methods=['POST'])
def student_unenrol():
    return 200

# teacher ###############################################################################
@bp.route('/teacher/list/', methods=['GET'])
def teacher_list():
    query = db.session.query(Teacher).all()

    # Convert the query result to a list of dictionaries
    result = [row.as_dict() for row in query]

    # Convert the list of dictionaries to JSON
    json_data = json.dumps(result, indent=4)

    return json_data, 200
@bp.route('/teacher/mobilise/', methods=['POST'])
def teacher_mobilise():
    return 200
@bp.route('/teacher/demobilise/', methods=['POST'])
def teacher_demobilise():
    return 200

# class #################################################################################

#
# REST API route: /class/list/
# Method: GET
# MIME Type: None
# Returns: JSON data with class listing.  200 on completion.
#
@bp.route('/class/list/', methods=['GET'])
def class_list():
    query = db.session.query(Class).all()

    # Convert the query result to a list of dictionaries
    result = [row.as_dict() for row in query]

    # Convert the list of dictionaries to JSON
    json_data = json.dumps(result, indent=4, default=str)

    return json_data, 200

#
# REST API route: /class/create/
# Method: POST
# MIME Type: JSON
# JSON Structure:
# {
#     "class_id": string, uuid
#     "name": string, unique class name
#     "teacher_id": string, uuid, must reference existing Teacher
# }
# Returns: No data.  200 on completion.  400 on error.
#
@bp.route('/class/create/', methods=['POST'])
def class_create():
    # Check if request contains JSON data
    if not request.is_json:
        return jsonify({"error": "Request must contain JSON data"}), 400

    # Parse JSON data from request
    json_data = request.get_json()

    # Check if JSON data contains required fields
    if 'class_id' not in json_data or 'name' not in json_data or 'teacher_id' not in json_data:
        return jsonify({"error": "JSON data must contain 'id', 'name' and 'teacher_id' fields"}), 400

    c = Class(id=json_data['class_id'], name=json_data['name'] )
    db.session.add(c)
    db.session.commit()
    ct = ClassTeacher(id = uuid.uuid4().hex, teacher_id = json_data['teacher_id'], class_id = json_data['class_id'] )
    db.session.add(ct)
    db.session.commit()

    return jsonify("Database changes committed."), 200
@bp.route('/class/enrol_student/', methods=['POST'])
def class_enrol_student():
    return 200
@bp.route('/class/unenrol_student/', methods=['POST'])
def class_unenrol_student():
    return 200

# test #################################################################################

#
# REST API route: /test/list/
# Method: GET
# MIME Type: None
# Returns: JSON data with test listing.  200 on completion.
#
@bp.route('/test/list/', methods=['GET'])
def test_list():
    query = db.session.query(Test).all()

    # Convert the query result to a list of dictionaries
    result = [row.as_dict() for row in query]

    # Convert the list of dictionaries to JSON
    json_data = json.dumps(result, indent=4, default=str)

    return json_data, 200

# Function to convert JSON to SQLAlchemy objects
def json_to_sqlalchemy(json_data, parent_model_class, child_model_class):
    data = json.loads(json_data)

    parent_instance = parent_model_class(name=data['name'])

    for child_data in data.get('children', []):
        child_instance = child_model_class(name=child_data['name'])
        parent_instance.children.append(child_instance)

    return parent_instance

#
# REST API route: /test/create/
# Method: POST
# MIME Type: JSON
# JSON Structure:
# {
#     "test_id": string, uuid
#     "class_id": string, uuid
#     "name": string, unique class name
#     "students": 
#     [
#         { "id": uuid, "name": string, "surname": string },
#         ...
#     ]
#     "questions": 
#     [
#         {
#             "id": uuid, 
#             "text": string
#             "answers":
#             [
#                 {
#                     "id": uuid,
#                     "text": string,
#                     "is_correct": boolean
#                     "respondees": [ uuid, ]
#                 },
#             ]
#         },
#         ...
#     ]
# }
# Returns: No data.  200 on completion.  400 on error.
#
@bp.route('/test/record/', methods=['POST'])
def test_record():
    # Check if request contains JSON data
    if not request.is_json:
        print("JSON malformed")
        return jsonify({"error": "Request must contain JSON data"}), 400

    # Parse JSON data from request
    json_data = request.get_json()

    issues = ""

    if None != Test.query.filter_by(id=json_data['test_id']).first():
        print( "Test exists for id: " + json_data['test_id'] ) 
        return jsonify("Test exists for id: " + json_data['test_id']), 400
    elif 'test_id' in json_data and 'name' in json_data and 'class_id' in json_data and 'date_taken' in json_data:
        t = Test(id = json_data['test_id'], name=json_data['name'], class_id=json_data['class_id'], date_taken=datetime.fromisoformat(json_data['date_taken']))
        db.session.add(t)
        db.session.flush()
        print( "Added Test: " + json_data['test_id'] + ": " + "Name: " + json_data['name'] + " for class: " + json_data['class_id'] )
    else:
        print( "Missing elements for: " + json_data['test_id'] ) 
        return jsonify("Missing elements for: " + json_data['test_id']), 400

    students = json_data['students']
    for student in students:
        if 'id' in student and 'name' in student and 'surname' in student and None == Student.query.filter_by(id=student['id']).first():
            s = Student(id = student['id'], name=student['name'], surname=student['surname'])
            db.session.add(s)
            db.session.flush()
            print( "Adding Student: " + student['id'] + ": " + student['name'] + " " + student['surname'])
        else:
            print( "Not adding existing student: " + student['id'] + ": " + student['name'] + " " + student['surname'])
            issues += "Not adding existing student: " + student['id'] + ": " + student['name'] + " " + student['surname'] + '\n'

        if 'id' in student and 'name' in student and 'surname' in student:
            ts = TestStudent(id = uuid.uuid4().hex, test_id=json_data['test_id'], student_id=student['id'])
            db.session.add(ts)
            db.session.flush()
        

    questions = json_data['questions']
    for question in questions:
        if 'id' in question and 'text' in question and None == Question.query.filter_by(id=question['id']).first():
            q = Question(id = question['id'], text=question['text'], test_id=json_data['test_id'])
            db.session.add(q)
            db.session.flush()
        else:
            print( "Not adding question: " + question['id'] + " as it is malformed.")
            issues += "Not adding question: " + question['id'] + " as it is malformed.\n"
        
        answers = question['answers']
        for answer in answers:
            if 'id' in answer and 'text' in answer and 'is_correct' in answer and None == Answer.query.filter_by(id=answer['id']).first():
                a = Answer(id = answer['id'], question_id=question['id'], text=answer['text'], is_correct=answer['is_correct'])
                db.session.add(a)
                db.session.flush()

                for respondee in answer['respondees']:
                    sr = StudentResponse(student_id=respondee, answer_id=answer['id'], id=uuid.uuid4().hex)
                    db.session.add(sr)
                    db.session.flush()
            else:
                print( "Not adding answer: " + answer['id'] + " as it is malformed.")
                issues += "Not adding answer: " + answer['id'] + " as it is malformed.\n"

    print( "Committing database changes.")
    db.session.commit()

    if issues == "":
        return jsonify("Database changes committed."), 200
    else:
        return jsonify("Database changes committed.  Issues encountered: \n" + issues ), 200

@bp.route('/test/delete/<test_id>', methods=['POST'])
def test_delete(test_id):
    test = Test.query.filter_by(id=test_id).first()
    if test is None:
        return jsonify(""), 404
    else:
        db.session.delete(test)
    db.session.commit()
    return jsonify("Database changes committed."), 200


# Define a function to serialize SQLAlchemy objects to JSON
def serialize_sqlalchemy_object(obj):
    if not obj:
        return None
    serialized = {}
    for column in obj.__table__.columns:
        serialized[column.name] = getattr(obj, column.name)
    for relationship in obj.__mapper__.relationships:
        if relationship.lazy == 'select':
            related_objs = getattr(obj, relationship.key)
            if relationship.uselist:
                serialized[relationship.key] = [serialize_sqlalchemy_object(child) for child in related_objs]
            else:
                serialized[relationship.key] = serialize_sqlalchemy_object(related_objs)
    return serialized

@bp.route('/test/details', methods=['GET'])
def test_details():
    return 200

# about #################################################################################

@bp.route('/about/')
def about():
    return render_template('about.html', title='Clicker Admin - About')

def adjust_timestamp(timestamp, user_timezone):
    if user_timezone:
        user_tz = timezone(user_timezone)
        utc_tz = timezone('UTC')
        localized_timestamp = utc_tz.localize(timestamp.replace(tzinfo=None))
        adjusted_timestamp = localized_timestamp.astimezone(user_tz)
    else:
        adjusted_timestamp = timestamp
    return adjusted_timestamp

# from script on about page
@bp.route('/set_timezone/', methods=['POST'])
def set_timezone():
    session['timezone'] = request.form['timezone']
    return '', 204


# login / logout #######################################################################
@bp.route('/login/', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.lobby'))
    login_form = LoginForm(prefix='login_form')
    new_user_form = AddUserForm(prefix='new_user_form')
    if request.method == 'POST' and 'login_form-login' in request.form:
        if login_form.validate_on_submit():
            user = User.query.filter_by(username=login_form.username_login.data).first()
            if user is None:
                flash('Invalid username.', 'danger')
                return redirect(url_for('main.login'))
            if not user.check_password(login_form.password.data):
                flash('Invalid password.', 'danger')
                return redirect(url_for('main.login'))
            login_user(user)
            session['name'] = current_user.username
#            session['room'] = 'lobby'
            return redirect(url_for('main.about'))
        else:
            for field, errors in login_form.errors.items():
                for error in errors:
                    flash(f'{error}', 'danger')
                
    if request.method == 'POST' and 'new_user_form-register' in request.form:
        if new_user_form.validate_on_submit():
            user = User.query.filter_by(username=new_user_form.username_register.data).first()
            if user is not None:
                flash(' Username taken: Try another username.', 'danger')
                return redirect(url_for('main.login'))
            email = User.query.filter_by(email=new_user_form.email.data).first()
            if email is not None:
                flash('An account with the supplied email already exists.', 'danger')
                return redirect(url_for('main.login'))
            u = User(username=new_user_form.username_register.data, email=new_user_form.email.data, is_admin=False)
            u.set_password(new_user_form.new_password.data)
            db.session.add(u)
            db.session.commit()
            login_user(u)
            session['name'] = current_user.username
#            session['room'] = 'lobby'
            return redirect(url_for('main.about'))
        else:
            for field, errors in new_user_form.errors.items():
                for error in errors:
                    flash(f'{error}', 'danger')

    return render_template('login.html', title='Clicker Admin', login_form=login_form, new_user_form=new_user_form, password_requirements=password_requirements)


def get_user_list():
    return User.query.filter(User.username != 'Moderator').all()

@bp.route('/logout/')
@login_required
def logout():
    # Get the current time
    current_time = datetime.now()

    # Make the user inactive in the list a lot faster than timeout
    current_user.last_poll = (current_time - timedelta(seconds=60))
    db.session.commit()
    logout_user()
    flash('You have been logged out.', 'success')
    return redirect(url_for('main.login'))


# admin #######################################################################
@bp.route('/admin/', methods=['GET', 'POST'])
@login_required
def admin():
    if not current_user.is_authenticated:
        flash('Must login to view this page.', 'danger')
        return redirect(url_for('main.login'))
    # only accessible to admin
    if not current_user.is_admin:
        flash('You are not an admin.', 'danger')
        return redirect(url_for('main.profile'))
    new_user_form = AddUserForm(prefix='new_user_form')
    # add a user
    if request.method == 'POST' and 'new_user_form-register' in request.form: #and current_user.is_admin:
        if new_user_form.validate_on_submit():
            user = User.query.filter_by(username=new_user_form.username_register.data).first()
            if user is not None:
                flash(' Username taken: Try another username.', 'danger')
                return redirect(url_for('main.admin'))
            email = User.query.filter_by(email=new_user_form.email.data).first()
            if email is not None:
                flash('An account with the supplied email already exists.', 'danger')
                return redirect(url_for('main.admin'))
            u = User(username=new_user_form.username_register.data, email=new_user_form.email.data, is_admin=False)
            u.set_password(new_user_form.new_password.data)
            db.session.add(u)
            db.session.commit()
            flash('User added.', 'success')
            return redirect(url_for('main.admin'))
        else:
            for field, errors in new_user_form.errors.items():
                for error in errors:
                    flash(f'{error}', 'danger')
    # remove user from db        
    if request.method == 'POST' and 'remove_users' in request.form:
        usernames_to_remove = request.form.getlist('remove')
        for username in usernames_to_remove:
            user = User.query.filter_by(username=username).first()
            if user is None:
                flash('User does not exist.', 'danger')
                return redirect(url_for('main.admin'))
            if user.is_admin:
                flash('Error: Cannot remove admin.', 'danger')
                return redirect(url_for('main.admin'))
            else:
                db.session.delete(user)
        db.session.commit()
        num_users_removed = len(usernames_to_remove)
        if num_users_removed == 0:
            flash('No users selected.', 'danger')
        if num_users_removed == 1:
            flash(f"{num_users_removed} user removed successfully.", 'success')
        if num_users_removed > 1:
            flash(f"{num_users_removed} users removed successfully.", 'success')
        return redirect(url_for('main.admin'))

    return render_template('admin.html', title='Admin Dashboard', users=get_user_list(), new_user_form=new_user_form, password_requirements=password_requirements)



# profile #######################################################################
@bp.route('/profile/', methods=['GET', 'POST'])
@login_required
def profile():
    if not current_user.is_authenticated:
        flash('Must login to view this page.', 'danger')
        return redirect(url_for('main.login'))
    password_form = ChangePasswordForm(prefix='password_form')
    email_form = ChangeEmailForm(prefix='email_form')
    username_form = ChangeUsernameForm(prefix='username_form')
    if request.method == 'POST' and 'password_form-change_password' in request.form:
        if password_form.validate_on_submit():
            if current_user.check_password(password_form.old_password.data):
                if password_form.new_password.data == password_form.old_password.data:
                    flash( 'New password cannot be the same as the old password.', 'danger' )
                    return redirect(url_for('main.profile'))
                else:
                    current_user.set_password(password_form.new_password.data)
                    db.session.commit()
                    flash( 'Password changed.', 'success' )
                    return redirect(url_for('main.profile'))
            else:
                flash( 'Previous password incorrect.', 'danger' )
        else:
            for field, errors in password_form.errors.items():
                for error in errors:
                    flash(f'{error}', 'danger')
                    return redirect(url_for('main.profile'))

    if request.method == 'POST' and 'email_form-change_email' in request.form:
        if email_form.validate_on_submit():
            if current_user.email == email_form.old_email.data:
                email = User.query.filter_by(email=email_form.new_email.data).first()
                if email is not None:
                    flash('An account with the supplied email already exists.', 'danger')
                current_user.set_email(email_form.new_email.data)
                db.session.commit()
                flash( 'Email changed.', 'success' )
                return redirect(url_for('main.profile'))
            else:
                flash( 'Previous email incorrect.', 'danger' )
        else:
            for field, errors in email_form.errors.items():
                for error in errors:
                    flash(f'{error}', 'danger')
                    return redirect(url_for('main.profile'))

    if request.method == 'POST' and 'username_form-change_username' in request.form:
        if username_form.validate_on_submit():
            if current_user.username == username_form.new_username.data:
                flash( 'New username cannot be the same as the old username.', 'danger' )
                return redirect(url_for('main.profile'))
            else:
                username = User.query.filter_by(username=username_form.new_username.data).first()
                if username is not None:
                    flash('An account with the supplied username already exists.', 'danger')
                current_user.set_username(username_form.new_username.data)
                db.session.commit()
                flash( 'Username changed.', 'success' )
                return redirect(url_for('main.profile'))
        else:
            for field, errors in username_form.errors.items():
                for error in errors:
                    flash(f'{error}', 'danger')
                    return redirect(url_for('main.profile'))

    return render_template('profile.html', title= current_user.username + "'s Profile", password_form=password_form, username_form=username_form, email_form=email_form, password_requirements=password_requirements)

# lobby ##########################################################################

@bp.route('/lobby/', methods=['GET'])
@login_required
def lobby():
    session['name'] = current_user.username
    return render_template('lobby.html', title='Lobby', username=current_user.username, room='lobby', users=get_user_list())







