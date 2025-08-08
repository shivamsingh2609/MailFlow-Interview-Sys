import mongoose from 'mongoose';
import Campaign from '../models/Campaign.js';
import User from '../models/user.js';

// GET /api/campaigns?userId=xxxx
export const getCampaigns = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'userId query param is required' });
    }

    let user;

    // Check if userId is a valid Mongo ObjectId
    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    } else {
      // Fallback: check if userId is an email
      user = await User.findOne({ email: userId });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const campaigns = await Campaign.find({ createdBy: user._id }).populate('recipients','name email');
    res.status(200).json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ message: 'Server error while fetching campaigns' });
  }
};

// POST /api/campaigns
export const createCampaign = async (req, res) => {
  try {
    const { name, subject, message, recipients, createdBy } = req.body;

    if (!createdBy) {
      return res.status(400).json({ message: 'createdBy field is required' });
    }

    // ✅ Lookup user by ID or email
    let user;
    if (mongoose.Types.ObjectId.isValid(createdBy)) {
      user = await User.findById(createdBy);
    } else {
      user = await User.findOne({ email: createdBy });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found for createdBy' });
    }

    const newCampaign = new Campaign({
      name,
      subject,
      message,
      recipients,
      status : "Draft" ,
      createdBy: user._id,
    });

    const savedCampaign = await newCampaign.save();
    res.status(201).json(savedCampaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ message: 'Server error while creating campaign' });
  }
};


// POST /api/campaigns/send/:id
export const sendCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    campaign.status = 'Sent';
    await campaign.save();

    // You can integrate your email sending logic here later.

    res.status(200).json({ message: 'Campaign marked as sent', campaign });
  } catch (error) {
    console.error('Error sending campaign:', error);
    res.status(500).json({ message: 'Server error while sending campaign' });
  }
};
