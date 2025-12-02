import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  RotateCcw,
  Camera,
  Users,
  BookOpen,
  Clock,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

export default function LandingPage() {
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
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Track Your Rock Tumbling Journey
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            From ugly rough to beautiful polish. Log your cycles, track your stages,
            upload before/after photos, and share your results with the community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/register">
                <Sparkles className="mr-2 h-5 w-5" />
                Start Tracking Free
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/gallery">Browse Gallery</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-16 px-4 bg-muted/50">
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
                  "My last batch turned out great but I can't remember what I did differently."
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
            Ready to Start Tumbling Smarter?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join rock tumblers who are tracking their cycles, learning from their results,
            and sharing with the community.
          </p>
          <Button size="lg" asChild>
            <Link href="/register">Create Free Account</Link>
          </Button>
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
