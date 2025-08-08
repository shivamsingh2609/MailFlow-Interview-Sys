// ✅ 1. Updated Campaign Model - models/Campaign.js
import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Contact' }],
  status: { type: String, enum: ['Draft', 'Sent'], default: 'Draft' },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

export default mongoose.model('Campaign', campaignSchema);
