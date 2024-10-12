import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { FaGithub, FaCaretDown } from 'react-icons/fa';
import logo from '../assets/images/betalogo.webp';
import { UserContext } from '../contexts/UserContext';

const Navbar = styled.nav`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #1f1c1c;
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  img {
    height: 60px;
  }
`;

const NavLinks = styled.ul`
  display: flex;
  list-style: none;
  align-items: center;
`;

const NavLink = styled.li`
  margin-left: 2rem;
  a {
    color: white;
    text-decoration: none;
    font-size: 1rem;
    &:hover {
      text-decoration: none;
    }
  }
`;

const ConnectButton = styled(Link)`
  display: flex;
  align-items: center;
  background: linear-gradient(45deg, #ff6b6b, #f06543);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  color: white;
  text-decoration: none;
  margin-left: 2rem;
  cursor: pointer;
  &:hover {
    opacity: 0.9;
    text-decoration: none;
  }
  svg {
    margin-right: 0.5rem;
  }
`;

const LoginButton = styled.a`
  display: flex;
  align-items: center;
  background: linear-gradient(45deg, #ff6b6b, #f06543);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  color: white;
  text-decoration: none;
  margin-left: 2rem;
  cursor: pointer;
  &:hover {
    opacity: 0.9;
    text-decoration: none;
  }
  svg {
    margin-right: 0.5rem;
  }
`;

const UserMenu = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  margin-left: 2rem;
`;

const DropdownButton = styled.button`
  display: flex;
  align-items: center;
  background: linear-gradient(45deg, #ff6b6b, #f06543);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  color: white;
  cursor: pointer;
  &:hover {
    opacity: 0.9;
  }
  svg {
    margin-left: 0.5rem; /* Space between username and arrow */
  }
`;

const DropdownContent = styled.div`
  display: none;
  position: absolute;
  background-color: #1f1c1c;
  min-width: 160px;
  box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
  z-index: 1;
  right: 0;
  top: 100%; /* Position below the button */
  border-radius: 5px;
  padding: 0.5rem 0; /* Adjust padding */
  
  ${UserMenu}:hover & {
    display: flex;
    flex-direction: column; /* Make items appear vertically */
  }
`;
const DropdownItem = styled(Link)`
  color: white;
  padding: 0.5rem 1rem; /* Adjust padding */
  text-decoration: none;
  display: flex; /* Display flex for horizontal alignment */
  align-items: center;
  justify-content: center; /* Center items */
  &:hover {
    background-color: #575757;
    text-decoration: none;
  }
`;


const LogoutItem = styled.button`
  color: white;
  padding: 0.5rem 1rem; /* Adjust padding */
  background: none;
  border: none;
  cursor: pointer;
  display: flex; /* Display flex for horizontal alignment */
  align-items: center;
  justify-content: center; /* Center items */
  width: 100%; /* Ensure full width for hover effect */
  &:hover {
    background-color: #575757;
  }
`;

const NavBar = () => {
  const { username, handleLogin, handleLogout } = useContext(UserContext);
  const navigate = useNavigate();

  return (
    <Navbar>
      <Logo to="/">
        <img src={logo} alt="Logo" loading="lazy" />
      </Logo>
      <NavLinks>
        <NavLink>
          <Link to="/">Projects</Link>
        </NavLink>
        <NavLink>
          <Link to="/training">Training</Link>
        </NavLink>
        <NavLink>
          <Link to="/leaderboard">Leaderboard</Link>
        </NavLink>
        <NavLink>
          <Link to="/judging">Reviewing</Link>
        </NavLink>
        <NavLink>
          <a href="https://codecall.gitbook.io/code-call" target="_blank" rel="noopener noreferrer">
            Documentation
          </a>
        </NavLink>
        <NavLink>
          {username ? (
            <UserMenu>
              <DropdownButton>
                {username}
                <FaCaretDown />
              </DropdownButton>
              <DropdownContent>
                <DropdownItem to={`/profile/${username}`}>My Profile</DropdownItem>
                <DropdownItem to={`/edit-profile/${username}`}>Edit Profile</DropdownItem>
                <LogoutItem onClick={handleLogout}>Logout</LogoutItem>
              </DropdownContent>
            </UserMenu>
          ) : (
            <LoginButton onClick={handleLogin}>
              <FaGithub />
              Connect GitHub
            </LoginButton>
          )}
        </NavLink>
      </NavLinks>
    </Navbar>
  );
};
//revert
export default NavBar;
