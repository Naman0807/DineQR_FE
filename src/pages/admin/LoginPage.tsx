import { useState } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../stores/AuthContext';

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

  const from = (location.state as any)?.from?.pathname || (isSuperadmin ? '/superadmin/dashboard' : (restaurantSlug ? `/${restaurantSlug}/admin` : '/admin'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      const message = err.message || 'Invalid credentials';
      if (err.response?.status === 403) {
        if (message.toLowerCase().includes('pending')) {
          setError('Your restaurant account is pending approval. Please contact the superadmin.');
        } else if (message.toLowerCase().includes('deactivated')) {
          setError('Your restaurant account has been deactivated. Please contact the superadmin.');
        } else {
          setError(message);
        }
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-sm p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isSuperadmin ? 'Superadmin Login' : 'Admin Login'}
            </h1>
            <p className="text-gray-500 mt-1">Sign in to access admin dashboard</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 min-h-[48px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter your username"
                required
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 min-h-[48px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 min-h-[48px] bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {!isSuperadmin && (
            <div className="mt-6 text-center">
              <p className="text-gray-500 text-sm">
                Don't have an account?{' '}
                <Link to={restaurantSlug ? `/${restaurantSlug}/admin/register` : '/admin/register'} className="text-orange-500 hover:text-orange-600 font-medium">
                  Create one
                </Link>
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 text-center">
          <Link to={restaurantSlug ? `/${restaurantSlug}/menu` : '/menu'} className="text-gray-500 hover:text-gray-700 text-sm">
            ← Back to Menu
          </Link>
        </div>
      </div>
    </div>
  );
}
