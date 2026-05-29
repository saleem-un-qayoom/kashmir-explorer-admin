'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { auth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const start = async () => {
    setLoading(true);
    setErr(null);
    try {
      await auth.startPhone(phone);
      setStep('otp');
    } catch (e: any) {
      setErr(e.message ?? 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setLoading(true);
    setErr(null);
    try {
      await auth.verifyPhone(phone, code);
      router.push('/');
    } catch (e: any) {
      setErr(e.message ?? 'Invalid code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-pashmina p-8">
      <div className="card w-full max-w-md p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-kong text-white font-serif text-lg">K</div>
          <div>
            <div className="font-serif text-xl font-bold leading-none">Kashmir</div>
            <div className="font-serif italic text-lg leading-none text-kong-deep mt-0.5">Explorer · admin</div>
          </div>
        </div>

        {step === 'phone' && (
          <>
            <h1 className="font-serif text-xl font-bold mb-1">Sign in</h1>
            <p className="text-sm text-ink-2 mb-5">Admin access only. OTP sent to your phone.</p>
            <label className="block">
              <span className="font-mono text-[10px] tracking-wider text-ink-3 block mb-1">PHONE</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98000 00000"
                inputMode="tel"
                className="w-full rounded-btn border border-line bg-white px-3 py-2.5 text-sm focus:outline-none focus:border-dal"
              />
            </label>
            <button onClick={start} disabled={loading || !phone} className="btn btn-primary w-full mt-4">
              {loading ? 'Sending…' : 'Send OTP'}
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <h1 className="font-serif text-xl font-bold mb-1">Enter code</h1>
            <p className="text-sm text-ink-2 mb-5">Sent to {phone}. Valid for 10 minutes.</p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              inputMode="numeric"
              placeholder="000000"
              className="w-full rounded-btn border border-line bg-white px-3 py-3 text-center text-2xl tracking-[0.4em] font-mono focus:outline-none focus:border-dal"
            />
            <button
              onClick={verify}
              disabled={loading || code.length !== 6}
              className="btn btn-primary w-full mt-4"
            >
              {loading ? 'Verifying…' : 'Sign in'}
            </button>
            <button onClick={() => setStep('phone')} className="btn btn-ghost w-full mt-2">
              Change number
            </button>
          </>
        )}

        {err && <p className="text-chinar text-sm mt-3">{err}</p>}
        <p className="font-quote italic text-ink-3 text-sm text-center mt-8">Paradise, with the receipts.</p>
      </div>
    </div>
  );
}
