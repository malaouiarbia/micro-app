import mongoose from "mongoose";
import { Password } from "../services/password";
import { UserDoc } from "../types/IUser";
import jwt from "jsonwebtoken";

// Attributes required to create a new user
interface UserAttrs {
  email: string;
  password: string;
}

// Properties the User model has
interface UserModel extends mongoose.Model<UserDoc> {
  build(attrs: UserAttrs): UserDoc;
}

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    toJSON: {
      transform(doc, ret: any) {
        ret.id = ret._id.toString(); // fix: convert ObjectId to string
        delete ret._id;
        delete ret.password;
        delete ret.__v;
      },
    },
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const hashed = await Password.toHash(this.get("password"));
    this.set("password", hashed);
  }
  next();
});

// Add custom methods (e.g. generate JWT)
userSchema.methods.getJwtToken = function () {
  return jwt.sign(
    { id: this._id.toString(), email: this.email },
    process.env.JWT_KEY!,
    { expiresIn: 3600 }
  );
};

// Static method to use type-safe creation
userSchema.statics.build = (attrs: UserAttrs) => {
  return new User(attrs);
};

const User = mongoose.model<UserDoc, UserModel>("User", userSchema);

export { User };
