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
      setError('Vui lòng nhập mã OTP 6 chữ số');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await verifyOTP({ email, otp });
      
      if (response.success && response.data) {
        onVerified(response.data);
      } else {
        setError(response.message || 'Xác thực thất bại');
      }
    } catch (err: any) {
      setError(err.message || 'Mã OTP không hợp lệ. Vui lòng thử lại.');
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
        setError(response.message || 'Không thể gửi lại mã OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại.');
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
            Xác thực Email
          </DialogTitle>
          <DialogDescription>
            Chúng tôi đã gửi mã 6 chữ số đến <strong>{email}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleVerify} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Nhập mã OTP</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otp}
              onChange={handleOTPChange}
              placeholder="000000"
              className="text-center text-2xl tracking-widest"
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
                Đang xác thực...
              </>
            ) : (
              'Xác thực OTP'
            )}
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Không nhận được mã?
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
                  Đang gửi...
                </>
              ) : countdown > 0 ? (
                `Gửi lại sau ${countdown}s`
              ) : (
                'Gửi lại OTP'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
