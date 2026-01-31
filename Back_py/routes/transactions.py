from flask import Blueprint, request, jsonify
from models import Transaction
from db import db
from schemas import TransactionSchema
from flask_jwt_extended import jwt_required, get_jwt_identity

transactions_bp = Blueprint("transactions", __name__)
transaction_schema = TransactionSchema()
transactions_schema = TransactionSchema(many=True)


@transactions_bp.route("/", methods=["GET"])
@jwt_required()
def list_transactions():
    user_id = get_jwt_identity()
    txs = Transaction.query.filter_by(user_id=user_id).all()
    return transactions_schema.jsonify(txs)


@transactions_bp.route("/", methods=["POST"])
@jwt_required()
def create_transaction():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    amount = data.get("amount")
    if amount is None:
        return jsonify({"msg": "amount required"}), 400
    tx = Transaction(
        description=data.get("description"),
        amount=amount,
        user_id=user_id,
        category_id=data.get("category_id"),
    )
    db.session.add(tx)
    db.session.commit()
    return transaction_schema.jsonify(tx), 201


@transactions_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_transaction(id):
    user_id = get_jwt_identity()
    tx = Transaction.query.filter_by(id=id, user_id=user_id).first_or_404()
    db.session.delete(tx)
    db.session.commit()
    return jsonify({"msg": "deleted"})
