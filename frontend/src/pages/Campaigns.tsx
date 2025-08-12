import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import apiClient from "../api/axiosInstance";

interface Contact {
  _id: string;
  name: string;
  email: string;
}

interface Campaign {
  _id: string;
  name: string;
  subject: string;
  message: string;
  recipients: {
    contactId: string;
    name: string;
    email: string;
  }[];
  status?: string;
  createdAt?: string;
}

type Tab = "draft" | "sent";

const Campaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    message: "",
    recipients: [] as string[],
  });
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("draft");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) return;

    apiClient
      .get(`http://localhost:5000/api/campaigns?userId=${userId}`)
      .then((res) => setCampaigns(res.data))
      .catch((err) => console.error("Error fetching campaigns:", err));

    apiClient
      .get(`http://localhost:5000/api/contacts?userId=${userId}`)
      .then((res) => setContacts(res.data))
      .catch((err) => console.error("Error fetching contacts:", err));
  }, [userId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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

  const allSelected =
    contacts.length > 0 && formData.recipients.length === contacts.length;

  const handleSelectAllChange = () => {
    if (allSelected) {
      setFormData((prev) => ({ ...prev, recipients: [] }));
    } else {
      setFormData((prev) => ({ ...prev, recipients: contacts.map((c) => c._id) }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Campaign name is required.");
      return;
    }
    if (!formData.subject.trim()) {
      alert("Subject is required.");
      return;
    }
    if (!formData.message.trim()) {
      alert("Message cannot be empty.");
      return;
    }
    if (formData.recipients.length === 0) {
      alert("Please select at least one recipient.");
      return;
    }

    const recipientSnapshots = contacts
      .filter((contact) => formData.recipients.includes(contact._id))
      .map((contact) => ({
        contactId: contact._id,
        name: contact.name,
        email: contact.email,
      }));

    apiClient
      .post("http://localhost:5000/api/campaigns", {
        name: formData.name,
        subject: formData.subject,
        message: formData.message,
        recipients: recipientSnapshots,
        createdBy: userId,
      })
      .then((res) => {
        setCampaigns((prev) => [...prev, res.data]);
        setFormData({ name: "", subject: "", message: "", recipients: [] });
        setActiveTab("draft");
      })
      .catch((err) => {
        console.error("Error creating campaign:", err);
        alert("Failed to create campaign. Please try again.");
      });
  };

  const handleSend = (id: string) => {
    const campaignToSend = campaigns.find((c) => c._id === id);
    if (!campaignToSend) return;

    apiClient
      .post(`http://localhost:5000/api/campaigns/send/${id}`, {
        recipients: campaignToSend.recipients.map((r) => r.contactId),
      })
      .then(() => {
        setCampaigns((prev) =>
          prev.map((c) => (c._id === id ? { ...c, status: "Sent" } : c))
        );
        setActiveTab("sent");
      })
      .catch((err) => {
        console.error("Error sending campaign:", err);
        alert("Failed to send campaign. Please try again.");
      });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this campaign?")) return;

    try {
      await apiClient.delete(`http://localhost:5000/api/campaigns/${id}`, {
        params: { userId },
      });
      setCampaigns((prev) => prev.filter((campaign) => campaign._id !== id));
      alert("Campaign deleted successfully.");
    } catch (error) {
      console.error("Failed to delete campaign:", error);
      alert("Failed to delete campaign. Please try again.");
    }
  };

  const handleGenerateAI = async () => {
    if (!formData.name.trim()) {
      alert("Please enter a campaign name before generating with AI.");
      return;
    }
    try {
      setLoadingAI(true);
      const res = await apiClient.post("http://localhost:5000/api/campaigns/generate", {
        prompt: `Write an engaging marketing email for the campaign: ${formData.name}`,
      });
      setFormData((prev) => ({
        ...prev,
        message: res.data.content || prev.message,
      }));
    } catch (error) {
      console.error("AI generation error:", error);
      alert("AI generation failed. Please try again.");
    } finally {
      setLoadingAI(false);
    }
  };

  const drafts = campaigns.filter((c) => c.status !== "Sent");
  const sentCampaigns = campaigns.filter((c) => c.status === "Sent");
  const displayedCampaigns = activeTab === "draft" ? drafts : sentCampaigns;

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6 max-w-5xl">
        <h1 className="text-3xl font-extrabold mb-6 text-center text-gray-900">
          Welcome to Your Campaigns Manager
        </h1>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-10">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Let's Create a New Campaign</h2>

          <input
            type="text"
            name="name"
            placeholder="Give your campaign a friendly name"
            value={formData.name}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-3 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-purple-600"
            required
          />
          <input
            type="text"
            name="subject"
            placeholder="What's your email subject?"
            value={formData.subject}
            onChange={handleChange}
            className="border border-gray-300 rounded-md p-3 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-purple-600"
            required
          />
          <textarea
            name="message"
            placeholder="Write your message here..."
            value={formData.message}
            onChange={handleChange}
            rows={5}
            className="border border-gray-300 rounded-md p-3 w-full mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-purple-600"
            required
          />

          <button
            type="button"
            onClick={handleGenerateAI}
            disabled={loadingAI}
            className={`mb-6 px-5 py-3 rounded-md font-semibold text-white transition ${
              loadingAI ? "bg-purple-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"
            }`}
          >
            {loadingAI ? "AI is writing your message..." : "✨ Let AI help write your email"}
          </button>

          <div className="mb-6">
            <label className="block font-semibold mb-2 text-gray-700">
              Who should receive this campaign?
            </label>

            
            <label className="flex items-center space-x-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAllChange}
                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-gray-800 font-semibold">Select Everyone</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3 bg-gray-50">
              {contacts.length === 0 ? (
                <p className="text-gray-500 col-span-full text-center">
                  You don't have any contacts yet. Add some to get started!
                </p>
              ) : (
                contacts.map((contact) => (
                  <label
                    key={contact._id}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-purple-100 rounded-md p-1"
                  >
                    <input
                      type="checkbox"
                      checked={formData.recipients.includes(contact._id)}
                      onChange={() => handleRecipientCheckboxChange(contact._id)}
                      className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-gray-800">{contact.name} ({contact.email})</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 transition"
          >
            Save This Campaign
          </button>
        </form>

        <div className="flex justify-center space-x-4 mb-6">
          <button
            onClick={() => setActiveTab("draft")}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              activeTab === "draft"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Drafts ({drafts.length})
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              activeTab === "sent"
                ? "bg-green-600 text-white shadow-lg"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Sent ({sentCampaigns.length})
          </button>
        </div>

        {displayedCampaigns.length === 0 ? (
          <p className="text-center text-gray-600">
            {activeTab === "draft"
              ? "You haven’t created any draft campaigns yet."
              : "No campaigns have been sent yet."}
          </p>
        ) : (
          <ul className="space-y-6">
            {displayedCampaigns.map((campaign) => (
              <li
                key={campaign._id}
                className={`rounded-lg p-5 border ${
                  activeTab === "draft"
                    ? "bg-white shadow-md border-gray-200"
                    : "bg-green-50 border-green-300 shadow-inner"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3
                      className={`text-xl font-semibold ${
                        activeTab === "draft" ? "text-gray-900" : "text-green-800"
                      }`}
                    >
                      {campaign.name}
                    </h3>
                    <p className={`${activeTab === "draft" ? "text-gray-700" : "text-green-700"} mt-1`}>
                      <strong>Subject:</strong> {campaign.subject}
                    </p>
                    <p className={`${activeTab === "draft" ? "text-gray-700" : "text-green-700"} mt-2 whitespace-pre-wrap`}>
                      {campaign.message}
                    </p>
                    <p className={`${activeTab === "draft" ? "text-gray-600" : "text-green-600"} mt-3 text-sm`}>
                      <strong>Recipients:</strong> {campaign.recipients.length}
                    </p>
                    {activeTab === "sent" && (
                      <p className="mt-2 text-sm font-semibold text-green-600">Status: Sent 🎉</p>
                    )}
                  </div>

                  {activeTab === "draft" && (
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleSend(campaign._id)}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                      >
                        Send Now
                      </button>
                      <button
                        onClick={() => handleDelete(campaign._id)}
                        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

export default Campaigns;
