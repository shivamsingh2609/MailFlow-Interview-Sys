import nodemailer from "nodemailer";
import Campaign from "../models/Campaign.js";
import User from "../models/user.js";
import Contact from "../models/Contact.js";
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
    if (!domain) return resolve(false);
    dns.resolveMx(domain, (err, addresses) => {
      resolve(!err && addresses && addresses.length > 0);
    });
  });
}

function checkMailbox(email) {
  return new Promise((resolve) => {
    emailExistence.check(email, (err, res) => {
      if (err) {
        console.error(`SMTP check error for ${email}:`, err && err.message ? err.message : err);
        return resolve(false); // fail safe
      }
      // res is boolean true/false from email-existence lib
      resolve(Boolean(res));
    });
  });
}

/**
 * Resolve a recipient entry to an object { email, name?, source: 'contact'|'direct'|'unknown' }
 * Accepts recipient shapes:
 *  - { email: 'a@b.com', name: 'A' }
 *  - { contactId: 'contactObjectId' } / { _id: 'contactObjectId' }
 *  - { _id: 'contactObjectId' } (when stored as reference)
 */
async function resolveRecipient(rec) {
  // if it's already proper object containing email
  if (rec?.email) {
    return { email: String(rec.email).trim(), name: rec.name || undefined, source: "direct" };
  }

  const contactId = rec?.contactId || rec?._id;
  if (contactId) {
    try {
      const contact = await Contact.findById(contactId).select("email name");
      if (contact && contact.email) {
        return { email: String(contact.email).trim(), name: contact.name || undefined, source: "contact" };
      }
      return { email: null, name: undefined, source: "contact" };
    } catch (err) {
      console.error("Error fetching contact for recipient:", err);
      return { email: null, name: undefined, source: "contact" };
    }
  }

  // fallback — sometimes frontend may send raw string (email)
  if (typeof rec === "string") {
    return { email: rec.trim(), name: undefined, source: "direct" };
  }

  // unknown shape
  return { email: null, name: undefined, source: "unknown" };
}

export const sendMailService = async (ownerUserId, campaignId) => {
  try {
    // find campaign belonging to user and with Draft status
    const campaign = await Campaign.findOne({
      _id: campaignId,
      createdBy: ownerUserId,
      // allow sending if status is Draft or Partial (optionally)
      status: { $in: ["Draft", "Partial"] },
    });

    if (!campaign || !campaign.recipients?.length) {
      return { success: false, message: "No recipients found for this campaign" };
    }

    // Resolve all recipients to get emails
    const resolvedRecipients = [];
    for (const r of campaign.recipients) {
      const resolved = await resolveRecipient(r);
      resolvedRecipients.push(resolved);
    }

    // Filter and validate
    const finalRecipients = [];
    const invalidRecipients = [];
    for (const r of resolvedRecipients) {
      if (!r.email) {
        invalidRecipients.push({ reason: "Empty email (Invalid input)", raw: r });
        continue;
      }
      finalRecipients.push(r);
    }

    if (finalRecipients.length === 0) {
      // nothing valid to send to
      campaign.status = "Failed";
      await campaign.save();
      return { success: false, message: "❌ Failed: No valid recipient emails found", campaign };
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

    // Iterate recipients one by one (so we can update status per result)
    for (const r of finalRecipients) {
      const email = r.email;
      // Simple format check
      if (!isEmailFormatValid(email)) {
        failedEmails.push(`${email} (Invalid format)`);
        continue;
      }

      // MX check (optional — can be slow for many recipients)
      try {
        const hasMX = await hasMXRecords(email);
        if (!hasMX) {
          failedEmails.push(`${email} (No MX records found)`);
          continue;
        }
      } catch (err) {
        // treat as failed MX check
        console.error("MX check error:", err);
        failedEmails.push(`${email} (MX check error)`);
        continue;
      }

      // Mailbox existence check (optional & slower)
      try {
        const exists = await checkMailbox(email);
        if (!exists) {
          failedEmails.push(`${email} (Mailbox not found)`);
          continue;
        }
      } catch (err) {
        console.error("Mailbox check error:", err);
        // If mailbox check fails, we can choose to continue and try sending; but we'll mark as failed to be conservative
        failedEmails.push(`${email} (Mailbox check error)`);
        continue;
      }

      // Try sending
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
        console.error("Send error for", email, err && err.message ? err.message : err);
        failedEmails.push(`${email} (Send error: ${err && err.message ? err.message : "unknown"})`);
      }
    }

    // Update campaign status based on results
    if (failedEmails.length > 0) {
      campaign.status = sentEmails.length > 0 ? "Partial" : "Failed";
    } else {
      campaign.status = "Sent";
    }

    // Optionally replace campaign.recipients with normalized recipients including emails
    campaign.recipients = campaign.recipients.map((orig, idx) => {
      // try to attach email if we have one in finalRecipients with same index by email
      const resolved = resolvedRecipients[idx];
      if (resolved?.email) {
        return { ...orig, email: resolved.email, name: resolved.name || orig.name || undefined };
      }
      return orig;
    });

    await campaign.save();

    return {
      success: failedEmails.length === 0,
      message:
        failedEmails.length > 0
          ? `❌ Failed: ${failedEmails.join(", ")} | ✅ Sent: ${sentEmails.join(", ")}`
          : `✅ Emails sent successfully to ${sentEmails.length} recipients`,
    };
  } catch (error) {
    console.error("Error sending campaign emails:", error);
    return { success: false, message: "Error sending campaign emails" };
  }
};
