import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaGithub, FaLinkedin, FaTwitter, FaDiscord, FaCopy, FaPen } from 'react-icons/fa';
import axios from 'axios';
import { MoonPaySellWidget } from '@moonpay/moonpay-react';
import { UserContext } from '../contexts/UserContext';
import usdcIcon from '../assets/images/usdc.png';

const Container = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 20px;
  max-width: 1200px;
  margin: 120px auto 0; /* Increase the top margin to move it lower */
  height: 100%;
`;
const SvgIcon = styled.svg`
  width: 2rem;
  height: 2rem;
  fill: #ff6445;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;


const Card = styled.div`
  background-color: #2d2d2d;
  padding: 20px;
  border-radius: 10px;
  width: 500px; /* Set a fixed width */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  max-height: 550px;
  position: relative;
`;

const BalanceCard = styled(Card)`
  padding-bottom: 80px;
`;

const MessageCard = styled(Card)`
  text-align: center;
`;


const Header = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 10px;
  position: relative;
`;

const Tag = styled.div`
  background-color: #ff6445;
  color: white;
  border-radius: 15px;
  padding: 5px 10px;
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  font-weight: bold;
  margin: 0;
  justify-content: center;
  text-align: center;
`;
const TwitterIcon = () => (
  <SvgIcon viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z"/>
  </SvgIcon>
);
const TagLabel = styled.div`
  font-size: 0.8rem;
  margin-right: 5px;
`;

const TagValue = styled.div`
  font-size: 1rem;
  font-weight: bold;
`;

const InfoParagraph = styled.p`
  color: white;
  margin: 20px 0 40px 0;
  text-align: center;
  font-size: 0.9rem;
`;

const Avatar = styled.img`
  width: 180px;
  height: 180px;
  border-radius: 50%;
  margin-top: 20px;
  border: 4px solid #ff6445;
  background-color: #2d2d2d;
  box-shadow: 0px 0px 0px 3px #ffa400;
  background-clip: content-box;
`;

const Username = styled.div`
  color: #ff6445;
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
`;

const Icons = styled.div`
  display: flex;
  gap: 15px;
  justify-content: center;
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
`;

const Icon = styled.a`
  color: #ff6445;
  font-size: 2rem;
  cursor: pointer;
  &:hover {
    opacity: 0.9;
  }
`;

const Bio = styled.p`
  color: white;
  margin: 10px 0;
`;

const EditIcon = styled(FaPen)`
  color: white;
  cursor: pointer;
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 1rem;
  &:hover {
    opacity: 0.9;
  }
`;

const WithdrawButton = styled.button`
  background: #ff6445;
  border: none;
  padding: 15px;
  border-radius: 40px;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  width: 70%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  &:hover {
    opacity: 0.9;
  }
`;

const LoginMessage = styled.div`
  text-align: center;
  color: white;
  margin-bottom: 1rem;
`;

const ConnectButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(45deg, #ff6b6b, #f06543);
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  color: white;
  text-decoration: none;
  cursor: pointer;
  margin: 0 auto;
  &:hover {
    opacity: 0.9;
    text-decoration: none;
  }
  svg {
    margin-right: 0.5rem;
  }
`;

