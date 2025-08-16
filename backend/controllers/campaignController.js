import mongoose from "mongoose";
import Campaign from "../models/Campaign.js";
import User from "../models/user.js";
import { sendMailService } from "../services/sendMailService.js";
import { generateEmailContent } from "../services/aiService.js"; 
import Contact from "../models/Contact.js";

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
      .populate("createdBy", "email") 
      ;

    res.status(200).json(campaigns);
  } catch (error) {
    // console.error("Error fetching campaigns:", error);
    res.status(500).json({ message: "Server error while fetching campaigns" });
  }
};


export const createCampaign = async (req, res) => {
  try {
    const { name, subject, message, recipients } = req.body;
    const user = req.user; // set by auth middleware

    if (!name || !subject || !message || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ message: "All fields are required" });
    }

    let formattedRecipients = [];

    // Case 1: recipients are just ObjectId strings
    if (
      typeof recipients[0] === "string" ||
      mongoose.Types.ObjectId.isValid(recipients[0])
    ) {
      const contacts = await Contact.find({ _id: { $in: recipients } });

      if (contacts.length === 0) {
        return res.status(400).json({ message: "No valid contacts found" });
      }

      formattedRecipients = contacts.map(c => ({
        contactId: c._id,
        name: c.name,
        email: c.email
      }));
      console.log("Formatted recipients (Case 1):", formattedRecipients);
    // Case 2: recipients are already objects
    } else if (recipients[0]?.contactId) {
      formattedRecipients = recipients.map(r => ({
        contactId: r.contactId,
        name: r.name,
        email: r.email
      }));

    } else {
      return res.status(400).json({ message: "Invalid recipients format" });

    }
    console.log("Formatted recipients (Case 2):", formattedRecipients);

    // Create and save campaign
    const newCampaign = new Campaign({
      name,
      subject,
      message,
      recipients: formattedRecipients,
      status: "Draft",
      createdBy: user._id
    });

    await newCampaign.save();

    res.status(201).json({
      message: "Campaign created successfully",
      campaign: newCampaign
    });

  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message
    });
  }
};





export const sendCampaign = async (req, res) => {
  try {
    const { id: campaignId } = req.params;
    console.log("Sending campaign with ID:", campaignId);

    // Fetch campaign from DB
    let campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // If no recipients in DB or request → reject
    if (
      (!Array.isArray(campaign.recipients) || campaign.recipients.length === 0) &&
      (!Array.isArray(req.body.recipients) || req.body.recipients.length === 0)
    ) {
      return res.status(400).json({ message: "No recipients provided for this campaign" });
    }

    // ✅ Normalize & save recipients if passed in request
    if (Array.isArray(req.body.recipients) && req.body.recipients.length > 0) {
      campaign.recipients = req.body.recipients.map(r =>
        typeof r === "string" ? { email: r.email } : r
      );
      await campaign.save();
    } else {
      // normalize already stored recipients
      campaign.recipients = campaign.recipients.map(r =>
        typeof r === "string" ? { email: r.email } : r
      );
      await campaign.save();
    }

    // Call mail service
    const result = await sendMailService(campaign.createdBy, campaignId);

    // Refetch updated campaign after sending
    const updatedCampaign = await Campaign.findById(campaignId);

    if (result.success) {
      return res.status(200).json({
        message: result.message,
        campaign: updatedCampaign,
      });
    } else {
      return res.status(400).json({
        message: result.message,
        campaign: updatedCampaign,
      });
    }
  } catch (error) {
    console.error("Error sending campaign:", error);
    res.status(500).json({ message: "Server error" });
  }
};




export const generateEmail = async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ message: "Prompt is required" });
    }

    const aiContent = await generateEmailContent(prompt);
    console.log("Generated AI content:", aiContent);

    return res.status(200).json({ content: aiContent });

  } catch (error) {
    console.error("Error generating email content:", error);

    return res.status(500).json({ 
      message: "Failed to generate email content", 
      error: error.message,           // send actual error
      stack: error.stack              // optional, for debugging
    });
  }
};


export const deleteCampaign = async (req, res) => {
  try {
    const campaignId = req.params.id;
    const userId = req.query.userId; 

    if (!campaignId || !userId) {
      return res.status(400).json({ error: "Campaign ID and User ID are required" });
    }

   
    const deletedCampaign = await Campaign.findOneAndDelete({
      _id: campaignId,
      createdBy: userId,
    });

    if (!deletedCampaign) {
      return res.status(404).json({ error: "Campaign not found or not authorized" });
    }

    res.json({ message: "Campaign deleted successfully" });
  } catch (error) {
    // console.error("Error deleting campaign:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
