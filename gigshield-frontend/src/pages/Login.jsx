import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../firebase';
import { Phone, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = Phone, 2 = OTP
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const confirmationResultRef = useRef(null);

  const requestOTP = async (e) => {
    e.preventDefault();
    setError('');

    if (phone.length < 10) {
      setError('Please enter a valid 10-digit number');
      return;
    }

    setLoading(true);

    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible'
        });
      }

      const formattedPhone = `+91${phone}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);

      confirmationResultRef.current = confirmation;
      setStep(2);
    } catch (err) {
      console.error('OTP request failed:', err);
      setError('Failed to send OTP. Check your number or try again later.');

      if (window.recaptchaVerifier) {
        try {
          const widgetId = await window.recaptchaVerifier.render();
          if (window.grecaptcha) {
            window.grecaptcha.reset(widgetId);
          }
        } catch (resetErr) {
          console.error('Recaptcha reset failed:', resetErr);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    setError('');

    if (otp.length < 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);

    try {
      if (!confirmationResultRef.current) {
        throw new Error('OTP session expired. Please request OTP again.');
      }

      const result = await confirmationResultRef.current.confirm(otp);
      const user = result.user;

      console.log('✅ Login success:', user.uid);

      const token = await user.getIdToken();

      localStorage.setItem('gs_token', token);
      localStorage.setItem('gs_uid', user.uid);
      localStorage.setItem('gs_phone', user.phoneNumber || `+91${phone}`);

      navigate('/onboarding');
    } catch (err) {
      console.error('OTP verify failed:', err);
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F1A] flex flex-col items-center justify-center p-4 text-white">
      <div id="recaptcha-container"></div>

      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center mb-4 border border-orange-500/50">
            <ShieldCheck className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gig<span className="text-orange-500">Shield</span>
          </h1>
          <p className="text-gray-400 mt-2 text-center">AI-Powered Income Protection</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
          {step === 1 && (
            <motion.form
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={requestOTP}
            >
              <h2 className="text-xl font-semibold mb-1">Welcome Back</h2>
              <p className="text-sm text-gray-400 mb-6">Enter your mobile number to continue</p>

              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <span className="ml-2 text-gray-400 font-medium border-r border-gray-600 pr-2">+91</span>
                </div>
                <input
                  type="tel"
                  maxLength="10"
                  className="w-full bg-[#1A1A24] border border-gray-700 rounded-xl py-4 pl-24 pr-4 text-white focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 text-white font-bold py-4 rounded-xl flex items-center justify-center transition-all"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Send OTP <ArrowRight className="ml-2 w-5 h-5" />
                  </>
                )}
              </button>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={verifyOTP}
            >
              <h2 className="text-xl font-semibold mb-1">Verify your number</h2>
              <p className="text-sm text-gray-400 mb-6">Code sent to +91 {phone}</p>

              <input
                type="text"
                maxLength="6"
                className="w-full bg-[#1A1A24] border border-gray-700 rounded-xl py-4 px-4 text-center text-2xl tracking-[0.5em] font-mono text-white focus:outline-none focus:border-orange-500 transition-all mb-4"
                placeholder="------"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              />

              {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center transition-all mb-4"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Code'}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-gray-400 hover:text-white text-sm py-2 transition-colors"
              >
                ← Use a different number
              </button>
            </motion.form>
          )}
        </div>
      </div>
    </div>
  );
}