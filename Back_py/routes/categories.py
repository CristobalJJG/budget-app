from flask import Blueprint, request, jsonify
from models import Category, User
from db import db
from schemas import CategorySchema
from flask_jwt_extended import jwt_required, get_jwt_identity

categories_bp = Blueprint("categories", __name__)
category_schema = CategorySchema()
categories_schema = CategorySchema(many=True)


@categories_bp.route("/", methods=["GET"])
@jwt_required()
def list_categories():
    user_id = get_jwt_identity()
    cats = Category.query.filter_by(user_id=user_id).all()
    return categories_schema.jsonify(cats)


@categories_bp.route("/", methods=["POST"])
@jwt_required()
def create_category():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    name = data.get("name")
    color = data.get("color")
    if not name:
        return jsonify({"msg": "name required"}), 400
    cat = Category(name=name, color=color, user_id=user_id)
    db.session.add(cat)
    db.session.commit()
    return category_schema.jsonify(cat), 201


@categories_bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
def update_category(id):
    user_id = get_jwt_identity()
    cat = Category.query.filter_by(id=id, user_id=user_id).first_or_404()
    data = request.get_json() or {}
    cat.name = data.get("name", cat.name)
    cat.color = data.get("color", cat.color)
    db.session.commit()
    return category_schema.jsonify(cat)


@categories_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_category(id):
    user_id = get_jwt_identity()
    cat = Category.query.filter_by(id=id, user_id=user_id).first_or_404()
    db.session.delete(cat)
    db.session.commit()
    return jsonify({"msg": "deleted"})
