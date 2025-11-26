import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Loader2 } from 'lucide-react';

// Simple admin dashboard – protected by the `ProtectedRoute` component in App.jsx
// Shows basic stats and lists of users & properties for quick overview.
export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [stats, setStats] = useState({ users: 0, properties: 0, bookings: 0 });

  // Fetch data on mount – adjust table names if your Supabase schema differs
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Users (assuming a "profiles" table holds user info)
        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, email, role')
          .order('created_at', { ascending: false });
        if (usersError) throw usersError;

        // Properties
        const { data: propsData, error: propsError } = await supabase
          .from('properties')
          .select('id, title, landlord_id, price')
          .order('created_at', { ascending: false });
        if (propsError) throw propsError;

        // Bookings (or inquiries) – adjust table name as needed
        const { count: bookingCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true });

        setUsers(usersData || []);
        setProperties(propsData || []);
        setStats({
          users: usersData?.length || 0,
          properties: propsData?.length || 0,
          bookings: bookingCount || 0,
        });
      } catch (err) {
        console.error('Admin dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-gray-600" />
        <span className="ml-2 text-gray-600">Loading admin data…</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-semibold text-gray-800">{stats.users}</p>
          <p className="text-gray-500">Total Users</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-semibold text-gray-800">{stats.properties}</p>
          <p className="text-gray-500">Properties Listed</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-2xl font-semibold text-gray-800">{stats.bookings}</p>
          <p className="text-gray-500">Bookings Received</p>
        </div>
      </div>

      {/* Recent Users */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Users</h2>
        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">ID</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Email</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.slice(0, 5).map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-2 text-sm text-gray-700">{u.id}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{u.email}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{u.role || 'renter'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Recent Properties */}
      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Properties</h2>
        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">ID</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Title</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">Price</th>
            </tr>
          </thead>
          <tbody>
            {properties.slice(0, 5).map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-2 text-sm text-gray-700">{p.id}</td>
                <td className="px-4 py-2 text-sm text-gray-700">{p.title}</td>
                <td className="px-4 py-2 text-sm text-gray-700">${p.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
