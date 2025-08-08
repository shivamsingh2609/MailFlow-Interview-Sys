import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';

interface Contact {
  _id: string;
  name: string;
  email: string;
}

interface Campaign {
  _id?: string;
  name: string;
  subject: string;
  message: string;
  recipients: Contact[];
  status?: string;
  createdAt?: string;
}

const Campaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    message: '',
    recipients: [] as string[],
  });

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (!userId) return;

    axios
      .get(`http://localhost:5000/api/campaigns?userId=${userId}`)
      .then((res) => setCampaigns(res.data))
      .catch((err) => console.error('Error fetching campaigns:', err));

   axios.get(`http://localhost:5000/api/contacts?userId=${userId}`)
      .then((res) => setContacts(res.data))
      .catch((err) => console.error('Error fetching contacts:', err));
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRecipientCheckboxChange = (id: string) => {
    setFormData((prev) => {
      const isSelected = prev.recipients.includes(id);
      return {
        ...prev,
        recipients: isSelected
          ? prev.recipients.filter((rid) => rid !== id)
          : [...prev.recipients, id],
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    axios
      .post('http://localhost:5000/api/campaigns', {
        ...formData,
        createdBy: userId,
      })
      .then((res) => {
        setCampaigns((prev) => [...prev, res.data]);
        setFormData({
          name: '',
          subject: '',
          message: '',
          recipients: [],
        });
      })
      .catch((err) => console.error('Error creating campaign:', err));
  };

  const handleSend = (id: string) => {
    axios
      .post(`http://localhost:5000/api/campaigns/send/${id}`)
      .then(() => {
        setCampaigns((prev) =>
          prev.map((c) => (c._id === id ? { ...c, status: 'Sent' } : c))
        );
      })
      .catch((err) => console.error('Error sending campaign:', err));
  };

  return (
    <>
    <Navbar/>
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Campaigns</h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6">
        <div className="mb-4">
          <label className="block font-medium">Campaign Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block font-medium">Subject</label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block font-medium">Message</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-2">Select Recipients</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border p-2 rounded">
            {contacts.map((contact) => (
              <label key={contact._id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.recipients.includes(contact._id)}
                  onChange={() => handleRecipientCheckboxChange(contact._id)}
                />
                <span>{contact.name} ({contact.email})</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Save Campaign
        </button>
      </form>

      {/* Campaign List */}
      <div>
        <h2 className="text-xl font-semibold mb-2">Your Campaigns</h2>
        {campaigns.length === 0 ? (
          <p>No campaigns found.</p>
        ) : (
          <ul className="space-y-4">
            {campaigns.map((campaign) => (
              <li key={campaign._id} className="bg-gray-100 p-4 rounded shadow">
                <h3 className="text-lg font-bold">{campaign.name}</h3>
                <p><strong>Subject:</strong> {campaign.subject}</p>
                <p><strong>Message:</strong> {campaign.message}</p>
                <p><strong>Status:</strong> {campaign.status}</p>

                <p><strong>Recipients:</strong></p>
                <ul className="list-disc list-inside ml-4">
                  {campaign.recipients.map((recipient) => (
                    <li key={recipient._id}>{recipient.name} ({recipient.email})</li>
                  ))}
                </ul>

                {campaign.status !== 'Sent' && (
                  <button
                    onClick={() => handleSend(campaign._id!)}
                    className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Send Campaign
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
    </>
    
  );
};

export default Campaigns;
