from flask import Blueprint, request, jsonify
from models import Service
from db import db
from schemas import ServiceSchema
from flask_jwt_extended import jwt_required, get_jwt_identity

services_bp = Blueprint("services", __name__)
service_schema = ServiceSchema()
services_schema = ServiceSchema(many=True)


@services_bp.route("/", methods=["GET"])
@jwt_required()
def list_services():
    user_id = get_jwt_identity()
    items = Service.query.filter_by(user_id=user_id).all()
    return services_schema.jsonify(items)


@services_bp.route("/", methods=["POST"])
@jwt_required()
def create_service():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    name = data.get("name")
    amount = data.get("amount", 0.0)
    if not name:
        return jsonify({"msg": "name required"}), 400
    s = Service(name=name, amount=amount, user_id=user_id)
    db.session.add(s)
    db.session.commit()
    return service_schema.jsonify(s), 201


@services_bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
def update_service(id):
    user_id = get_jwt_identity()
    s = Service.query.filter_by(id=id, user_id=user_id).first_or_404()
    data = request.get_json() or {}
    s.name = data.get("name", s.name)
    s.amount = data.get("amount", s.amount)
    db.session.commit()
    return service_schema.jsonify(s)


@services_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_service(id):
    user_id = get_jwt_identity()
    s = Service.query.filter_by(id=id, user_id=user_id).first_or_404()
    db.session.delete(s)
    db.session.commit()
    return jsonify({"msg": "deleted"})
