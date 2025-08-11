// controllers/contactController.js
import mongoose from "mongoose";
import Contact from "../models/Contact.js";
import User from "../models/user.js";

/**
 * GET /api/contacts?userId=...
 * Only returns non-deleted contacts (isDeleted: false).
 */
export const getContacts = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    // normalize userId -> ObjectId
    let creatorId = userId;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findOne({ email: userId });
      if (!user) return res.status(404).json({ error: "User not found" });
      creatorId = user._id;
    }

    const contacts = await Contact.find({
      createdBy: creatorId,
      isDeleted: false
    }).sort({ createdAt: -1 });

    res.json(contacts);
  } catch (error) {
    console.error("Failed to fetch contacts:", error.message);
    res.status(500).json({ error: "Failed to fetch contacts" });
  }
};

/**
 * POST /api/contacts
 * Create contact; prevents duplicates (case-insensitive) among non-deleted contacts.
 * If a deleted contact exists with the same email, restore it instead of creating new.
 */
export const createContact = async (req, res) => {
  try {
    const { name, email, userId } = req.body;
    if (!name || !email || !userId) {
      return res.status(400).json({ error: "Name, email, and userId are required" });
    }

    // Normalize creatorId
    let creatorId = userId;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findOne({ email: userId });
      if (!user) return res.status(404).json({ error: "User not found" });
      creatorId = user._id;
    } else {
      creatorId = new mongoose.Types.ObjectId(userId);
    }

    // Check if a non-deleted contact already exists
    const existingActive = await Contact.findOne({
      email: { $regex: `^${email}$`, $options: "i" },
      createdBy: creatorId,
      isDeleted: false
    });
    if (existingActive) {
      return res.status(400).json({ error: "Contact with this email already exists" });
    }

    // If a deleted contact exists with same email, restore it
    const existingDeleted = await Contact.findOneAndUpdate(
      {
        email: { $regex: `^${email}$`, $options: "i" },
        createdBy: creatorId,
        isDeleted: true
      },
      { name, isDeleted: false },
      { new: true }
    );
    if (existingDeleted) {
      return res.status(200).json(existingDeleted);
    }

    // Else, create new
    const contact = new Contact({ name, email, createdBy: creatorId });
    await contact.save();

    res.status(201).json(contact);
  } catch (error) {
    console.error("Failed to create contact:", error.message);
    res.status(500).json({ error: "Failed to create contact" });
  }
};

/**
 * PUT /api/contacts/:id
 * Update contact — checks duplicates excluding current contact and ignoring deleted ones.
 */
export const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, userId } = req.body;
    if (!name || !email || !userId) {
      return res.status(400).json({ error: "Name, email, and userId are required" });
    }

    // Normalize creatorId
    let creatorId = userId;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const user = await User.findOne({ email: userId });
      if (!user) return res.status(404).json({ error: "User not found" });
      creatorId = user._id;
    } else {
      creatorId = new mongoose.Types.ObjectId(userId);
    }

    // Duplicate check excluding current contact id
    const duplicate = await Contact.findOne({
      email: { $regex: `^${email}$`, $options: "i" },
      createdBy: creatorId,
      isDeleted: false,
      _id: { $ne: id }
    });
    if (duplicate) {
      return res.status(400).json({ error: "Another contact with this email already exists" });
    }

    const contact = await Contact.findOneAndUpdate(
      { _id: id, createdBy: creatorId },
      { name, email },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ error: "Contact not found or not authorized" });
    }

    res.json(contact);
  } catch (error) {
    console.error("Failed to update contact:", error.message);
    res.status(500).json({ error: "Failed to update contact" });
  }
};

/**
 * DELETE /api/contacts/:id?userId=...
 * Soft delete — keeps contact in all campaigns (Draft, Sent, Completed).
 */
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params; // contactId
    const { userId } = req.query; // can be email or ObjectId

    if (!id) {
      return res.status(400).json({ message: "Contact ID is required" });
    }
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // Soft delete (set isDeleted = true)
    const contact = await Contact.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }

    res.status(200).json({ message: "Contact soft-deleted but kept in all campaigns" });
  } catch (error) {
    console.error("Error deleting contact:", error);
    res.status(500).json({ message: "Server error deleting contact" });
  }
};
