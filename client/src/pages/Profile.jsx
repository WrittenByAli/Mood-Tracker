import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { profileApi } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { refreshUser } = useAuth();
  const fileRef = useRef(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    profileApi
      .get()
      .then((data) => {
        const user = data.user ?? data;
        setUsername(user.username || '');
        setBio(user.bio || '');
        setEmail(user.email || '');
        setAvatarPreview(user.profile_pic || user.profilePic || user.avatar || null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      if (avatarFile) {
        await profileApi.uploadAvatar(avatarFile);
      }

      const payload = { username, email, bio };
      if (newPassword) {
        payload.current_password = oldPassword;
        payload.new_password = newPassword;
      }

      await profileApi.update(payload);
      setSuccess('Profile updated successfully!');
      await refreshUser();
      setOldPassword('');
      setNewPassword('');
      setAvatarFile(null);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Pilot Profile</h1>

      <form onSubmit={handleSubmit}>
        <div className="page-grid page-grid-2">
          <motion.div
            className="glass-card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ padding: '1.5rem', textAlign: 'center' }}
          >
            <h3 style={{ fontSize: '0.7rem', color: '#00f5ff', marginBottom: '1.25rem', letterSpacing: '0.15em' }}>
              AVATAR
            </h3>

            <motion.div
              whileHover={{ scale: 1.05 }}
              onClick={() => fileRef.current?.click()}
              style={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                margin: '0 auto 1rem',
                background: avatarPreview
                  ? `url(${avatarPreview}) center/cover`
                  : 'linear-gradient(135deg, rgba(0,245,255,0.2), rgba(255,0,170,0.2))',
                border: '3px solid #00f5ff',
                boxShadow: '0 0 20px rgba(0,245,255,0.4)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
                overflow: 'hidden',
              }}
            >
              {!avatarPreview && '👤'}
            </motion.div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />

            <motion.button
              type="button"
              className="btn btn-secondary"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => fileRef.current?.click()}
              style={{ fontSize: '0.65rem' }}
            >
              Upload Avatar
            </motion.button>
          </motion.div>

          <motion.div
            className="glass-card"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{ padding: '1.5rem' }}
          >
            <h3 style={{ fontSize: '0.7rem', color: '#ff00aa', marginBottom: '1rem', letterSpacing: '0.15em' }}>
              IDENTITY
            </h3>

            <div className="input-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                className="input-field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                className="textarea-field"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Your mood tracking journey..."
                rows={3}
              />
            </div>
          </motion.div>

          <motion.div
            className="glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ padding: '1.5rem', gridColumn: '1 / -1' }}
          >
            <h3 style={{ fontSize: '0.7rem', color: '#ffd700', marginBottom: '1rem', letterSpacing: '0.15em' }}>
              SECURITY
            </h3>

            <div className="page-grid page-grid-2">
              <div className="input-group">
                <label htmlFor="oldPassword">Current Password</label>
                <input
                  id="oldPassword"
                  type="password"
                  className="input-field"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Only if changing password"
                />
              </div>
              <div className="input-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  className="input-field"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {error && <p className="error-msg" style={{ marginTop: '1rem' }}>{error}</p>}
        {success && <p className="success-msg" style={{ marginTop: '1rem' }}>{success}</p>}

        <motion.button
          type="submit"
          className="btn btn-primary"
          disabled={saving}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{ width: '100%', marginTop: '1.5rem', padding: '1rem' }}
        >
          {saving ? 'Saving...' : 'Save Profile'}
        </motion.button>
      </form>
    </div>
  );
}
