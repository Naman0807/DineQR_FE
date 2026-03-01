import { useState } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../stores/AuthContext';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { restaurantSlug } = useParams();

  const isSuperadmin = location.pathname.includes('superadmin');

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || (isSuperadmin ? '/superadmin/dashboard' : (restaurantSlug ? `/${restaurantSlug}/admin` : '/admin'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const errorResponse = err as { message?: string; response?: { status: number } };
      const message = errorResponse.message || 'Invalid credentials';

      if (errorResponse.response?.status === 403) {
        if (message.toLowerCase().includes('pending')) {
          setError('Your restaurant account is pending approval. Please contact the superadmin.');
        } else if (message.toLowerCase().includes('deactivated')) {
          setError('Your restaurant account has been deactivated. Please contact the superadmin.');
        } else {
          setError(message);
        }
      } else {
        setError(message);
        console.log(err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.cardWrapper}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.iconWrapper}>
              <LogIn className={styles.icon} />
            </div>
            <h1 className={styles.title}>
              {isSuperadmin ? 'Superadmin Login' : 'Admin Login'}
            </h1>
            <p className={styles.subtitle}>Sign in to access your dashboard</p>
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

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
                placeholder="Enter your username"
                required
                autoFocus
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
                  placeholder="Enter your password"
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

            <button
              type="submit"
              disabled={isLoading}
              className={styles.submitButton}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {!isSuperadmin && (
            <div className={styles.footer}>
              <p className={styles.footerText}>
                Don't have an account?{' '}
                <Link to={restaurantSlug ? `/${restaurantSlug}/admin/register` : '/admin/register'} className={styles.link}>
                  Create one
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
