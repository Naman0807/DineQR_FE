import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  Layout,
  Typography,
  Button,
  Input,
  Card,
  Flex,
  message,
  theme as antTheme,
  Divider
} from 'antd';
import {
  ArrowLeftOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useSession } from '../stores/SessionContext';
import { api } from '../services/api';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { OTP } = Input;

const OTP_EXPIRY_SECONDS = 5 * 60;
const DEV_PHONE = '9537112498';
const DEV_OTP = '080706';

export function CustomerOtpVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const { restaurantSlug } = useParams<{ restaurantSlug: string }>();
  const { sessionId, tableNumber } = useSession();
  const { token: themeToken } = antTheme.useToken();

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef<number | null>(null);
  const otpInputRef = useRef<any>(null);

  const redirectTo = (location.state as any)?.redirectTo || `/${restaurantSlug}/cart`;

  useEffect(() => {
    if (!sessionId) {
      message.error('No active session. Please scan the QR code again.');
      navigate(`/${restaurantSlug}/menu`);
    }
  }, [sessionId, restaurantSlug, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      timerRef.current = window.setTimeout(() => setCountdown(c => c - 1), 1000);
    } else if (otpSent) {
      setCanResend(true);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [countdown, otpSent]);

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSendOtp = async () => {
    if (!phone.trim() || phone.trim().length < 10) {
      message.error('Please enter a valid phone number');
      return;
    }
    if (!sessionId) {
      message.error('No active session');
      return;
    }

    setSending(true);
    try {
      await api.customer.sendOtp({
        phone_number: phone.trim(),
        session_id: sessionId,
      });
      setOtpSent(true);
      setCountdown(OTP_EXPIRY_SECONDS);
      setCanResend(false);
      message.success('OTP sent successfully! Valid for 5 minutes.');
      setTimeout(() => otpInputRef.current?.focus?.(), 100);
    } catch (error: any) {
      message.error(error.message || 'Failed to send OTP');
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      message.error('Please enter the 6-digit OTP');
      return;
    }
    if (!sessionId) {
      message.error('No active session');
      return;
    }

    setVerifying(true);
    try {
      await api.customer.verifyOtp({
        phone_number: phone.trim(),
        session_id: sessionId,
        otp_code: otp,
      });
      message.success('Verified successfully!');
      navigate(redirectTo);
    } catch (error: any) {
      message.error(error.message || 'Invalid or expired OTP');
    } finally {
      setVerifying(false);
    }
  };

  const handleOtpChange = (value: string) => {
    setOtp(value);
    if (value.length === 6) {
      setTimeout(() => handleVerifyOtp(), 200);
    }
  };

  const handleResend = () => {
    setOtp('');
    setCanResend(false);
    handleSendOtp();
  };

  return (
    <Layout style={{ minHeight: '100vh', background: themeToken.colorBgLayout }}>
      <Header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 16px',
        background: themeToken.colorBgContainer,
        boxShadow: themeToken.boxShadowTertiary,
        height: 'auto',
        lineHeight: 'initial',
        paddingTop: 12,
        paddingBottom: 8
      }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined style={{ fontSize: 20 }} />}
          onClick={() => navigate(-1)}
          style={{ marginLeft: -8 }}
        />
        <Flex direction="vertical" size={0}>
          <Title level={4} style={{ margin: 0 }}>Verify Phone</Title>
          {tableNumber && (
            <Text type="secondary" style={{ fontSize: 12 }}>Table {tableNumber}</Text>
          )}
        </Flex>
      </Header>

      <Content style={{ padding: '24px 16px' }}>
        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          <Card bordered={false} style={{ borderRadius: 16, boxShadow: themeToken.boxShadowTertiary }}>
            <Flex vertical align="center" style={{ marginBottom: 24 }}>
              <Flex align="center" justify="center" style={{
                width: 64, height: 64, borderRadius: '50%',
                background: themeToken.colorPrimaryBg, marginBottom: 16
              }}>
                <SendOutlined style={{ fontSize: 28, color: themeToken.colorPrimary }} />
              </Flex>
              <Title level={5} style={{ margin: 0, textAlign: 'center' }}>
                {otpSent ? 'Enter OTP' : 'Verify Your Phone'}
              </Title>
              <Text type="secondary" style={{ textAlign: 'center', marginTop: 4 }}>
                {otpSent
                  ? `We sent a 6-digit code to ${phone}`
                  : 'Enter your phone number to receive a verification code'}
              </Text>
            </Flex>

            {!otpSent ? (
              <Flex vertical gap={16}>
                <Input
                  size="large"
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  prefix={<span style={{ marginRight: 4, color: themeToken.colorTextSecondary }}>+91</span>}
                  maxLength={10}
                  onPressEnter={handleSendOtp}
                />
                <Button
                  type="primary"
                  size="large"
                  block
                  loading={sending}
                  onClick={handleSendOtp}
                  style={{ height: 48, borderRadius: 12, fontWeight: 600 }}
                  icon={<SendOutlined />}
                >
                  Send OTP
                </Button>
              </Flex>
            ) : (
              <Flex vertical gap={16} align="center">
                <OTP
                  length={6}
                  value={otp}
                  onChange={handleOtpChange}
                  size="large"
                  style={{ width: '100%' }}
                />

                {countdown > 0 && (
                  <Flex align="center" gap={4}>
                    <ClockCircleOutlined style={{ color: themeToken.colorTextSecondary }} />
                    <Text type="secondary" style={{ fontSize: 14 }}>
                      Expires in {formatCountdown(countdown)}
                    </Text>
                  </Flex>
                )}

                {canResend && (
                  <Button type="link" onClick={handleResend} style={{ padding: 0 }}>
                    Resend OTP
                  </Button>
                )}

                <Divider style={{ margin: '8px 0' }} />

                <Flex vertical gap={12} style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    size="large"
                    block
                    loading={verifying}
                    onClick={handleVerifyOtp}
                    disabled={otp.length < 6}
                    style={{ height: 48, borderRadius: 12, fontWeight: 600 }}
                    icon={<CheckCircleOutlined />}
                  >
                    Verify & Continue
                  </Button>
                  <Button
                    size="large"
                    block
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                    }}
                    style={{ height: 44, borderRadius: 12 }}
                  >
                    Change Phone Number
                  </Button>
                </Flex>
              </Flex>
            )}

            <Divider style={{ margin: '16px 0 8px' }} />
            <Text type="secondary" style={{ fontSize: 12, display: 'block', textAlign: 'center' }}>
              OTP is valid for 5 minutes. Do not share this code with anyone.
            </Text>
          </Card>
        </div>
      </Content>
    </Layout>
  );
}
