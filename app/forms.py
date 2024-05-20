from flask_wtf import FlaskForm
from wtforms import PasswordField, StringField, SubmitField
from wtforms.validators import DataRequired, Email, EqualTo, Length, Regexp

from app import password_pattern, username_pattern


class LoginForm(FlaskForm):
    username_login = StringField(render_kw={"placeholder": "Username"}, validators=[DataRequired(), Regexp(username_pattern, message='Username must only contain letters, numbers, and underscores.')])
    password = PasswordField(render_kw={"placeholder": "Password"}, validators=[DataRequired(), Length(min=8, max=20), Regexp(password_pattern, message='Failed to meet password requirements.')])
    login = SubmitField('Login')

class AddUserForm(FlaskForm):
    email = StringField(render_kw={"placeholder": "Email"}, validators=[DataRequired(), Email(message='Invalid email address.')])
    username_register = StringField(render_kw={"placeholder": "Username"}, validators=[DataRequired(), Regexp(username_pattern, message='Username must only contain letters, numbers, and underscores.')])
    new_password = PasswordField(render_kw={"placeholder": "New Password"}, validators=[DataRequired(), Length(min=8, max=20), Regexp(password_pattern, message='Failed to meet password requirements.')])
    repeat_password = PasswordField(render_kw={"placeholder": "Repeat Password"}, validators=[DataRequired(), Length(min=8, max=20), EqualTo('new_password', message='Passwords must match.')])
    register = SubmitField('Register')

class ChangePasswordForm(FlaskForm):
    old_password = PasswordField(render_kw={"placeholder": "Previous Password"}, validators=[DataRequired()])
    new_password = PasswordField(render_kw={"placeholder": "New Password"}, validators=[DataRequired(), Length(min=8, max=20), Regexp(password_pattern, message='Failed to meet password requirements.')])
    repeat_password = PasswordField(render_kw={"placeholder": "Repeat Password"}, validators=[DataRequired(), Length(min=8, max=20), EqualTo('new_password', message='Passwords must match.')])
    change_password = SubmitField('Submit')

class ChangeEmailForm(FlaskForm):
    old_email = StringField(render_kw={"placeholder": "Previous Email"}, validators=[DataRequired()])
    new_email = StringField(render_kw={"placeholder": "New Email"}, validators=[DataRequired(), Email(message='Invalid email address.')])
    repeat_email = StringField(render_kw={"placeholder": "Repeat Email"}, validators=[DataRequired(), EqualTo('new_email', message='Emails must match.')])
    change_email = SubmitField('Submit')

class ChangeUsernameForm(FlaskForm):
    new_username = StringField(render_kw={"placeholder": "New Username"}, validators=[DataRequired(), Regexp(username_pattern, message='Username must only contain letters, numbers, and underscores.')])
    repeat_username = StringField(render_kw={"placeholder": "Repeat Username"}, validators=[DataRequired(), EqualTo('new_username', message='Usernames must match.')])
    change_username = SubmitField('Submit')

