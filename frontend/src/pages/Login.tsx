import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../api/axiosInstance";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const loginData = {
        email :email.trim() ,
        password :password,
      }
      const res = await apiClient.post("http://localhost:5000/api/auth/", loginData);
      const token =res.data.token ;
      const user = res.data.user;
      if (user && user._id) {
    
        localStorage.setItem("token", token);
        localStorage.setItem("userId", user._id);
        localStorage.setItem("user", JSON.stringify({ email: user.email }));
        navigate("/dashboard", {replace : true});
      } else {
        setErrorMsg("Invalid response: user ID missing");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-purple-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-6">
          Welcome Back to MailFlow 👋
        </h2>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Your Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Your Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Enter your password"
            />
          </div>

          {errorMsg && (
            <p className="text-red-500 text-sm text-center">{errorMsg}</p>
          )}

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
          >
            Log In
          </button>
        </form>
        <a href="/forgot-password" className="text-sm underline">
  Forgot password?
</a>


        <p className="mt-6 text-center text-sm text-gray-600">
          New to MailFlow?{' '}
          <Link
            to="/register"
            className="text-blue-600 font-medium hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
