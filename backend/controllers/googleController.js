// controllers/googleController.js
import { google } from "googleapis";
import User from "../models/user.js";
import dotenv from 'dotenv';
dotenv.config();

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  FRONTEND_URL,
} = process.env;
console.log("GOOGLE_CLIENT_ID:", GOOGLE_CLIENT_ID);
// Create OAuth client
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// Step 1: Redirect user to Google
export const connectGoogle = (req, res) => {
  const { userId } = req.params;

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // ensures refresh_token on first consent
    scope: [
      "https://www.googleapis.com/auth/gmail.send",
      "profile",
      "email",
    ],
    state: userId,
    redirect_uri: GOOGLE_REDIRECT_URI, // so callback knows which user to update
  });

  res.redirect(url);
};

// Step 2: Handle Google callback
export const googleCallback = async (req, res) => {
  try {
    const code = req.query.code;
    const state = req.query.state; // userId

    // Get tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user's email from Google
    const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
    const userinfo = await oauth2.userinfo.get();

    // Save to DB
    const user = await User.findById(state);
    if (!user) return res.status(404).send("User not found");

    user.gmail = user.gmail || {};
    if (tokens.refresh_token) user.gmail.refreshToken = tokens.refresh_token;
    user.gmail.connected = true;
    user.gmail.email = userinfo.data.email;

    await user.save();

    // Redirect to frontend
    res.redirect(`${FRONTEND_URL}/settings?connected=1`);
  } catch (err) {
    console.error("Google OAuth callback error:", err);
    res.status(500).send("Google OAuth failed");
  }
};
