from db import db
from datetime import datetime


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120))
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    categories = db.relationship("Category", backref="user", lazy=True)
    services = db.relationship("Service", backref="user", lazy=True)
    transactions = db.relationship("Transaction", backref="user", lazy=True)


class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    color = db.Column(db.String(20))
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)


class Service(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    amount = db.Column(db.Float, default=0.0)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    records = db.relationship("ServiceRecord", backref="service", lazy=True)


class ServiceRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    service_id = db.Column(db.Integer, db.ForeignKey("service.id"), nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    amount = db.Column(db.Float, default=0.0)


class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(255))
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    category_id = db.Column(db.Integer, db.ForeignKey("category.id"))
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    category = db.relationship("Category")
