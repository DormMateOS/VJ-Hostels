import React, { useState, useEffect } from 'react';
import { Settings, Plus, Trash2, Save, UserPlus, Shield, Clock } from 'lucide-react';
import useCurrentUser from '../../hooks/student/useCurrentUser';

const VisitorPreferences = () => {
  const { user } = useCurrentUser();
  const [preferences, setPreferences] = useState({
    allowVisitorsOutOfHours: false,
    requirePhotoVerification: true,
    maxVisitorsPerDay: 5,
    autoApproveParents: false
  });
  const [whitelist, setWhitelist] = useState([]);
  const [backupContacts, setBackupContacts] = useState([]);
  const [newContact, setNewContact] = useState({ name: '', phone: '', type: 'whitelist' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/otp/students/${user.id}/preferences`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setPreferences(data.preferences || preferences);
        setWhitelist(data.whitelist || []);
        setBackupContacts(data.backupContacts || []);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      setMessage({ type: 'error', text: 'Failed to load preferences' });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/api/otp/students/${user.id}/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          preferences,
          whitelist,
          backupContacts
        })
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Preferences saved successfully' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

  const addContact = () => {
    if (!newContact.name.trim() || !newContact.phone.trim()) {
      setMessage({ type: 'error', text: 'Please fill in both name and phone number' });
      return;
    }

    const contact = { name: newContact.name.trim(), phone: newContact.phone.trim() };
    
    if (newContact.type === 'whitelist') {
      setWhitelist(prev => [...prev, contact]);
    } else {
      setBackupContacts(prev => [...prev, contact]);
    }
    
    setNewContact({ name: '', phone: '', type: 'whitelist' });
    setMessage({ type: 'success', text: 'Contact added. Remember to save changes!' });
  };

  const removeContact = (index, type) => {
    if (type === 'whitelist') {
      setWhitelist(prev => prev.filter((_, i) => i !== index));
    } else {
      setBackupContacts(prev => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="visitor-preferences">
      <div className="container-fluid">
        <div className="row mb-4">
          <div className="col-12">
            <h2 className="h3 mb-1">
              <Settings size={24} className="me-2" />
              Visitor Preferences
            </h2>
            <p className="text-muted mb-0">Manage your visitor settings and approved contacts</p>
          </div>
        </div>

        {message && (
          <div className={`alert alert-${message.type === 'error' ? 'danger' : 'success'} alert-dismissible fade show`}>
            {message.text}
            <button type="button" className="btn-close" onClick={() => setMessage(null)}></button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <div className="row">
            {/* General Preferences */}
            <div className="col-lg-6 mb-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">
                    <Shield size={20} className="me-2" />
                    Security Settings
                  </h5>
                </div>
                <div className="card-body">
                  <div className="mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="allowOutOfHours"
                        checked={preferences.allowVisitorsOutOfHours}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          allowVisitorsOutOfHours: e.target.checked
                        }))}
                      />
                      <label className="form-check-label" htmlFor="allowOutOfHours">
                        <Clock size={16} className="me-1" />
                        Allow visitors during out-of-hours (10 PM - 6 AM)
                      </label>
                    </div>
                    <small className="text-muted">
                      When disabled, out-of-hours visits require warden approval
                    </small>
                  </div>

                  <div className="mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="requirePhoto"
                        checked={preferences.requirePhotoVerification}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          requirePhotoVerification: e.target.checked
                        }))}
                      />
                      <label className="form-check-label" htmlFor="requirePhoto">
                        Require photo verification for visitors
                      </label>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="autoApproveParents"
                        checked={preferences.autoApproveParents}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          autoApproveParents: e.target.checked
                        }))}
                      />
                      <label className="form-check-label" htmlFor="autoApproveParents">
                        Auto-approve visits from registered parent number
                      </label>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="maxVisitors" className="form-label">
                      Maximum visitors per day
                    </label>
                    <select
                      id="maxVisitors"
                      className="form-select"
                      value={preferences.maxVisitorsPerDay}
                      onChange={(e) => setPreferences(prev => ({
                        ...prev,
                        maxVisitorsPerDay: parseInt(e.target.value)
                      }))}
                    >
                      {[1,2,3,4,5,6,7,8,9,10].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Whitelist Management */}
            <div className="col-lg-6 mb-4">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">
                    <UserPlus size={20} className="me-2" />
                    Approved Contacts (Whitelist)
                  </h5>
                </div>
                <div className="card-body">
                  <p className="text-muted small mb-3">
                    Contacts in your whitelist can visit without OTP verification
                  </p>

                  {/* Add new contact */}
                  <div className="row g-2 mb-3">
                    <div className="col-5">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Contact name"
                        value={newContact.name}
                        onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="col-4">
                      <input
                        type="tel"
                        className="form-control form-control-sm"
                        placeholder="Phone number"
                        value={newContact.phone}
                        onChange={(e) => setNewContact(prev => ({ ...prev, phone: e.target.value }))}
                      />
                    </div>
                    <div className="col-3">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm w-100"
                        onClick={addContact}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Whitelist */}
                  <div className="border rounded p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {whitelist.length === 0 ? (
                      <p className="text-muted text-center py-3 mb-0">
                        No approved contacts yet
                      </p>
                    ) : (
                      whitelist.map((contact, index) => (
                        <div key={index} className="d-flex justify-content-between align-items-center py-2 border-bottom">
                          <div>
                            <div className="fw-medium">{contact.name}</div>
                            <small className="text-muted">{contact.phone}</small>
                          </div>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => removeContact(index, 'whitelist')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="col-12">
              <div className="card">
                <div className="card-body text-center">
                  <button
                    type="button"
                    className="btn btn-success btn-lg px-5"
                    onClick={savePreferences}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={20} className="me-2" />
                        Save All Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitorPreferences;
