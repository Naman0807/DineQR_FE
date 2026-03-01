import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { Form, Input, Button, App } from 'antd';
import { useAuth } from '../../stores/AuthContext';
import styles from './RegisterPage.module.css';

export function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [registeredRestaurantSlug, setRegisteredRestaurantSlug] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();
  const { restaurantSlug } = useParams();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const onFinish = async (values: import('../../types').RegisterRequest) => {
    const { username, email, phone_number, restaurant_name, password } = values;
    setIsLoading(true);

    try {
      setRestaurantName(restaurant_name || '');
      const result = await register({
        username,
        email,
        phone_number,
        password,
        role: 'admin',
        restaurant_name
      });

      if (result.pendingApproval) {
        setRegisteredRestaurantSlug(result.restaurantSlug || '');
        setPendingApproval(true);
      } else {
        message.success('Registration successful!');
        navigate(restaurantSlug ? `/${restaurantSlug}/admin` : '/admin', { replace: true });
      }
    } catch (err: unknown) {
      console.error('Registration error:', err);
      const errorResponse = err as { message?: string };
      message.error(errorResponse.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.cardWrapper}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={`${styles.iconWrapper} ${pendingApproval ? styles.iconWrapperSuccess : styles.iconWrapperNormal}`}>
              <UserPlus className={`${styles.icon} ${pendingApproval ? styles.iconSuccess : styles.iconNormal}`} />
            </div>
            <h1 className={styles.title}>
              {pendingApproval ? 'Registration Submitted!' : 'Create Account'}
            </h1>
            <p className={styles.subtitle}>
              {pendingApproval ? 'Your application is being processed' : 'Register for admin access'}
            </p>
          </div>

          {pendingApproval ? (
            <div className={styles.successContent}>
              <p className={styles.successText}>
                Your restaurant <span className={styles.bold}>"{restaurantName}"</span> is pending approval. You will receive an email once your account is activated.
              </p>
              <Link
                to={registeredRestaurantSlug ? `/${registeredRestaurantSlug}/admin/login` : (restaurantSlug ? `/${restaurantSlug}/admin/login` : '/admin/login')}
                className={styles.submitButton}
                style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              requiredMark={false}
              className={styles.form}
            >
              <Form.Item
                label={<span className={styles.label}>Username</span>}
                name="username"
                rules={[{ required: true, message: 'Please enter a username' }]}
              >
                <Input className={styles.input} placeholder="Choose a username" size="large" />
              </Form.Item>

              <Form.Item
                label={<span className={styles.label}>Email</span>}
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input className={styles.input} placeholder="Enter your email" size="large" />
              </Form.Item>

              <Form.Item
                label={<span className={styles.label}>Phone Number</span>}
                name="phone_number"
                rules={[
                  { required: true, message: 'Please enter your phone number' },
                  { pattern: /^\+\d{1,4}\d{7,12}$/, message: 'Please enter a valid phone number with country code (e.g., +919016112497)' }
                ]}
              >
                <Input className={styles.input} placeholder="+91 9016112497" size="large" />
              </Form.Item>

              <Form.Item
                label={<span className={styles.label}>Restaurant Name</span>}
                name="restaurant_name"
                rules={[{ required: true, message: 'Please enter your restaurant name' }]}
              >
                <Input className={styles.input} placeholder="Enter your restaurant name" size="large" />
              </Form.Item>

              <Form.Item
                label={<span className={styles.label}>Password</span>}
                name="password"
                rules={[
                  { required: true, message: 'Please create a password' },
                  { min: 6, message: 'Password must be at least 6 characters' }
                ]}
              >
                <Input.Password className={styles.input} placeholder="Create a password" size="large" />
              </Form.Item>

              <Form.Item
                label={<span className={styles.label}>Confirm Password</span>}
                name="confirm"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Please confirm your password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match'));
                    },
                  }),
                ]}
              >
                <Input.Password className={styles.input} placeholder="Confirm your password" size="large" />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isLoading}
                  className={styles.submitButton}
                  size="large"
                  block
                >
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </Form.Item>
            </Form>
          )}

          <div className={styles.footer}>
            <p className={styles.footerText}>
              Already have an account?{' '}
              <Link to={registeredRestaurantSlug ? `/${registeredRestaurantSlug}/admin/login` : (restaurantSlug ? `/${restaurantSlug}/admin/login` : '/admin/login')} className={styles.link}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
