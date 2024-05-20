import os

from flask_login import UserMixin
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from werkzeug.security import check_password_hash, generate_password_hash

from app import db


from sqlalchemy.sql import func


class Teacher(db.Model):
    __tablename__ = 'Teacher'
    __bind_key__ = None
    id = db.Column(db.String(128), primary_key=True)
    name = db.Column(db.String(64), index=True, unique=True, nullable=False)
    surname = db.Column(db.String(64), index=True, unique=True, nullable=False)
    def as_dict(self):
       return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class Student(db.Model):
    __tablename__ = 'Student'
    __bind_key__ = None
    id = db.Column(db.String(128), primary_key=True)
    name = db.Column(db.String(64), index=True, nullable=False)
    surname = db.Column(db.String(64), index=True, nullable=False)
    def as_dict(self):
       return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class Class(db.Model):
    __tablename__ = 'Class'
    __bind_key__ = None
    id = db.Column(db.String(128), primary_key=True)
    name = db.Column(db.String(64), index=True, unique=True, nullable=False)
    def as_dict(self):
       return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class ClassTeacher(db.Model):
    __tablename__ = 'ClassTeacher'
    __bind_key__ = None
    id = db.Column(db.String(128), primary_key=True)
    class_id = db.Column(db.String(128), ForeignKey('Class.id', ondelete='CASCADE'))
    teacher_id = db.Column(db.String(128), ForeignKey('Teacher.id', ondelete='CASCADE'))
    joined_class = db.Column(db.DateTime, server_default=func.now(), nullable=False)
    left_class = db.Column(db.DateTime, nullable=True)
    def as_dict(self):
       return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class ClassStudent(db.Model):
    __tablename__ = 'ClassStudent'
    __bind_key__ = None
    id = db.Column(db.String(128), primary_key=True)
    class_id = db.Column(db.String(128), ForeignKey('Class.id', ondelete='CASCADE'))
    student_id = db.Column(db.String(128), ForeignKey('Student.id', ondelete='CASCADE'))
    joined_class = db.Column(db.DateTime, server_default=func.now(), nullable=False)
    left_class = db.Column(db.DateTime, nullable=True)
    def as_dict(self):
       return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class Test(db.Model):
    __tablename__ = 'Test'
    __bind_key__ = None
    id = db.Column(db.String(128), primary_key=True)
    name = db.Column(db.String(64), index=True, unique=True, nullable=False)
    class_id = db.Column(db.String(128), ForeignKey('Class.id', ondelete='CASCADE'))
    date_taken = db.Column(db.DateTime, default=db.func.now())
    def as_dict(self):
       return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class TestStudent(db.Model):
    __tablename__ = 'TestStudent'
    __bind_key__ = None
    id = db.Column(db.String(128), primary_key=True)
    test_id = db.Column(db.String(128), ForeignKey('Test.id', ondelete='CASCADE'), primary_key=False)
    test = relationship("Test")
    student_id = db.Column(db.String(128), ForeignKey('Student.id', ondelete='CASCADE'), primary_key=False)
    student = relationship("Student")
    def as_dict(self):
       return {c.name: getattr(self, c.name) for c in self.__table__.columns}
    
class Question(db.Model):
    __tablename__ = 'Question'
    __bind_key__ = None
    id = db.Column(db.String(128), primary_key=True)
    text = db.Column(db.String(1024), index=True, nullable=False)
    test_id = db.Column(db.String(128), ForeignKey('Test.id', ondelete='CASCADE'), primary_key=False)
    def as_dict(self):
       return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class Answer(db.Model):
    __tablename__ = 'Answer'
    __bind_key__ = None
    id = db.Column(db.String(128), primary_key=True)
    text = db.Column(db.String(256), index=True, nullable=False)
    is_correct = db.Column(db.Boolean, nullable=False, default=False)
    question_id = db.Column(db.String(128), ForeignKey('Question.id', ondelete='CASCADE'), primary_key=False)
    question = relationship("Question")
    def as_dict(self):
       return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class StudentResponse(db.Model):
    __tablename__ = 'StudentResponse'
    __bind_key__ = None
    id = db.Column(db.String(128), primary_key=True)
    student_id = db.Column(db.String(128), ForeignKey('Student.id', ondelete='CASCADE'), primary_key=False)
    #question_id = db.Column(db.String(128), ForeignKey('Question.id', ondelete='CASCADE'), primary_key=False)
    answer_id = db.Column(db.String(128), ForeignKey('Answer.id', ondelete='CASCADE'), primary_key=False, nullable=True)
    answer = relationship("Answer")
    def as_dict(self):
       return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class User(db.Model, UserMixin):
    __tablename__ = 'User'
    __bind_key__ = None
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(64), index=True, unique=True, nullable=False)
    email = db.Column(db.String(120), index=True, unique=True)
    is_admin = db.Column(db.Boolean, nullable=False, default=False)
    password_hash = db.Column(db.String(200), nullable=False)
    reset_password = db.Column(db.Boolean, nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def set_email(self, email):
        self.email = email

    def set_username(self, username):
        self.username = username

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def reset_password(self):
        reset_password = True

    def __repr__(self):
        return '<User {}>'.format(self.username)

    def as_dict(self):
       return {c.name: getattr(self, c.name) for c in self.__table__.columns}
