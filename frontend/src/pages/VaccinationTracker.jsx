import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Calendar, AlertTriangle, Syringe, Plus, Edit2, Trash2, Save, X, Clock, Award, Heart, Shield, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const VaccinationTracker = ({ isDarkMode = true }) => {
  const { getToken, isSignedIn } = useAuth();
  const [vaccinations, setVaccinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVaccine, setNewVaccine] = useState({
    name: '',
    due_date: '',
    status: 'pending',
    last_date: '',
    notes: '',
    required: false,
    pet_name: ''
  });

  const fetchVaccinations = async () => {
    if (!isSignedIn) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const token = await getToken();
      const response = await fetch(`${API_URL}/vaccinations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch vaccinations');

      const data = await response.json();
      setVaccinations(data.vaccinations || []);
    } catch (err) {
      console.error('Error fetching vaccinations:', err);
      setError('Failed to load vaccinations');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!isSignedIn) return;
    
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/vaccinations/stats/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchVaccinations();
      fetchStats();
    }
  }, [isSignedIn]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40';
      case 'upcoming': return 'text-cyan-400 bg-cyan-500/20 border-cyan-500/40';
      case 'overdue': return 'text-rose-400 bg-rose-500/20 border-rose-500/40';
      case 'pending': return 'text-amber-400 bg-amber-500/20 border-amber-500/40';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/40';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'overdue': return <AlertTriangle className="w-4 h-4" />;
      case 'upcoming': return <Clock className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  const handleEdit = (vaccine) => {
    setEditingId(vaccine.id);
    setEditForm({
      name: vaccine.name,
      due_date: vaccine.due_date,
      status: vaccine.status,
      last_date: vaccine.last_date || '',
      notes: vaccine.notes,
      required: vaccine.required,
      pet_name: vaccine.pet_name || ''
    });
  };

  const handleSaveEdit = async (id) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/vaccinations/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) throw new Error('Failed to update vaccination');

      await fetchVaccinations();
      await fetchStats();
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      console.error('Error updating vaccination:', err);
      alert('Failed to update vaccination');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vaccination record?')) {
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/vaccinations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete vaccination');

      await fetchVaccinations();
      await fetchStats();
    } catch (err) {
      console.error('Error deleting vaccination:', err);
      alert('Failed to delete vaccination');
    }
  };

  const handleAddVaccine = async () => {
    if (!newVaccine.name || !newVaccine.due_date) {
      alert('Please fill in vaccine name and due date');
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/vaccinations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newVaccine),
      });

      if (!response.ok) throw new Error('Failed to create vaccination');

      await fetchVaccinations();
      await fetchStats();
      setNewVaccine({
        name: '',
        due_date: '',
        status: 'pending',
        last_date: '',
        notes: '',
        required: false,
        pet_name: ''
      });
      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding vaccination:', err);
      alert('Failed to add vaccination');
    }
  };

  const bgClass = isDarkMode
    ? 'bg-gradient-to-br from-gray-900 via-slate-800 to-black'
    : 'bg-gradient-to-br from-indigo-400 to-purple-700';

  if (!isSignedIn) {
    return (
      <div className={`min-h-screen ${bgClass} py-20 px-4 flex items-center justify-center`}>
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
          <p className="text-white/70">Please sign in to access your vaccination tracker</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`min-h-screen ${bgClass} py-20 px-4 flex items-center justify-center`}>
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg font-semibold">Loading vaccinations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${bgClass} py-20 px-4 sm:px-6 lg:px-8`}>
      <div className="max-w-7xl mx-auto mt-6">
        {/* Header */}
        <div className="mb-6 backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-4 rounded-xl">
                <Syringe className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Vaccination Tracker</h1>
                <p className="text-white/60 text-sm mt-1">Keep your pet protected and healthy</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  fetchVaccinations();
                  fetchStats();
                }}
                className="p-3 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl hover:bg-white/15"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl hover:opacity-90"
              >
                <Plus className="w-5 h-5" />
                Add Vaccine
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 backdrop-blur-xl bg-rose-500/20 border border-rose-500/40 rounded-xl p-4">
            <p className="text-rose-300 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {error}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Total', value: stats?.total || 0, icon: Syringe, color: 'from-violet-500 to-purple-600' },
            { label: 'Completed', value: stats?.completed || 0, icon: CheckCircle, color: 'from-emerald-500 to-teal-600' },
            { label: 'Overdue', value: stats?.overdue || 0, icon: AlertTriangle, color: 'from-rose-500 to-red-600' },
            { label: 'Upcoming', value: stats?.upcoming || 0, icon: Clock, color: 'from-cyan-500 to-blue-600' },
            { label: 'Complete', value: `${Math.round(stats?.completion_rate || 0)}%`, icon: Award, color: 'from-amber-500 to-orange-600' }
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-5 h-5 text-white/60" />
                  <div className="text-xs text-white/50 uppercase font-semibold">{stat.label}</div>
                </div>
                <div className={`text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">Add New Vaccine</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-white/70 text-sm font-semibold mb-2">Vaccine Name</label>
                <input
                  type="text"
                  placeholder="e.g., Rabies, DHPP"
                  value={newVaccine.name}
                  onChange={(e) => setNewVaccine({ ...newVaccine, name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm font-semibold mb-2">Pet Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g., Max, Bella"
                  value={newVaccine.pet_name}
                  onChange={(e) => setNewVaccine({ ...newVaccine, pet_name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm font-semibold mb-2">Due Date</label>
                <input
                  type="date"
                  value={newVaccine.due_date}
                  onChange={(e) => setNewVaccine({ ...newVaccine, due_date: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm font-semibold mb-2">Last Given Date</label>
                <input
                  type="date"
                  value={newVaccine.last_date}
                  onChange={(e) => setNewVaccine({ ...newVaccine, last_date: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-400"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm font-semibold mb-2">Status</label>
                <select
                  value={newVaccine.status}
                  onChange={(e) => setNewVaccine({ ...newVaccine, status: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-400"
                >
                  <option value="pending" className="bg-slate-800">Pending</option>
                  <option value="upcoming" className="bg-slate-800">Upcoming</option>
                  <option value="completed" className="bg-slate-800">Completed</option>
                  <option value="overdue" className="bg-slate-800">Overdue</option>
                </select>
              </div>
              <div>
                <label className="block text-white/70 text-sm font-semibold mb-2">Notes</label>
                <input
                  type="text"
                  placeholder="Additional information..."
                  value={newVaccine.notes}
                  onChange={(e) => setNewVaccine({ ...newVaccine, notes: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-purple-400"
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newVaccine.required}
                    onChange={(e) => setNewVaccine({ ...newVaccine, required: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                  <Shield className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold">Required Vaccine</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleAddVaccine}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-lg hover:opacity-90"
              >
                <Save className="w-5 h-5" />
                Save Vaccine
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 bg-white/5 border border-white/10 text-white font-semibold rounded-lg hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {vaccinations.length === 0 && !loading && (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-12 text-center">
            <Syringe className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">No Vaccinations Yet</h3>
            <p className="text-white/60 mb-6">Start tracking your pet's vaccinations</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl"
            >
              <Plus className="w-5 h-5" />
              Add First Vaccine
            </button>
          </div>
        )}

        {/* Table View */}
        {vaccinations.length > 0 && (
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5">
                    <th className="text-left p-4 text-white/70 font-semibold text-xs uppercase">Status</th>
                    <th className="text-left p-4 text-white/70 font-semibold text-xs uppercase">Vaccine</th>
                    <th className="text-left p-4 text-white/70 font-semibold text-xs uppercase">Pet</th>
                    <th className="text-left p-4 text-white/70 font-semibold text-xs uppercase">Last Given</th>
                    <th className="text-left p-4 text-white/70 font-semibold text-xs uppercase">Due Date</th>
                    <th className="text-left p-4 text-white/70 font-semibold text-xs uppercase">Type</th>
                    <th className="text-right p-4 text-white/70 font-semibold text-xs uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vaccinations.map((vaccine) => (
                    <tr key={vaccine.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(vaccine.status)}`}>
                          {getStatusIcon(vaccine.status)}
                          {vaccine.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-white font-semibold">{vaccine.name}</div>
                        {vaccine.notes && <div className="text-white/50 text-xs mt-1">{vaccine.notes}</div>}
                      </td>
                      <td className="p-4">
                        {vaccine.pet_name ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold bg-pink-500/20 text-pink-300">
                            <Heart className="w-3 h-3" />
                            {vaccine.pet_name}
                          </span>
                        ) : (
                          <span className="text-white/40">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-white/70 text-sm">{vaccine.last_date || 'Not given yet'}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-white/70 text-sm">{vaccine.due_date}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${vaccine.required ? 'bg-rose-500/20 text-rose-300' : 'bg-cyan-500/20 text-cyan-300'}`}>
                          <Shield className="w-3 h-3" />
                          {vaccine.required ? 'Required' : 'Optional'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(vaccine)}
                            className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-blue-300" />
                          </button>
                          <button
                            onClick={() => handleDelete(vaccine.id)}
                            className="p-2 bg-rose-500/20 hover:bg-rose-500/30 rounded-lg"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-rose-300" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingId && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="backdrop-blur-xl bg-slate-900/95 border border-white/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-bold text-white mb-4">Edit Vaccine</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-white/70 text-sm font-semibold mb-2">Vaccine Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-semibold mb-2">Pet Name</label>
                  <input
                    type="text"
                    value={editForm.pet_name}
                    onChange={(e) => setEditForm({ ...editForm, pet_name: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-semibold mb-2">Status</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-400"
                  >
                    <option value="pending" className="bg-slate-800">Pending</option>
                    <option value="upcoming" className="bg-slate-800">Upcoming</option>
                    <option value="completed" className="bg-slate-800">Completed</option>
                    <option value="overdue" className="bg-slate-800">Overdue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-semibold mb-2">Last Given</label>
                  <input
                    type="date"
                    value={editForm.last_date || ''}
                    onChange={(e) => setEditForm({ ...editForm, last_date: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-semibold mb-2">Due Date</label>
                  <input
                    type="date"
                    value={editForm.due_date}
                    onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm font-semibold mb-2">Notes</label>
                  <input
                    type="text"
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-400"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editForm.required}
                      onChange={(e) => setEditForm({ ...editForm, required: e.target.checked })}
                      className="w-5 h-5 rounded"
                    />
                    <Shield className="w-5 h-5 text-purple-400" />
                    <span className="font-semibold">Required Vaccine</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleSaveEdit(editingId)}
                  className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-lg hover:opacity-90"
                >
                  <Save className="w-5 h-5" />
                  Save Changes
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-6 py-2 bg-white/5 border border-white/10 text-white font-semibold rounded-lg hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VaccinationTracker;