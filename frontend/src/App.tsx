
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Contacts from "./pages/Contacts";
import Campaigns from "./pages/Campaigns";
import Login from "./pages/Login";
import Register from "./pages/Register";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
       
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        
        
          <Route path="/dashboard" element={<Dashboard />} /> 
          <Route path="contacts" element={<Contacts />} />
          <Route path="campaigns" element={<Campaigns />} />
        
      </Routes>
    </BrowserRouter>
  );
}
