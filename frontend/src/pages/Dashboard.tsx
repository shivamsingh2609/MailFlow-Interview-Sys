import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";

const Dashboard: React.FC = () => {
  const [campaignCount, setCampaignCount] = useState(0);
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
          axios.get(`http://localhost:5000/api/campaigns?userId=${userId}`),
          axios.get(`http://localhost:5000/api/contacts?userId=${userId}`), 
        ]);

        setCampaignCount(campaignRes.data.length);
        setContactCount(contactRes.data.length);

        const totalEmails = campaignRes.data
          .filter((campaign: any) => campaign.status === "Sent")
          .reduce(
            (acc: number, campaign: any) =>
              acc + (campaign.recipients ? campaign.recipients.length : 0),
            0
          );

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
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">MailFlow Dashboard</h1>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-4 rounded shadow text-center">
              <h3 className="text-lg font-medium text-gray-600">Total Campaigns</h3>
              <p className="text-2xl font-bold">{campaignCount}</p>
            </div>
            <div className="bg-white p-4 rounded shadow text-center">
              <h3 className="text-lg font-medium text-gray-600">Total Contacts</h3>
              <p className="text-2xl font-bold">{contactCount}</p>
            </div>
            <div className="bg-white p-4 rounded shadow text-center">
              <h3 className="text-lg font-medium text-gray-600">Emails Sent</h3>
              <p className="text-2xl font-bold">{emailsSent}</p>
            </div>
          </div>

          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <Link to="/contacts">
              <div className="bg-blue-100 hover:bg-blue-200 p-6 rounded-lg shadow cursor-pointer transition duration-300">
                <h2 className="text-xl font-semibold">Manage Contacts</h2>
                <p className="mt-2 text-gray-700">Add, edit, or delete your email contacts.</p>
              </div>
            </Link>

            <Link to="/campaigns">
              <div className="bg-green-100 hover:bg-green-200 p-6 rounded-lg shadow cursor-pointer transition duration-300">
                <h2 className="text-xl font-semibold">Create Campaign</h2>
                <p className="mt-2 text-gray-700">Select recipients and send email campaigns.</p>
              </div>
            </Link>
          </div>

          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Logged in as: <span className="font-semibold">{userEmail}</span>
            </p>
            <Link to="/campaigns">
              <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
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
