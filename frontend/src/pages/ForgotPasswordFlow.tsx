import React, { useEffect, useState } from "react";
import apiClient from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";

type Step = 1 | 2 | 3;

const ForgotPasswordFlow: React.FC = () => {
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [otpVerified, setOtpVerified] = useState(false);
  const navigate = useNavigate();

  const passwordOk =
    newPassword.length >= 8 &&
    /[A-Z]/.test(newPassword) &&
    /[a-z]/.test(newPassword) &&
    /[0-9]/.test(newPassword);

  useEffect(() => {
    if (step === 2 && countdown > 0) {
      const id = setInterval(() => setCountdown((c) => c - 1), 1000);
      return () => clearInterval(id);
    }
  }, [step, countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!email) return setError("Please enter your email");

    try {
      setLoading(true);
      await apiClient.post("/api/auth/forgot-password", { email });
      setMessage("OTP sent to your email. Check inbox/spam.");
      setStep(2);
      setCountdown(60);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!otp || otp.length !== 6) return setError("Enter the 6-digit OTP");

    try {
      setLoading(true);
      await apiClient.post("/api/auth/verify-otp", { email, otp });
      setOtpVerified(true);
      setMessage("OTP verified. Please set a new password.");
      setStep(3);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    setMessage(null);
    try {
      setLoading(true);
      await apiClient.post("/api/auth/forgot-password", { email });
      setMessage("OTP re-sent. It’s valid for 1 minute.");
      setCountdown(60);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!otpVerified) return setError("Please verify OTP first");
    if (!passwordOk) return setError("Password must be 8+ chars with A-Z, a-z, 0-9");
    if (newPassword !== confirmPassword) return setError("Passwords do not match");

    try {
      setLoading(true);
      await apiClient.post("/api/auth/reset-password", {
        email,
        newPassword,
        confirmPassword,
      });
      setMessage("Password updated. You can now log in with the new password.");
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ["Enter Email", "Verify OTP", "Reset Password"];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-lg p-6 transition-all">
       
        <div className="flex justify-between items-center mb-6">
          {stepLabels.map((label, index) => {
            const stepNum = index + 1;
            const isActive = step === stepNum;
            const isCompleted = step > stepNum;

            return (
              <div key={label} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-full border-2 text-sm font-semibold transition-all ${
                    isCompleted
                      ? "bg-green-500 border-green-500 text-white"
                      : isActive
                      ? "bg-black border-black text-white"
                      : "bg-gray-200 border-gray-300 text-gray-500"
                  }`}
                >
                  {stepNum}
                </div>
                <p
                  className={`text-xs mt-1 text-center ${
                    isActive || isCompleted ? "text-black" : "text-gray-400"
                  }`}
                >
                  {label}
                </p>
              </div>
            );
          })}
        </div>

        <h1 className="text-xl font-semibold mb-2">Forgot Password</h1>
        <p className="text-sm text-gray-500 mb-4">
          {step === 1 && "Enter your registered email to receive an OTP."}
          {step === 2 && "Enter the OTP we sent to your email."}
          {step === 3 && "Set a new password for your account."}
        </p>

        {error && (
          <div className="mb-3 text-red-700 text-sm bg-red-100 border border-red-200 rounded p-2 animate-fadeIn">
            {error}
          </div>
        )}
        {message && (
          <div className="mb-3 text-green-700 text-sm bg-green-100 border border-green-200 rounded p-2 animate-fadeIn">
            {message}
          </div>
        )}

      
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-black"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-2 bg-black hover:bg-gray-800 transition text-white disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full border rounded-lg px-3 py-2 bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">OTP</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg px-4 py-2 bg-black hover:bg-gray-800 transition text-white disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading || countdown > 0}
                className="text-sm underline disabled:no-underline disabled:text-gray-400"
                title={countdown > 0 ? `Resend available in ${countdown}s` : "Resend OTP"}
              >
                {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                readOnly
                className="w-full border rounded-lg px-3 py-2 bg-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">New password</label>
              <input
                type="password"
                className="w-full border rounded-lg px-3 py-2"
                placeholder="At least 8 chars, A-Z, a-z, 0-9"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <p
                className={`text-xs mt-1 ${
                  passwordOk ? "text-green-600" : "text-gray-500"
                }`}
              >
                Must be 8+ chars with uppercase, lowercase, and number.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Confirm new password
              </label>
              <input
                type="password"
                className="w-full border rounded-lg px-3 py-2"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !otpVerified}
              className="w-full rounded-lg py-2 bg-black hover:bg-gray-800 transition text-white disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save New Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordFlow;
