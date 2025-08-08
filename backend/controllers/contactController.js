import Contact from '../models/Contact.js';

// Get all contacts for a specific user
export const getContacts = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // ✅ Use createdBy in query instead of userId
    const contacts = await Contact.find({ createdBy: userId });
    res.json(contacts);
  } catch (error) {
    console.error('❌ Failed to fetch contacts:', error.message);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
};

// Create a new contact
export const createContact = async (req, res) => {
  try {
    const { name, email, userId } = req.body;

    if (!name || !email || !userId) {
      return res.status(400).json({ error: 'Name, email, and userId are required' });
    }

    // ✅ Save user reference in createdBy
    const contact = new Contact({ name, email, createdBy: userId });
    await contact.save();

    res.status(201).json(contact);
  } catch (error) {
    console.error('❌ Failed to create contact:', error.message);
    res.status(500).json({ error: 'Failed to create contact' });
  }
};

// Update a contact
export const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, userId } = req.body;

    if (!name || !email || !userId) {
      return res.status(400).json({ error: 'Name, email, and userId are required' });
    }

    // ✅ Ensure user can only update their own contact
    const contact = await Contact.findOneAndUpdate(
      { _id: id, createdBy: userId },
      { name, email },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found or not authorized' });
    }

    res.json(contact);
  } catch (error) {
    console.error('❌ Failed to update contact:', error.message);
    res.status(500).json({ error: 'Failed to update contact' });
  }
};

// Delete a contact
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query; // send in query for safety

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // ✅ Ensure user can only delete their own contact
    const deleted = await Contact.findOneAndDelete({ _id: id, createdBy: userId });
    if (!deleted) {
      return res.status(404).json({ error: 'Contact not found or not authorized' });
    }

    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('❌ Failed to delete contact:', error.message);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
};
