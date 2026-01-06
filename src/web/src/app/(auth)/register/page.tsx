'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import type { RegisterWithInvitationCodeRequest, AuthResult, InvitationCodeValidationResult } from '@/types/auth';

const registerSchema = z.object({
  invitationCode: z.string().min(1, 'Invitation code is required'),
  email: z.string().email('Please enter a valid email'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*(),.?":{}|<>\[\];'~_+\-=\/]/, 'Password must contain at least one special character'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeValidation, setCodeValidation] = useState<InvitationCodeValidationResult | null>(null);
  const router = useRouter();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      invitationCode: '',
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  const validateInvitationCode = async (code: string) => {
    if (!code || code.trim().length === 0) {
      setCodeValidation(null);
      return;
    }

    setIsValidatingCode(true);
    try {
      const response = await fetch('/api/auth/validate-invitation-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      });

      const result: InvitationCodeValidationResult = await response.json();
      setCodeValidation(result);

      if (!result.isValid) {
        form.setError('invitationCode', { message: result.error || 'Invalid code' });
      }
    } catch {
      setCodeValidation({ isValid: false, error: 'Failed to validate code' });
    } finally {
      setIsValidatingCode(false);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    // Ensure code is validated before submission
    if (!codeValidation?.isValid) {
      toast.error('Please enter a valid invitation code');
      return;
    }

    setIsLoading(true);
    try {
      const request: RegisterWithInvitationCodeRequest = {
        email: data.email,
        username: data.username,
        password: data.password,
        invitationCode: data.invitationCode.trim(),
      };

      const response = await fetch('/api/auth/register-with-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      const result: AuthResult = await response.json();

      if (result.success) {
        toast.success('Account created! Please check your email to verify your account.');
        // Redirect to login with a message
        router.push('/login?registered=true');
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          Join MyUglyRocks
        </CardTitle>
        <CardDescription className="text-center">
          Create your account with an invitation code
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="invitationCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invitation Code</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        placeholder="ROCK-XXXX-YYYY"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          setCodeValidation(null);
                        }}
                        onBlur={(e) => {
                          field.onBlur();
                          validateInvitationCode(e.target.value);
                        }}
                        className="pr-10 uppercase"
                      />
                      {isValidatingCode && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        </div>
                      )}
                      {!isValidatingCode && codeValidation && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {codeValidation.isValid ? (
                            <Check className="h-5 w-5 text-green-600" />
                          ) : (
                            <X className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Enter your unique invitation code
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="rockhound"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    3-50 characters, letters, numbers, underscores, and hyphens only
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Create a strong password"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Min 12 chars with uppercase, lowercase, number, and special character
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm your password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !codeValidation?.isValid}
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </Form>

        <div className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
