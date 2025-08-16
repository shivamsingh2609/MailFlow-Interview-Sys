
import React, { useEffect, useState, useRef } from "react";
import Navbar from "../components/Navbar";
import apiClient from "../api/axiosInstance";
import toast, { Toaster } from "react-hot-toast";


declare global {
  interface SpeechRecognition extends EventTarget {
    start(): void;
    stop(): void;
    abort(): void;
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: any) => void;
    onend: () => void;
  }

  interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
  }

  var SpeechRecognition: {
    prototype: SpeechRecognition;
    new (): SpeechRecognition;
  };

  var webkitSpeechRecognition: {
    prototype: SpeechRecognition;
    new (): SpeechRecognition;
  };
}

interface Contact {
  _id: string;
  name: string;
  email: string;
}
interface AIResponse {
  name: string;
  subject: string;
  message: string;
}
interface Campaign {
  _id: string;
  name: string;
  subject: string;
  message: string; // HTML allowed
  recipients: {
    contactId: string;
    name: string;
    email: string;
  }[];
  status?: string;
  createdAt?: string;
}

type Tab = "draft" | "sent" | "failed";

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
  const [listening, setListening] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("draft");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const userId = localStorage.getItem("userId");

  const fetchCampaigns = () => {
    if (!userId) return;
    apiClient
      .get(`/api/campaigns?userId=${userId}`)
      .then((res) => setCampaigns(res.data))
      .catch((err) => console.error("Error fetching campaigns:", err));
  };

  useEffect(() => {
    fetchCampaigns();
    if (!userId) return;
    apiClient
      .get(`/api/contacts?userId=${userId}`)
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
      setFormData((prev) => ({
        ...prev,
        recipients: contacts.map((c) => c._id),
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) return toast.error("Campaign name is required");
    if (!formData.subject.trim()) return toast.error("Subject is required");
    if (!formData.message.trim()) return toast.error("Message cannot be empty");
    if (formData.recipients.length === 0)
      return toast.error("Please select at least one recipient");

    const recipientSnapshots = contacts
      .filter((contact) => formData.recipients.includes(contact._id))
      .map((contact) => ({
        contactId: contact._id,
        name: contact.name,
        email: contact.email,
      }));

    console.log("Recipient snapshots:", recipientSnapshots);
    apiClient
      .post("/api/campaigns", {
        name: formData.name,
        subject: formData.subject,
        message: formData.message,
        recipients: recipientSnapshots,
        createdBy: userId,
      })
      .then((res) => {
        console.log("Campaign created:", res.data);
        setCampaigns((prev) => [...prev, res.data.campaign]);
        setFormData({ name: "", subject: "", message: "", recipients: [] });
        setActiveTab("draft");
        toast.success("Campaign created successfully!");
      })
      .catch((err) => {
        console.error("Error creating campaign:", err);
        toast.error("Failed to create campaign. Please try again.");
      });
  };

  const handleSend = async (id: string) => {
    console.log("hii")
    const campaignToSend = campaigns.find((c) => c._id === id);
    if (!campaignToSend) return;

    setCampaigns((prev) =>
      prev.map((c) => (c._id === id ? { ...c, status: "Sending" } : c))
    );

    try {
      const res = await apiClient.post(
        `/api/campaigns/send/${id}`,
        {
          recipients: campaignToSend.recipients.map((r) => r.email),
        }
      );
      console.log("Campaign sent response:", res.data.recipients);

      const statusFromBackend = res.data.campaign?.status || "Failed";
      setCampaigns((prev) =>
        prev.map((c) =>
          c._id === id ? { ...c, status: statusFromBackend } : c
        )
      );

      if (statusFromBackend === "Sent") {
        toast.success("Campaign sent successfully!");
      } else {
        toast.error(`Failed to send: ${res.data.message || "Check recipients"}`);
      }
    } catch (err: any) {
      console.error("Error sending campaign:", err);
      setCampaigns((prev) =>
        prev.map((c) => (c._id === id ? { ...c, status: "Failed" } : c))
      );
      toast.error("Failed to send campaign. Please try again.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this campaign?")) return;

    try {
      await apiClient.delete(`/api/campaigns/${id}`, {
        params: { userId },
      });
      setCampaigns((prev) => prev.filter((campaign) => campaign._id !== id));
      toast.success("Campaign deleted successfully!");
    } catch (error) {
      console.error("Failed to delete campaign:", error);
      toast.error("Failed to delete campaign. Please try again.");
    }
  };

  // const handleGenerateAI = async () => {
  //   if (!formData.name.trim()) return toast.error("Enter a campaign name first");

  //   try {
  //     setLoadingAI(true);
  //     const {data} = await apiClient.post(
  //       "http://localhost:5000/api/campaigns/generate",
  //       {
  //         prompt: `Write an engaging marketing email for the campaign: ${formData.name}`,
  //       }
  //     );
  //      let aiResult: any;
  //     if (typeof data === "string") {
  //       try {
  //         aiResult = JSON.parse(data);
  //       } catch {
  //         throw new Error("Invalid AI response format");
  //       }
  //     } else {
  //       aiResult = data;
  //     }

  //     // Extract from content
  //     const { name, subject, message } = aiResult.content || {};

  //     console.log("AI response:", name, subject, message);

  //     setFormData((prev) => ({
  //       ...prev,
  //       name: name || prev.name,
  //       subject: subject || prev.subject,
  //       message: message || prev.message,
  //     }));

  //   } catch (error) {
  //     console.error("AI generation error:", error);
  //     toast.error("AI generation failed. Please try again.");
  //   } finally {
  //     setLoadingAI(false);
  //   }
  // };

 
const handleVoiceGenerate = () => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    toast.error("Speech recognition is not supported in this browser.");
    return;
  }

  const recognition: SpeechRecognition = new SpeechRecognition();
  recognitionRef.current = recognition;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.lang = "en-US";

  recognition.onresult = async (event: SpeechRecognitionEvent) => {
    const transcript = event.results[0][0].transcript;
    try {
      setListening(false);
      toast.loading("Generating campaign from voice...", { id: "voiceGen" });

      const { data } = await apiClient.post(
        "/api/campaigns/generate",
        { prompt: transcript }
      );

      // Parse JSON if it's a string
      let aiResult: any;
      if (typeof data === "string") {
        try {
          aiResult = JSON.parse(data);
        } catch {
          throw new Error("Invalid AI response format");
        }
      } else {
        aiResult = data;
      }

      // Extract from content
      const { name, subject, message } = aiResult.content || {};

      console.log("AI response:", name, subject, message);

      setFormData((prev) => ({
        ...prev,
        name: name || prev.name,
        subject: subject || prev.subject,
        message: message || prev.message,
      }));

      toast.success("Form filled from your voice input!", { id: "voiceGen" });
    } catch (e) {
      console.error("Voice AI generation error:", e);
      toast.error("Failed to generate from voice.", { id: "voiceGen" });
    }
  };

  recognition.onerror = () => {
    setListening(false);
    toast.error("Speech recognition error.");
  };
  recognition.onend = () => setListening(false);

  recognition.start();
  setListening(true);
};


  const stopVoice = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const drafts = campaigns.filter(
    (c) => c.status !== "Sent" && c.status !== "Failed" && c.status !== "Sending"
  );
  const sentCampaigns = campaigns.filter((c) => c.status === "Sent");
  const failedCampaigns = campaigns.filter((c) => c.status === "Failed");
  const sendingCampaigns = campaigns.filter((c) => c.status === "Sending");

  const displayedCampaigns =
    activeTab === "draft"
      ? drafts.concat(sendingCampaigns)
      : activeTab === "sent"
      ? sentCampaigns
      : failedCampaigns;

  return (
    <>
      <Navbar />
      <Toaster position="top-right" />
      <div className="container mx-auto p-6 max-w-5xl">
        <h1 className="text-3xl font-extrabold mb-6 text-center text-gray-900">
          Welcome to Your Campaigns Manager
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md mb-10"
        >
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            Create a New Campaign
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              name="name"
              placeholder="Campaign name"
              value={formData.name}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-3 w-full focus:outline-none focus:ring-2 focus:ring-purple-600"
              required
            />
            <input
              type="text"
              name="subject"
              placeholder="Subject"
              value={formData.subject}
              onChange={handleChange}
              className="border border-gray-300 rounded-md p-3 w-full focus:outline-none focus:ring-2 focus:ring-purple-600"
              required
            />
          </div>

          <textarea
            name="message"
            placeholder="Message (HTML allowed from AI)"
            value={formData.message}
            onChange={handleChange}
            rows={6}
            className="border border-gray-300 rounded-md p-3 w-full mt-4 resize-none focus:outline-none focus:ring-2 focus:ring-purple-600"
            required
          />

          {/* Optional: quick HTML preview if AI returned bold/italic/lists */}
          {formData.message && (
            <div className="mt-3 p-3 border rounded bg-gray-50">
              <div className="text-sm text-gray-600 mb-1">Preview:</div>
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: formData.message }}
              />
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-4">
            {/* <button
              type="button"
              onClick={handleGenerateAI}
              disabled={loadingAI}
              className={`px-5 py-3 rounded-md font-semibold text-white transition ${
                loadingAI
                  ? "bg-purple-400 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              {loadingAI ? "AI is writing..." : "✨ Let AI help write your email"}
            </button> */}

            {!listening ? (
              <button
                type="button"
                onClick={handleVoiceGenerate}
                className="px-5 py-3 rounded-md font-semibold text-white bg-green-600 hover:bg-green-700 transition"
              >
                🎙️ Speak & AI-Generate
              </button>
            ) : (
              <button
                type="button"
                onClick={stopVoice}
                className="px-5 py-3 rounded-md font-semibold text-white bg-red-600 hover:bg-red-700 transition"
              >
                ⏹ Stop
              </button>
            )}
          </div>

          {/* Recipients */}
          <div className="mb-6 mt-6">
            <label className="block font-semibold mb-2 text-gray-700">
              Select recipients
            </label>
            <label className="flex items-center space-x-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAllChange}
                className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span>Select Everyone</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3 bg-gray-50">
              {contacts.length === 0 ? (
                <p className="text-gray-500 col-span-full text-center">
                  No contacts yet
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
                      onChange={() =>
                        handleRecipientCheckboxChange(contact._id)
                      }
                      className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span>
                      {contact.name} ({contact.email})
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 transition"
          >
            Save Campaign
          </button>
        </form>

        {/* Tabs */}
        <div className="flex justify-center space-x-4 mb-6">
          <button
            onClick={() => setActiveTab("draft")}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              activeTab === "draft"
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Drafts ({campaigns.filter(c => c.status !== "Sent" && c.status !== "Failed" && c.status !== "Sending").length + campaigns.filter(c => c.status === "Sending").length})
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              activeTab === "sent"
                ? "bg-green-600 text-white shadow-lg"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Sent ({campaigns.filter(c => c.status === "Sent").length})
          </button>
          <button
            onClick={() => setActiveTab("failed")}
            className={`px-6 py-2 rounded-full font-semibold transition ${
              activeTab === "failed"
                ? "bg-red-600 text-white shadow-lg"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Failed ({campaigns.filter(c => c.status === "Failed").length})
          </button>
        </div>

        {/* List */}
        {displayedCampaigns.length === 0 ? (
          <p className="text-center text-gray-600">
            {activeTab === "draft"
              ? "No draft campaigns"
              : activeTab === "sent"
              ? "No sent campaigns"
              : "No failed campaigns"}
          </p>
        ) : (
          <ul className="space-y-6">
            {displayedCampaigns.map((campaign) => (
              <li
                key={campaign._id}
                className={`rounded-lg p-5 border ${
                  activeTab === "draft"
                    ? "bg-white shadow-md border-gray-200"
                    : activeTab === "sent"
                    ? "bg-green-50 border-green-300 shadow-inner"
                    : "bg-red-50 border-red-300 shadow-inner"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3
                      className={`text-xl font-semibold ${
                        activeTab === "draft"
                          ? "text-gray-900"
                          : activeTab === "sent"
                          ? "text-green-800"
                          : "text-red-800"
                      }`}
                    >
                      {campaign.name}
                    </h3>
                    <p
                      className={`${
                        activeTab === "draft"
                          ? "text-gray-700"
                          : activeTab === "sent"
                          ? "text-green-700"
                          : "text-red-700"
                      } mt-1`}
                    >
                      <strong>Subject:</strong> {campaign.subject}
                    </p>
                    <div
                      className={`${
                        activeTab === "draft"
                          ? "text-gray-700"
                          : activeTab === "sent"
                          ? "text-green-700"
                          : "text-red-700"
                      } mt-2 prose max-w-none`}
                      // Render HTML for message
                      dangerouslySetInnerHTML={{ __html: campaign.message }}
                    />
                    <p
                      className={`${
                        activeTab === "draft"
                          ? "text-gray-600"
                          : activeTab === "sent"
                          ? "text-green-600"
                          : "text-red-600"
                      } mt-3 text-sm`}
                    >
                      <strong>Recipients:</strong> {JSON.stringify(campaign.recipients.map(r => r.email))}
                    </p>

                    {campaign.status === "Sent" && (
                      <p className="mt-2 text-sm font-semibold text-green-600">
                        Status: Sent 🎉
                      </p>
                    )}
                    {campaign.status === "Failed" && (
                      <p className="mt-2 text-sm font-semibold text-red-600">
                        Status: Failed ❌
                      </p>
                    )}
                    {campaign.status === "Sending" && (
                      <p className="mt-2 text-sm font-semibold text-purple-600">
                        Status: Sending... ⏳
                      </p>
                    )}
                  </div>

                  {activeTab === "draft" && campaign.status !== "Sending" && (
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

 