import nodemailer from "nodemailer";
import Campaign from "../models/Campaign.js";
import User from "../models/user.js";
import dotenv from "dotenv";
import dns from "dns";
import emailExistence from "email-existence";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL,
    pass: process.env.PASSWORD,
  },
});

function isEmailFormatValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}


function hasMXRecords(email) {
  return new Promise((resolve) => {
    const domain = email.split("@")[1];
    dns.resolveMx(domain, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

function checkMailbox(email) {
  return new Promise((resolve) => {
    emailExistence.check(email, (err, res) => {
      if (err) {
        console.error("SMTP check error:", err);
        resolve(false);
      } else {
        resolve(res); 
      }
    });
  });
}

export const sendMailService = async (ownerUserId, campaignId) => {
  try {
    const campaign = await Campaign.findOne({
      _id: campaignId,
      createdBy: ownerUserId,
      status: "Draft",
    });

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

    let failedEmails = [];
    let sentEmails = [];

    for (const recipient of campaign.recipients) {
      const email = recipient.email;

      if (!isEmailFormatValid(email)) {
        failedEmails.push(`${email} (Invalid format)`);
        continue;
      }

      const hasMX = await hasMXRecords(email);
      if (!hasMX) {
        failedEmails.push(`${email} (No MX records found)`);
        continue;
      }

      
      const exists = await checkMailbox(email);
      if (!exists) {
        failedEmails.push(`${email} (Mailbox not found)`);
        continue;
      }

      
      try {
        await transporter.sendMail({
          from: `"${user.username}" <${process.env.MAIL}>`,
          to: email,
          subject,
          text: bodyText,
          html: bodyHTML,
        });
        sentEmails.push(email);
      } catch (err) {
        console.error(`❌ Failed to send to ${email}:`, err.message);
        failedEmails.push(`${email} (Send error: ${err.message})`);
      }
    }

    if (failedEmails.length > 0) {
      campaign.status = sentEmails.length > 0 ? "Partial" : "Failed";
      await campaign.save();
      return {
        success: false,
        message: `Failed: ${failedEmails.join(", ")} | Sent: ${sentEmails.join(", ")}`,
      };
    }

    campaign.status = "Sent";
    await campaign.save();

    return {
      success: true,
      message: `Emails sent successfully to ${sentEmails.length} recipients`,
    };
  } catch (error) {
    console.error("Error sending campaign emails:", error);
    return { success: false, message: "Error sending campaign emails" };
  }
};