const Details = styled.div`
  color: white;
  margin-bottom: 150px;
  text-align: center;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: center;
  gap: 5px;
  margin-bottom: 0;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const TotalEarningsTag = styled(Tag)`
  margin: 10px auto 0;
  min-width: 150px;
  max-width: 220px;
  width: 150px;
  background: linear-gradient(45deg, #ff6445, #ffa400);
`;

const BalanceText = styled.p`
  font-size: 2.5rem;
  background: linear-gradient(to right, #ff6445, #ffa400);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
`;

const WalletInfo = styled.div`
  color: #ff6445;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  cursor: pointer;
`;

const CopyIcon = styled(FaCopy)`
  margin-left: 5px;
`;

const BalanceInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  height: 100%;
`;

const UsdcIcon = styled.img`
  width: 50px;
  height: 50px;
  margin-right: 10px;
`;

const Profile = () => {
  const { username } = useParams();
  const [userData, setUserData] = useState(null);
  const [usdcBalance, setUsdcBalance] = useState(null);
  const [users, setUsers] = useState([]);
  const { username: loggedInUsername } = useContext(UserContext);
  const navigate = useNavigate();
  const [widgetVisible, setWidgetVisible] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/leaderboard`);
        const sortedUsers = response.data.sort((a, b) => b.xp - a.xp); 
        setUsers(sortedUsers);
      } catch (error) {
        console.error('Error fetching leaderboard', error);
      }
    };

    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/users/${username}`);
        setUserData(response.data);
      } catch (error) {
        console.error('Error fetching user data', error);
      }
    };

    fetchLeaderboard();
    fetchUserData();
  }, [username]);
  const fetchUsdcBalance = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/users/${username}/usdc-balance`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('github_token')}`
        }
      });
      setUsdcBalance(response.data.usdcBalance);
    } catch (error) {
      console.error('Error fetching USDC balance', error);
    }
  };
    fetchUsdcBalance();
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Wallet address copied to clipboard');
    });
  };

  const handleEditProfile = () => {
    navigate(`/edit-profile/${username}`);
  };

  const handleWithdrawClick = () => {
    setWidgetVisible(true);
  };

  const calculateRank = (username) => {
    if (!users.length) return null; 
    const rank = users.findIndex((user) => user.username === username) + 1;
    return rank;
  };

  if (!userData) {
    return <div>Loading...</div>;
  }

  return (
    <Container>
      <Card>
        <Header>
          <Avatar src={userData.avatar || 'https://img.freepik.com/free-psd/3d-render-avatar-character_23-2150611746.jpg'} alt="Avatar" />
          {loggedInUsername === username && (
            <EditIcon onClick={handleEditProfile} />
          )}
        </Header>
        <Username>{userData.username}</Username>
        <Details>
          <DetailRow>
            <DetailItem>
              <Tag>
                <TagLabel>Rank</TagLabel>
                <TagValue>#{calculateRank(userData.username)}</TagValue>
              </Tag>
            </DetailItem>
            <DetailItem>
              <Tag>
                <TagValue>{userData.xp}</TagValue>
                <TagLabel>XP</TagLabel>
              </Tag>
            </DetailItem>
          </DetailRow>
          <TotalEarningsTag>
            <TagLabel>Total Earnings</TagLabel>
            <TagValue>${userData.totalEarnings}</TagValue>
          </TotalEarningsTag>
          <InfoParagraph>
            <Bio>{userData.bio}</Bio>
          </InfoParagraph>
        </Details>
        <Icons>
          {userData.linkedin && <Icon href={`${userData.linkedin}`} target="_blank"><FaLinkedin /></Icon>}
          {userData.twitter && <Icon href={`https://twitter.com/${userData.twitter}`} target="_blank"><FaTwitter /></Icon>}
          {userData.discord && <Icon href={`https://discord.com/users/${userData.discord}`} target="_blank"><FaDiscord /></Icon>}
          {userData.github && <Icon href={`https://github.com/${userData.github}`} target="_blank"><FaGithub /></Icon>}
        </Icons>
      </Card>
      {loggedInUsername === username && (
        <BalanceCard>
          <BalanceInfo>
            <UsdcIcon src={usdcIcon} alt="USDC" />
            <BalanceText>{usdcBalance !== null ? usdcBalance : 'Loading...'}</BalanceText>
          </BalanceInfo>
          <WalletInfo onClick={() => copyToClipboard(userData.walletAddress || 'No wallet address')}>
            <span>{userData.walletAddress || 'No wallet address'}</span>
            <CopyIcon />
          </WalletInfo>
          {/* <WithdrawButton onClick={handleWithdrawClick}>Withdraw</WithdrawButton> */}
          {widgetVisible && (
            <MoonPaySellWidget
              variant="overlay"
              baseCurrencyCode="eth"
              baseCurrencyAmount="0.1"
              quoteCurrencyCode="usd"
              visible={widgetVisible}
            />
          )}
        </BalanceCard>
      )}
    </Container>
  );
};

export default Profile;