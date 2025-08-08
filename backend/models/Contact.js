import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  
  name: { type: String, required: true },
  email: { type: String, required: true },
  createdBy: {  
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

export default mongoose.model('Contact', contactSchema);
