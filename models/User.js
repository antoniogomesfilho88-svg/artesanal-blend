import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  nome: String,
  email: { type: String, required: true, unique: true },
  senhaHash: { type: String, required: true },
  cargo: { type: String, default: "admin" },
}, { timestamps: true });

export default mongoose.model("User", UserSchema);
