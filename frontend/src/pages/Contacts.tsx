import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import apiClient from '../api/axiosInstance';

type Contact = { _id?: string; name: string; email: string };

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [form, setForm] = useState<Contact>({ name: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const userId = localStorage.getItem('userId');

  const fetchContacts = async () => {
    try {
      if (!userId) {
        console.error('No userId found in localStorage');
        return;
      }
      const res = await apiClient.get('/api/contacts', {
        params: { userId },
      });
      setContacts(res.data);
    } catch (error) {
      console.error('Failed to fetch contacts', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!userId) {
        console.error('No userId found in localStorage');
        return;
      }

      if (!form.name.trim() || !form.email.trim()) {
        alert('Name and email cannot be empty');
        return;
      }

      setLoading(true);

      if (form._id) {
        await apiClient.put(`/api/contacts/${form._id}`, {
          ...form,
          userId,
        });
      } else {
        await apiClient.post('/api/contacts', {
          ...form,
          userId,
        });
      }

      setForm({ name: '', email: '' });
      fetchContacts();
    } catch (error: any) {
      console.error('Failed to save contact', error);
      if (error.response?.data?.error) {
        alert(`Error: ${error.response.data.error}`);
      } else {
        alert('Something went wrong while saving the contact.');
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id: string) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      if (!userId) {
        console.error('No userId found in localStorage');
        return;
      }
      setLoading(true);
      const res = await apiClient.delete(`/api/contacts/${deletingId}`, {
        params: { userId },
      });
      alert(res.data.message || 'Contact deleted');
      fetchContacts();
    } catch (error: any) {
      console.error('Failed to delete contact', error);
      if (error.response?.data?.error) {
        alert(`Error: ${error.response.data.error}`);
      } else {
        alert('Failed to delete contact');
      }
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setDeletingId(null);
    }
  };

  const handleEdit = (contact: Contact) => setForm(contact);

  useEffect(() => {
    fetchContacts();
  }, []);

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-extrabold mb-6 text-center text-gray-900">Your Contacts</h1>

       
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-md rounded-lg p-6 mb-8"
          noValidate
        >
          <div className="mb-4">
            <label htmlFor="name" className="block font-medium mb-1 text-gray-700">
              Name
            </label>
            <input
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="What's their name?"
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block font-medium mb-1 text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="What's their email address?"
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-md font-semibold text-white transition ${
              loading
                ? 'bg-blue-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300'
            }`}
          >
            {form._id ? (loading ? 'Updating...' : 'Update Contact') : loading ? 'Adding...' : 'Add Contact'}
          </button>
        </form>


        {contacts.length === 0 ? (
          <p className="text-center text-gray-500">No contacts yet. Add someone you know!</p>
        ) : (
          <ul className="space-y-4">
            {contacts.map((c) => (
              <li
                key={c._id}
                className="bg-white rounded-lg shadow p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-gray-800">{c.name}</p>
                  <p className="text-sm text-gray-500">{c.email}</p>
                </div>

                <div className="space-x-3">
                  <button
                    onClick={() => handleEdit(c)}
                    className="text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => confirmDelete(c._id!)}
                    className="text-red-600 hover:text-red-800 font-medium focus:outline-none focus:ring-2 focus:ring-red-400 rounded"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
              <h2 className="text-xl font-semibold mb-4">Delete Contact?</h2>
              <p className="mb-6">Are you sure you want to remove this contact? This can't be undone.</p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-100 focus:outline-none"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 focus:outline-none"
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
