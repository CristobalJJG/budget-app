from marshmallow import Schema, fields


class UserSchema(Schema):
    id = fields.Int()
    name = fields.Str(allow_none=True)
    email = fields.Str()


class CategorySchema(Schema):
    id = fields.Int()
    name = fields.Str()
    color = fields.Str(allow_none=True)
    user_id = fields.Int()


class ServiceSchema(Schema):
    id = fields.Int()
    name = fields.Str()
    amount = fields.Float()
    user_id = fields.Int()


class ServiceRecordSchema(Schema):
    id = fields.Int()
    service_id = fields.Int()
    date = fields.DateTime(allow_none=True)
    amount = fields.Float()


class TransactionSchema(Schema):
    id = fields.Int()
    description = fields.Str(allow_none=True)
    amount = fields.Float()
    date = fields.DateTime(allow_none=True)
    category_id = fields.Int(allow_none=True)
    user_id = fields.Int()
