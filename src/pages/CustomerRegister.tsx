import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Input, Button, message, theme as antTheme } from 'antd';
import { api } from '../services/api';
import { useSession } from '../stores/SessionContext';

export default function CustomerRegister() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  const location = useLocation();
  const { sessionId, setCustomerAuth } = useSession();
  const { token: themeToken } = antTheme.useToken();

  useEffect(() => {
    if (!sessionId) {
      message.error('No session found. Please scan QR code again.');
      navigate(`/${restaurantSlug}`);
    }
  }, [sessionId, navigate, restaurantSlug]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      message.error('Please enter your name');
      return;
    }
    if (!phone.trim()) {
      message.error('Please enter your phone number');
      return;
    }

    setLoading(true);
    try {
      if (!sessionId) {
        message.error('Session not found. Please scan QR code again.');
        navigate(`/${restaurantSlug}`);
        return;
      }
      const authData = await api.customer.register({
        name: name.trim(),
        phone_number: phone.trim(),
        session_id: sessionId,
      });

      if (authData.access_token) {
        setCustomerAuth(authData.access_token, name.trim(), phone.trim());
      }

      message.success('Welcome!');
      
      const from = (location.state as { redirectTo?: string })?.redirectTo || `/${restaurantSlug}/menu`;
      navigate(from);
    } catch (error: any) {
      message.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: themeToken.colorBgLayout,
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        background: themeToken.colorBgContainer,
        borderRadius: themeToken.borderRadius,
        padding: '32px',
        boxShadow: `0 2px 8px ${themeToken.colorShadow}`,
        border: `1px solid ${themeToken.colorBorder}`,
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          marginBottom: '8px',
          textAlign: 'center',
          color: themeToken.colorText,
        }}>Welcome!</h1>
        <p style={{
          color: themeToken.colorTextSecondary,
          marginBottom: '32px',
          textAlign: 'center',
        }}>Enter your details to continue</p>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}>
          <label style={{
            fontWeight: 500,
            marginBottom: '4px',
            color: themeToken.colorText,
          }}>Your Name</label>
          <Input
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="large"
          />
          
          <label style={{
            fontWeight: 500,
            marginBottom: '4px',
            color: themeToken.colorText,
          }}>Phone Number</label>
          <Input
            placeholder="Enter phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            size="large"
          />
          
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={loading}
            size="large"
            block
            style={{
              height: '48px',
              marginTop: '16px',
            }}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}