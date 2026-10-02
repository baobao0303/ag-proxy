import { createModel, Model, SchemaDef } from "../dynamo-model";

/** DynamoDB-backed replacement for the Mongoose User model. */

const UserSchema: SchemaDef = {
  username: { type: "string", required: true },
  password: { type: "string", required: true },
  role: { type: "string", default: "user" }, // enum: admin | user
  createdAt: { type: "date", default: () => new Date() },
};

export const User: Model = createModel("User", "agproxy_users", UserSchema, {});
