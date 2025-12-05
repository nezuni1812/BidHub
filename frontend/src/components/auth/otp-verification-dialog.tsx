"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { verifyOTP, resendOTP } from '@/lib/auth';
import { Loader2, Mail } from 'lucide-react';

interface OTPVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  onVerified: (data: any) => void;
}

export function OTPVerificationDialog({
  open,
  onOpenChange,
  email,
  onVerified,
}: OTPVerificationDialogProps) {
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await verifyOTP({ email, otp });
      
      if (response.success && response.data) {
        onVerified(response.data);
      } else {
        setError(response.message || 'Verification failed');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setError('');

    try {
      const response = await resendOTP(email);
      
      if (response.success) {
        setCountdown(60); // 60 seconds cooldown
        setError(''); // Clear error
      } else {
        setError(response.message || 'Failed to resend OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleOTPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Verify Your Email
          </DialogTitle>
          <DialogDescription>
            We've sent a 6-digit code to <strong>{email}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleVerify} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Enter OTP Code</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={handleOTPChange}
              placeholder="000000"
              className="text-center text-2xl tracking-widest font-mono"
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isVerifying || otp.length !== 6}
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify OTP'
            )}
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Didn't receive the code?
            </p>
            <Button
              type="button"
              variant="link"
              onClick={handleResend}
              disabled={isResending || countdown > 0}
              className="text-sm"
            >
              {isResending ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Sending...
                </>
              ) : countdown > 0 ? (
                `Resend in ${countdown}s`
              ) : (
                'Resend OTP'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
