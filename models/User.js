// models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  senhaHash: { type: String, required: true },
  cargo: { type: String, enum: ['admin', 'colaborador'], default: 'colaborador' },
  ativo: { type: Boolean, default: true }
}, { timestamps: true });

// helper p/ setar senha a partir de texto puro
UserSchema.methods.setSenha = async function (senhaPura) {
  const salt = await bcrypt.genSalt(10);
  this.senhaHash = await bcrypt.hash(senhaPura, salt);
};

export default mongoose.model('User', UserSchema);
