'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  RotateCcw,
  Camera,
  Users,
  BookOpen,
  Clock,
  TrendingUp,
  Bell,
  Check,
  Loader2,
} from 'lucide-react';
import { waitlistApi } from '@/lib/api';

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      await waitlistApi.join(email.trim());
      setIsSuccess(true);
      setEmail('');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">MyUglyRocks</span>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild>
              <Link href="/login">Log in</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-4 md:py-6 px-4">
        <div className="container mx-auto text-center max-w-5xl">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Track Your Rock Tumbling Journey
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From ugly rough to beautiful polish. Log your cycles, track your stages,
            upload before/after photos, and share your results with the community.
          </p>
          <div className="my-0 py-0">
            <Image
              src="/images/header-cartoon-no-background.webp"
              alt="Ugly rocks going into a tumbler and coming out beautiful"
              width={900}
              height={400}
              className="mx-auto w-full max-w-3xl h-auto"
              priority
            />
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-16 px-4 bg-muted/50 -mt-8 md:-mt-12">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Sound Familiar?
          </h2>
          <div className="grid md:grid-cols-2 gap-6 text-left mt-8">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  "Wait, when did I start this stage? Was it 3 days ago or 5?"
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  "Which barrel has the agates and which has the jasper?"
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  "I can't remember which photo went with which tumbler or which batch."
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">
                  "Is this normal? I wish I could see what other tumblers' results look like."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything You Need to Tumble Smarter
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Track Every Stage</h3>
              <p className="text-muted-foreground">
                Log start times, materials, and durations. Never forget where you are in a cycle again.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
                <Camera className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Photo Documentation</h3>
              <p className="text-muted-foreground">
                Capture before/after photos at each stage. Watch your rocks transform over time.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Learn What Works</h3>
              <p className="text-muted-foreground">
                Compare results across cycles. Discover which materials and techniques work best for you.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Community Gallery</h3>
              <p className="text-muted-foreground">
                Share your polished creations. Get inspired by what others are tumbling.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Learn Section</h3>
              <p className="text-muted-foreground">
                Browse our database of rocks, minerals, and materials. Know what you're tumbling.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
                <RotateCcw className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Multiple Tumblers</h3>
              <p className="text-muted-foreground">
                Track as many tumblers and cycles as you want. Perfect for multi-barrel setups.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold mb-4">
            Coming Soon
          </h2>
          <p className="text-muted-foreground mb-8">
            MyUglyRocks is currently in private beta. Join the waitlist to be notified when we open registration to the public.
          </p>
          <div className="max-w-md mx-auto">
            {isSuccess ? (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                <span>Thanks! We&apos;ll let you know when we launch.</span>
              </div>
            ) : (
              <form onSubmit={handleWaitlistSubmit} className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                  disabled={isSubmitting}
                  required
                />
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Bell className="mr-2 h-4 w-4" />
                      Get Notified
                    </>
                  )}
                </Button>
                {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              MyUglyRocks - Track your rock tumbling journey
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/gallery" className="hover:text-foreground transition-colors">
              Gallery
            </Link>
            <Link href="/learn/specimens" className="hover:text-foreground transition-colors">
              Learn
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
