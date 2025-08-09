import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <nav className="bg-white shadow-md px-6 py-4 flex justify-between items-center">
      <h1 className="text-xl font-bold text-blue-600">MailFlow</h1>
      <div className="flex items-center gap-4">
        {userId && (
          <a
            href={`http://localhost:5000/api/auth/google/connect/${userId}`}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-300"
          >
            Connect Gmail
          </a>
        )}

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
