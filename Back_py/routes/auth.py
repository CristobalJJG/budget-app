from flask import Blueprint, request, jsonify
from models import User
from db import db
from passlib.hash import pbkdf2_sha256
from flask_jwt_extended import create_access_token

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")
    if not email or not password:
        return jsonify({"msg": "email and password required"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "user exists"}), 400
    user = User(
        email=email, name=name or "", password_hash=pbkdf2_sha256.hash(password)
    )
    db.session.add(user)
    db.session.commit()
    return jsonify({"msg": "registered"}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    user = User.query.filter_by(email=email).first()
    if not user or not pbkdf2_sha256.verify(password or "", user.password_hash):
        return jsonify({"msg": "invalid credentials"}), 401
    token = create_access_token(identity=user.id)
    return jsonify({"access_token": token})
