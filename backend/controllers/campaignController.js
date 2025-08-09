import mongoose from "mongoose";
import nodemailer from "nodemailer";
import { google } from "googleapis";
import Campaign from "../models/Campaign.js";
import User from "../models/user.js";

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
} = process.env;

/** -----------------------
 * Get all campaigns for a user
 * ----------------------- */
export const getCampaigns = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "userId query param is required" });
    }

    // Find user by ID or email
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

    // Find user by ID or email
    const user = mongoose.Types.ObjectId.isValid(createdBy)
      ? await User.findById(createdBy)
      : await User.findOne({ email: createdBy });

    if (!user) {
      return res.status(404).json({ message: "User not found for createdBy" });
    }

    const newCampaign = new Campaign({
      name,
      subject,
      message,
      recipients,
      status: "Draft",
      createdBy: user._id,
    });

    const savedCampaign = await newCampaign.save();
    res.status(201).json(savedCampaign);
  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({ message: "Server error while creating campaign" });
  }
};

/** -----------------------
 * Send a campaign using user's Gmail
 * ----------------------- */
export const sendCampaign = async (req, res) => {
  try {
    const { id } = req.params;

    // Find campaign with recipients
    const campaign = await Campaign.findById(id).populate("recipients");
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Get creator info
    const user = await User.findById(campaign.createdBy);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Ensure Gmail OAuth is connected
    if (!user.gmail?.refreshToken) {
      return res.status(400).json({
        message: "User Gmail not connected. Please connect Gmail first.",
      });
    }

    // Create OAuth client
    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );
    oauth2Client.setCredentials({ refresh_token: user.gmail.refreshToken });

    // Get access token
    const accessTokenRes = await oauth2Client.getAccessToken();
    const accessToken = accessTokenRes?.token ?? accessTokenRes;

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: user.gmail.email || user.email,
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        refreshToken: user.gmail.refreshToken,
        accessToken,
      },
    });

    // Prepare recipients
    const recipientEmails = campaign.recipients.map(r => r.email).join(", ");

    // Send mail
    const mailOptions = {
      from: `${user.username || user.email} <${user.gmail.email || user.email}>`,
      to: recipientEmails,
      subject: campaign.subject,
      text: campaign.message,
      html: `<div>${campaign.message}</div>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email send info:", info);

    // Mark campaign as sent
    campaign.status = "Sent";
    await campaign.save();

    res.json({ message: "Campaign sent successfully", info });
  } catch (error) {
    console.error("Error sending campaign:", error);
    res.status(500).json({
      message: "Failed to send campaign",
      error: error.message,
    });
  }
};
