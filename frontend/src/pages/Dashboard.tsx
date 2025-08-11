import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import apiClient from "../api/axiosInstance";

const Dashboard: React.FC = () => {
  const [campaignCount, setCampaignCount] = useState(0);
  const [draftCount, setDraftCount] = useState(0);
  const [contactCount, setContactCount] = useState(0);
  const [emailsSent, setEmailsSent] = useState(0);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedUserId = localStorage.getItem("userId");

    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserEmail(parsedUser.email || "");
    }

    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchStats = async () => {
      try {
        const [campaignRes, contactRes] = await Promise.all([
          apiClient.get(`http://localhost:5000/api/campaigns?userId=${userId}`),
          apiClient.get(`http://localhost:5000/api/contacts?userId=${userId}`),
        ]);

        const campaigns = campaignRes.data;
        setCampaignCount(campaigns.filter((c: any) => c.status?.toLowerCase() === "sent").length);
        setDraftCount(campaigns.filter((c: any) => !c.status || c.status.toLowerCase() === "draft").length);

        setContactCount(contactRes.data.length);

        let totalEmails = 0;
        for (const campaign of campaigns) {
          if (campaign.status && campaign.status.trim().toLowerCase() === "sent") {
            const recips = campaign.recipients || [];
            const uniqueEmails = Array.from(
              new Set(
                recips.map((r: string | { email: string }) =>
                  typeof r === "string" ? r : r.email
                )
              )
            );
            totalEmails += uniqueEmails.length;
          }
        }

        setEmailsSent(totalEmails);
      } catch (error: any) {
        console.error(
          "Failed to fetch dashboard stats:",
          error?.response?.data || error.message
        );
      }
    };

    fetchStats();
  }, [userId]);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-6">
        <div className="max-w-5xl mx-auto bg-white shadow-xl rounded-lg p-10">
          <h1 className="text-4xl font-extrabold mb-10 text-center text-purple-700">
            MailFlow Dashboard
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-10">
            {/* Total Contacts */}
            <div className="bg-purple-100 p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center">
              <h3 className="text-lg font-semibold text-purple-800">Total Contacts</h3>
              <p className="mt-2 text-4xl font-extrabold text-purple-900">{contactCount}</p>
            </div>

            {/* Sent Campaigns */}
            <div className="bg-green-100 p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center">
              <h3 className="text-lg font-semibold text-green-800">Sent Campaigns</h3>
              <p className="mt-2 text-4xl font-extrabold text-green-900">{campaignCount}</p>
            </div>

            {/* Draft Campaigns */}
            <div className="bg-yellow-100 p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center">
              <h3 className="text-lg font-semibold text-yellow-800">Draft Campaigns</h3>
              <p className="mt-2 text-4xl font-extrabold text-yellow-900">{draftCount}</p>
            </div>

            {/* Emails Sent */}
            <div className="bg-blue-100 p-6 rounded-lg shadow hover:shadow-lg transition-shadow text-center">
              <h3 className="text-lg font-semibold text-blue-800">Emails Sent</h3>
              <p className="mt-2 text-4xl font-extrabold text-blue-900">{emailsSent}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
            <Link to="/contacts" className="group">
              <div className="bg-purple-50 p-8 rounded-xl shadow-lg cursor-pointer hover:bg-purple-100 transition">
                <h2 className="text-2xl font-semibold text-purple-700 group-hover:text-purple-900">
                  Manage Contacts
                </h2>
                <p className="mt-3 text-purple-600 group-hover:text-purple-800">
                  Add, edit, or delete your email contacts.
                </p>
              </div>
            </Link>

            <Link to="/campaigns" className="group">
              <div className="bg-green-50 p-8 rounded-xl shadow-lg cursor-pointer hover:bg-green-100 transition">
                <h2 className="text-2xl font-semibold text-green-700 group-hover:text-green-900">
                  Create Campaign
                </h2>
                <p className="mt-3 text-green-600 group-hover:text-green-800">
                  Select recipients and send email campaigns.
                </p>
              </div>
            </Link>
          </div>

          <div className="text-center mt-10">
            <p className="text-gray-700 mb-5">
              Logged in as:{" "}
              <span className="font-semibold text-gray-900">{userEmail}</span>
            </p>
            <Link to="/campaigns">
              <button className="bg-purple-600 text-white px-6 py-3 rounded-full hover:bg-purple-700 transition">
                Create Campaign
              </button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
