import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Input, Button, message } from 'antd';
import { api } from '../services/api';

const { Item } = Input;

export default function CustomerRegister() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();

  useEffect(() => {
    const sessionData = sessionStorage.getItem('dineqr_session');
    if (!sessionData) {
      message.error('No session found. Please scan QR code again.');
      navigate(`/${restaurantSlug}`);
    }
  }, [navigate, restaurantSlug]);

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
      const sessionData = JSON.parse(sessionStorage.getItem('dineqr_session') || '{}');
      const response = await api.customer.register({
        name: name.trim(),
        phone_number: phone.trim(),
        session_id: sessionData.session_id,
      });
      
      localStorage.setItem('dineqr_customer_token', response.access_token);
      message.success('Welcome! Redirecting to menu...');
      
      navigate(`/${restaurantSlug}/menu`);
    } catch (error: any) {
      message.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome!</h1>
        <p style={styles.subtitle}>Enter your details to continue</p>
        
        <div style={styles.form}>
          <label style={styles.label}>Your Name</label>
          <Input
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
            size="large"
          />
          
          <label style={styles.label}>Phone Number</label>
          <Input
            placeholder="Enter phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={styles.input}
            size="large"
          />
          
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={loading}
            size="large"
            block
            style={styles.button}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f5f5f5',
    padding: '20px',
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    background: '#fff',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '8px',
    textAlign: 'center',
  },
  subtitle: {
    color: '#666',
    marginBottom: '32px',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  label: {
    fontWeight: 500,
    marginBottom: '4px',
  },
  input: {
    height: '48px',
  },
  button: {
    height: '48px',
    marginTop: '16px',
  },
};