import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { UserPlus, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../stores/AuthContext';
import styles from './RegisterPage.module.css';

export function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [registeredRestaurantSlug, setRegisteredRestaurantSlug] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();
  const { restaurantSlug } = useParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      const result = await register({ username, email, password, role: 'admin', restaurant_name: restaurantName });
      if (result.pendingApproval) {
        setRegisteredRestaurantSlug(result.restaurantSlug || '');
        setPendingApproval(true);
      } else {
        navigate(restaurantSlug ? `/${restaurantSlug}/admin` : '/admin', { replace: true });
      }
    } catch (err: unknown) {
      const errorResponse = err as { message?: string };
      setError(errorResponse.message || 'Registration failed');
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

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

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
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.fieldGroup}>
                <label htmlFor="username" className={styles.label}>
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={styles.input}
                  placeholder="Choose a username"
                  required
                  autoFocus
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="email" className={styles.label}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="restaurantName" className={styles.label}>
                  Restaurant Name
                </label>
                <input
                  id="restaurantName"
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  className={styles.input}
                  placeholder="Enter your restaurant name"
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="password" className={styles.label}>
                  Password
                </label>
                <div className={styles.passwordWrapper}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${styles.input} ${styles.passwordInput}`}
                    placeholder="Create a password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.toggleButton}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="confirmPassword" className={styles.label}>
                  Confirm Password
                </label>
                <div className={styles.passwordWrapper}>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${styles.input} ${styles.passwordInput}`}
                    placeholder="Confirm your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className={styles.toggleButton}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={styles.submitButton}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
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
