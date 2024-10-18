// UserContext.js
import axios from "axios";
import React, { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [username, setUsername] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    const clientID = process.env.REACT_APP_GITHUB_CLIENT_ID;
    const redirectUri = process.env.REACT_APP_REDIRECT_URI;
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientID}&redirect_uri=${redirectUri}`;
  };

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("github_token");
    setUsername("");
    setAccessToken("");
    navigate("/");
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const storedUsername = localStorage.getItem("username");
    const storedToken = localStorage.getItem("github_token");

    const fetchGitHubUser = async (code) => {
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_BACKEND_URL}/authenticate`,
          { code }
        );
        setUsername(response.data.username);
        setAccessToken(response.data.accessToken);
        localStorage.setItem("username", response.data.username);
        localStorage.setItem("github_token", response.data.accessToken);
        navigate(`/profile/${response.data.username}`);
      } catch (error) {
        console.error("Error fetching GitHub user", error);
      }
    };

    if (code) {
      fetchGitHubUser(code);
    } else if (storedUsername && storedToken) {
      setUsername(storedUsername);
      setAccessToken(storedToken);
    }
  }, [navigate]);

  useEffect(() => {
    console.log("Username:", username);
    console.log("Access Token:", accessToken);
  }, [username, accessToken]);

  return (
    <UserContext.Provider
      value={{ username, accessToken, handleLogin, handleLogout }}
    >
      {children}
    </UserContext.Provider>
  );
};
