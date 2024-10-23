import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/EditProfile.css';

const EditProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState(null);
  const [email, setEmail] = useState('');
  const [discord, setDiscord] = useState('');
  const [telegram, setTelegram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [errors, setErrors] = useState({});
  const [bio, setBio] = useState('');

  useEffect(() => {

    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/users/${username}`);
        const data = response.data;
        setAvatar(data.avatar);
        setEmail(data.email);
        setDiscord(data.discord);
        setTelegram(data.telegram);
        setTwitter(data.twitter || '');
        setLinkedin(data.linkedin || '');
        setBio(data.bio || '');

      } catch (error) {
        console.error('Error fetching user data', error);
      }
    };

    const storedUsername = localStorage.getItem('username');
    if (storedUsername && storedUsername !== username) {
      navigate(`/edit-profile/${storedUsername}`);
    }else {
      fetchUserData();
    }
  }, [username, navigate]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('username', username);

      try {
        const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/upload-avatar`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        setAvatar(response.data.avatarUrl);
      } catch (error) {
        console.error('Error uploading avatar', error);
      }
    }
  };


  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let validationErrors = {};
    if (!validateEmail(email)) {
      validationErrors.email = 'Invalid email format';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    try {
      const updateData = {
        avatar,
        email,
        discord,

        twitter,
        linkedin,
        bio


      };
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/users/${username}`, updateData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('github_token')}`
        },
        withCredentials: true
      });
      navigate(`/profile/${username}`);
    } catch (error) {
      console.error('Error updating user data', error);
    }
  };

  return (
    <div className="profile-container">
      <h1 className="title">Edit Profile</h1>
      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="avatar-section">
          <img src={avatar || 'https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611746.jpg'} alt="Avatar" className="avatar" />
          <input type="file" id="avatar-upload" onChange={handleAvatarChange} hidden />

        </div>
        <div className="form-section">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="darth.vader@starwars.com"
            />
            {errors.email && <span className="error">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label>Discord</label>
            <input
              type="text"
              value={discord}
              onChange={(e) => setDiscord(e.target.value)}
              placeholder="SirVader1234"
            />
          </div>

          <div className="form-group">
            <label>X</label>
            <input
              type="text"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="Your username without the @"
            />
            {errors.twitter && <span className="error">{errors.twitter}</span>}
          </div>
          <div className="form-group">
            <label>LinkedIn</label>
            <input
              type="text"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="Your LinkedIn URL"
            />
            {errors.linkedin && <span className="error">{errors.linkedin}</span>}
          </div>
          <div className="form-group full-width">
            <label>Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Let the world know who you are"
            />
          </div>

        </div>
        <button className="signup-button" type="submit">Save</button>
      </form>
    </div>
  );
};

export default EditProfile;
