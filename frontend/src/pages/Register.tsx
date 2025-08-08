import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function Register() {
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (userData.password !== userData.confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        {
          username: userData.username.trim(),
          email: userData.email.trim(),
          password: userData.password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );


      localStorage.setItem("token", response.data.token);
       localStorage.setItem('userId', response.data.user._id);

      localStorage.setItem(
        "user",
        JSON.stringify({ email: userData.email.trim() })
      );
      const userId = response.data.userId;
      if (userId) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("userId", userId);
        localStorage.setItem(
          "user",
          JSON.stringify({ email: userData.email.trim() })
        );
        navigate("/");
      } else {
        setErrorMsg("Invalid response: user ID missing");
      }


      navigate("/");
    } catch (err: any) {
      const backendMsg = err.response?.data?.message;
      const fallback = err.message || "Registration failed";
      setErrorMsg(backendMsg || fallback);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-white to-blue-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-6">
          Create your MailFlow account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
         
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Username
            </label>
            <input
              type="text"
              name="username"
              required
              value={userData.username}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="JohnDoe"
            />
          </div>

        
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Email address
            </label>
            <input
              type="email"
              name="email"
              required
              value={userData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              value={userData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="••••••••"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              value={userData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="••••••••"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <p className="text-red-500 text-sm text-center">{errorMsg}</p>
          )}

          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
          >
            Register
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/" className="text-blue-600 font-medium hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
