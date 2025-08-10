// services/sendMailService.js
import nodemailer from "nodemailer";
import Campaign from "../models/Campaign.js";
import User from "../models/user.js";
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL,
    pass: process.env.PASSWORD,
  },
});

export const sendMailService = async (ownerUserId, campaignId) => {
  try {
    const campaign = await Campaign.findOne({
      _id: campaignId,
      createdBy: ownerUserId,
      status: "Draft",
    }).populate("recipients", "email");

    if (!campaign || !campaign.recipients?.length) {
      return { success: false, message: "No recipients found for this campaign" };
    }

    const user = await User.findById(ownerUserId).select("username email");
    if (!user) {
      return { success: false, message: "User not found" };
    }

    const subject = `[${campaign.name}] ${campaign.subject}`;
    const bodyText = `
Campaign: ${campaign.name}
${campaign.message}
---
Sent by: ${user.username} (${user.email})
    `;

    const bodyHTML = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; overflow: hidden;">
  <div style="background-color: #4CAF50; padding: 15px; color: white; text-align: center; font-size: 20px; font-weight: bold;">
    📢 ${campaign.name}
  </div>
  <div style="padding: 20px; font-size: 16px; color: #333; line-height: 1.5;">
    <h2 style="margin-top: 0;">${campaign.subject}</h2>
    <p>${campaign.message}</p>
  </div>
  <div style="background-color: #f4f4f4; padding: 15px; font-size: 14px; color: #555; text-align: center;">
    Sent by <strong>${user.username}</strong> (${user.email})
  </div>
</div>
    `;

    const emailsToSend = campaign.recipients.map((c) => c.email);

    for (const email of emailsToSend) {
      console.log(`Sending to ${email}`);
      await transporter.sendMail({
        from: `"${user.name}" <${process.env.MAIL}>`,
        to: email,
        subject,
        text: bodyText,
        html: bodyHTML,
      });
    }

    campaign.status = "Sent";
    await campaign.save();

    return {
      success: true,
      message: `Emails sent successfully to ${emailsToSend.length} recipients`,
    };
  } catch (error) {
    console.error("Error sending campaign emails:", error);
    return { success: false, message: "Error sending campaign emails" };
  }
};
