import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';

type Contact = { _id?: string; name: string; email: string };

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [form, setForm] = useState<Contact>({ name: '', email: '' });
  const userId = localStorage.getItem('userId');

  const fetchContacts = async () => {
    try {
      if (!userId) {
        console.error("❌ No userId found in localStorage");
        return;
      }
      const res = await axios.get('http://localhost:5000/api/contacts', {
        params: { userId },
      });
      setContacts(res.data);
    } catch (error) {
      console.error("❌ Failed to fetch contacts", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!userId) {
        console.error("❌ No userId found in localStorage");
        return;
      }

      if (!form.name.trim() || !form.email.trim()) {
        console.error("❌ Name and email cannot be empty");
        return;
      }

      if (form._id) {
        await axios.put(`http://localhost:5000/api/contacts/${form._id}`, {
          ...form,
          userId,
        });
      } else {
        await axios.post('http://localhost:5000/api/contacts', {
          ...form,
          userId,
        });
      }

      setForm({ name: '', email: '' });
      fetchContacts();
    } catch (error) {
      console.error("❌ Failed to save contact", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!userId) {
        console.error("❌ No userId found in localStorage");
        return;
      }
      await axios.delete(`http://localhost:5000/api/contacts/${id}`, {
        params: { userId },
      });
      fetchContacts();
    } catch (error) {
      console.error("❌ Failed to delete contact", error);
    }
  };

  const handleEdit = (contact: Contact) => setForm(contact);

  useEffect(() => {
    fetchContacts();
  }, []);

  return (
    <>
      <Navbar />
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Contacts</h1>
        <form onSubmit={handleSubmit} className="space-x-2 mb-4">
          <input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Name"
            className="border p-1"
            required
          />
          <input
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            placeholder="Email"
            className="border p-1"
            required
          />
          <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded">
            {form._id ? 'Update' : 'Add'}
          </button>
        </form>

        <ul>
          {contacts.map(c => (
            <li key={c._id} className="mb-2">
              {c.name} ({c.email})
              <button onClick={() => handleEdit(c)} className="ml-2 text-blue-500">Edit</button>
              <button onClick={() => handleDelete(c._id!)} className="ml-2 text-red-500">Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
