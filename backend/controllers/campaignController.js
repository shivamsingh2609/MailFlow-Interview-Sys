import mongoose from "mongoose";
import Campaign from "../models/Campaign.js";
import User from "../models/user.js";
import { sendMailService } from "../services/sendMailService.js";

/** -----------------------
 * Get all campaigns for a user
 * ----------------------- */
export const getCampaigns = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "userId query param is required" });
    }

    const user = mongoose.Types.ObjectId.isValid(userId)
      ? await User.findById(userId)
      : await User.findOne({ email: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const campaigns = await Campaign.find({ createdBy: user._id })
      .populate("recipients", "name email");

    res.status(200).json(campaigns);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ message: "Server error while fetching campaigns" });
  }
};

/** -----------------------
 * Create a new campaign
 * ----------------------- */
export const createCampaign = async (req, res) => {
  try {
    const { name, subject, message, recipients, createdBy } = req.body;

    if (!createdBy) {
      return res.status(400).json({ message: "createdBy field is required" });
    }
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ message: "Recipients must be a non-empty array of IDs" });
    }

    const user = mongoose.Types.ObjectId.isValid(createdBy)
      ? await User.findById(createdBy)
      : await User.findOne({ email: createdBy });

    if (!user) {
      return res.status(404).json({ message: "User not found for createdBy" });
    }

    // Convert all recipients to ObjectIds
    const recipientObjectIds = recipients.map((r) => {
      if (mongoose.Types.ObjectId.isValid(r)) {
        return new mongoose.Types.ObjectId(r);
      }
      return null;
    }).filter(Boolean);

    if (recipientObjectIds.length !== recipients.length) {
      return res.status(400).json({ message: "One or more recipient IDs are invalid" });
    }

    const newCampaign = new Campaign({
      name,
      subject,
      message,
      recipients: recipientObjectIds,
      status: "Draft",
      createdBy: user._id,
    });

    const savedCampaign = await newCampaign.save();
    const populatedCampaign = await savedCampaign.populate("recipients", "name email");

    res.status(201).json(populatedCampaign);
  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({ message: "Server error while creating campaign" });
  }
};

/** -----------------------
 * Send a campaign
 * ----------------------- */
export const sendCampaign = async (req, res) => {
  try {
    const { id: campaignId } = req.params;

    const campaign = await Campaign.findById(campaignId)
      .populate("recipients", "email createdBy");

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    if (!Array.isArray(campaign.recipients) || campaign.recipients.length === 0) {
      return res.status(400).json({ message: "No recipients found for this campaign" });
    }

    // Call the service with owner and campaignId
    const result = await sendMailService(campaign.createdBy, campaignId);

    if (result.success) {
      res.status(200).json({ message: result.message, campaign });
    } else {
      res.status(400).json({ message: result.message });
    }
  } catch (error) {
    console.error("Error sending campaign:", error);
    res.status(500).json({ message: "Server error" });
  }
};
