import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { FaGithub, FaCaretDown } from "react-icons/fa";
import { IoMdMenu, IoMdClose } from "react-icons/io";
import logo from "../assets/images/betalogo.png";
import { UserContext } from "../contexts/UserContext";

const navbar_links = [
  { path: "/", name: "Projects" },
  { path: "/training", name: "Training" },
  { path: "/leaderboard", name: "Leaderboard" },
  { path: "/judging", name: "Reviewing" },
];

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
  position: relative;

  @media (max-width: 950px) {
    display: ${({ show }) =>
      show ? "flex" : "none"}; /* Show/Hide based on state */
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    position: absolute;
    top: 0;
    right: 0;
    background-color: white;
    width: auto;
    height: 100vh;
    transition: transform 0.3s ease-in-out;
    transform: ${({ show }) => (show ? "translateX(0)" : "translateX(100%)")};
    z-index: 999;
    padding: 2rem;
    overflow-y: auto;
  }
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

  @media (max-width: 950px) {
    margin-left: 0;

    a {
      color: black;
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

  @media (max-width: 950px) {
    margin-left: 0;
  }
`;

const UserMenu = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  margin-left: 2rem;

  @media (max-width: 950px) {
    margin-left: 0;
    z-index: 2;
    flex-direction: column;
  }

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


  @media (max-width: 950px) {

    display: none;
  
  }
`;

const DropdownContent = styled.div`
  display: none;
  position: absolute;
  background-color: #1f1c1c;
  min-width: 160px;
  box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
  z-index: 1;
  right: 0;
  top: 100%; /* Position below the button */
  border-radius: 5px;
  padding: 0.5rem 0; /* Adjust padding */

  ${UserMenu}:hover & {
    display: flex;
    flex-direction: column; /* Make items appear vertically */
  }

  @media (max-width: 950px) {
    display: flex;
    flex-direction: column;
    box-shadow: none;
    background-color: white;
    position: static;
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

  @media (max-width: 950px) {

    color: black;
    background: linear-gradient(45deg, #ff6b6b, #f06543);
    cursor: pointer;
    border-radius: .5rem;
  
  }

`;

const Menu = styled.div`
  color: white;
  font-size: 1.5rem;
  display: none;
  @media (max-width: 950px) {
    display: block;
  }
`;

const CloseIcon = styled.div`
  color: black;
  font-size: 1.5rem;
  position: absolute;
  top: 0;
  left: 1rem;
`;

const NavBar = () => {
  const { username, handleLogin, handleLogout } = useContext(UserContext);
  const navigate = useNavigate();

  const [showMenu, setShowMenu] = useState(false);

  const handleHideMenuList = () => {
    setShowMenu(false);
  };

  return (
    <Navbar>
      <Logo to="/">
        <img src={logo} alt="Logo" />
      </Logo>

      <Menu onClick={() => setShowMenu(true)}>
        <IoMdMenu />
      </Menu>

      <NavLinks show={showMenu}>
        {showMenu && (
          <CloseIcon onClick={handleHideMenuList}>
            <IoMdClose />
          </CloseIcon>
        )}

        {navbar_links?.map((el) => {
          return (
            <NavLink key={el.path} onClick={handleHideMenuList}>
              <Link to={el.path}>{el.name}</Link>
            </NavLink>
          );
        })}

        <NavLink onClick={handleHideMenuList}>
          <a
            href="https://codecall.gitbook.io/code-call"
            target="_blank"
            rel="noopener noreferrer"
          >
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
                <DropdownItem
                  onClick={handleHideMenuList}
                  to={`/profile/${username}`}
                >
                  My Profile
                </DropdownItem>
                <DropdownItem
                  onClick={handleHideMenuList}
                  to={`/edit-profile/${username}`}
                >
                  Edit Profile
                </DropdownItem>
                <LogoutItem
                  onClick={() => {
                    handleHideMenuList();
                    handleLogout();
                  }}
                >
                  Logout
                </LogoutItem>
              </DropdownContent>
            </UserMenu>
          ) : (
            <LoginButton
              onClick={() => {
                handleHideMenuList();
                handleLogin();
              }}
            >
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
