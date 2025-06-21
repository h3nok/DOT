import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label';
import { 
  Heart, 
  BookOpen, 
  Users, 
  Gift, 
  Shield, 
  Sparkles,
  CheckCircle,
  ArrowRight,
  Lock,
  DollarSign
} from 'lucide-react';
import donationService from '../services/donationService';

const SupportPage = () => {
  const [donationType, setDonationType] = useState('one-time');
  const [selectedTier, setSelectedTier] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [donationStats, setDonationStats] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  useEffect(() => {
    loadDonationStats();
  }, []);

  const loadDonationStats = async () => {
    try {
      const stats = await donationService.getDonationStats();
      setDonationStats(stats);
    } catch (error) {
      console.error('Error loading donation stats:', error);
    }
  };

  const supportTiers = [
    {
      id: 'supporter',
      name: 'Supporter',
      icon: Heart,
      price: 5,
      description: 'Help keep the lights on',
      benefits: [
        'Supporter badge on profile',
        'Early access to new content',
        'Monthly newsletter with insights',
        'My sincere gratitude'
      ],
      popular: false
    },
    {
      id: 'patron',
      name: 'Patron',
      icon: BookOpen,
      price: 15,
      description: 'Enable deeper research and writing',
      benefits: [
        'All Supporter benefits',
        'Exclusive articles and insights',
        'Priority access to new content',
        'Direct input on topics to explore',
        'Quarterly research updates'
      ],
      popular: true
    }
  ];

  const handleTierSelect = (tier) => {
    setSelectedTier(tier);
    setShowPaymentForm(true);
  };

  const handleCustomDonation = () => {
    if (!customAmount || customAmount < 1) {
      alert('Please enter a valid amount (minimum $1)');
      return;
    }
    setSelectedTier({ id: 'custom', amount: parseFloat(customAmount) });
    setShowPaymentForm(true);
  };

  const handlePayment = async () => {
    if (!email || !selectedTier) return;

    setIsProcessing(true);
    try {
      if (donationType === 'one-time') {
        await donationService.createOneTimeDonation(
          selectedTier.amount,
          email,
          selectedTier.id
        );
      } else {
        await donationService.createSubscription(
          selectedTier.amount,
          email,
          selectedTier.id
        );
      }
      
      alert('Thank you for your support! Your donation has been processed successfully.');
      setShowPaymentForm(false);
      setSelectedTier(null);
      setCustomAmount('');
      setEmail('');
      loadDonationStats(); // Refresh stats
    } catch (error) {
      alert('Payment failed: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 gradient-bg text-white relative overflow-hidden">
        <div className="absolute inset-0 digital-grid opacity-30"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <Heart className="w-16 h-16 mx-auto mb-6 text-white/80" />
          <h1 className="font-orbitron text-5xl font-bold mb-6">Support This Work</h1>
          <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto font-inter">
            I'm transitioning from a successful career to focus on teaching and writing about digital consciousness. 
            Your support helps me dedicate time to exploring these ideas and sharing them with the world.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Users className="w-4 h-4 mr-2" />
              247 Supporters
            </Badge>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              $2,847 Raised
            </Badge>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        {/* Personal Story */}
        <section className="mb-16 text-center">
          <h2 className="font-orbitron text-3xl font-bold mb-6 gradient-text">
            Why I'm Doing This
          </h2>
          <div className="max-w-4xl mx-auto text-lg text-muted-foreground space-y-4">
            <p>
              After years in a successful career, I realized that the most important work I could do 
              is exploring and sharing ideas about digital consciousness and the nature of reality.
            </p>
            <p>
              This platform represents my commitment to teaching, writing, and building a community 
              around these profound questions. Your support allows me to focus on this work full-time.
            </p>
            <p>
              Every contribution, no matter the size, helps me continue researching, writing, and 
              creating content that explores the frontiers of digital consciousness.
            </p>
          </div>
        </section>

        {/* Donation Stats */}
        {donationStats && (
          <section className="mb-16">
            <h2 className="font-orbitron text-3xl font-bold mb-8 text-center gradient-text">
              Donation Stats
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              <Card className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border/50">
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    {donationStats.supporter_count}
                  </CardTitle>
                  <CardDescription>Supporters</CardDescription>
                </CardHeader>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border/50">
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    {donationService.formatAmount(donationStats.total_donations)}
                  </CardTitle>
                  <CardDescription>Total Raised</CardDescription>
                </CardHeader>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border/50">
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Heart className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    {donationStats.active_subscriptions}
                  </CardTitle>
                  <CardDescription>Monthly Supporters</CardDescription>
                </CardHeader>
              </Card>
              <Card className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border/50">
                <CardHeader className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    {donationService.formatAmount(donationStats.monthly_revenue)}
                  </CardTitle>
                  <CardDescription>Monthly Revenue</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </section>
        )}

        {/* Support Options */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="font-orbitron text-3xl font-bold mb-4 gradient-text">
              Ways to Support
            </h2>
            <p className="text-muted-foreground">
              Choose what feels right for you
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8 max-w-4xl mx-auto">
            {supportTiers.map((tier) => {
              const IconComponent = tier.icon;
              return (
                <Card 
                  key={tier.id} 
                  className={`card-hover relative ${tier.popular ? 'ring-2 ring-primary' : ''}`}
                >
                  {tier.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                      <IconComponent className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle className="font-orbitron text-xl">{tier.name}</CardTitle>
                    <CardDescription>{tier.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-3xl font-bold">${tier.price}</span>
                      <span className="text-muted-foreground">/{donationType === 'monthly' ? 'month' : 'one-time'}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-6">
                      {tier.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full btn-primary"
                      onClick={() => handleTierSelect(tier)}
                    >
                      Support ${tier.price}/{donationType === 'monthly' ? 'month' : 'once'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Donation Type Toggle */}
          <div className="text-center mb-8">
            <div className="inline-flex bg-muted rounded-lg p-1">
              <Button
                variant={donationType === 'monthly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDonationType('monthly')}
              >
                Monthly
              </Button>
              <Button
                variant={donationType === 'one-time' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDonationType('one-time')}
              >
                One-Time
              </Button>
            </div>
          </div>
        </section>

        {/* Custom Donation */}
        <section className="mb-16">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <Gift className="w-12 h-12 mx-auto mb-4 text-primary" />
              <CardTitle className="font-orbitron">Other Amount</CardTitle>
              <CardDescription>
                Any amount helps and is deeply appreciated
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleCustomDonation}
                  disabled={!customAmount || customAmount <= 0}
                  className="btn-secondary"
                >
                  Support
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Secure payment processing with <Lock className="w-3 h-3 inline" />
              </p>
            </CardContent>
          </Card>
        </section>

        {/* What Your Support Enables */}
        <section className="mb-16">
          <h2 className="font-orbitron text-3xl font-bold mb-8 text-center gradient-text">
            What Your Support Makes Possible
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="text-center">
              <CardContent className="pt-6">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">More Writing</h3>
                <p className="text-sm text-muted-foreground">
                  Time to research and write deeper articles about digital consciousness
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Community Building</h3>
                <p className="text-sm text-muted-foreground">
                  Growing and nurturing this community of consciousness explorers
                </p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Platform Development</h3>
                <p className="text-sm text-muted-foreground">
                  Building better tools and features for exploring these ideas
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Personal Note */}
        <section className="mb-16">
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="font-orbitron text-center">A Personal Note</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                This transition from a successful career to focusing on digital consciousness 
                research and teaching is both exciting and challenging. Your support means 
                the world to me and helps make this work sustainable.
              </p>
              <p className="text-muted-foreground">
                Whether you can contribute $5 or $50, every bit helps me continue exploring 
                these fascinating ideas and sharing them with others who are curious about 
                the nature of consciousness and reality.
              </p>
              <p className="text-muted-foreground">
                Thank you for being part of this journey.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="font-orbitron text-3xl font-bold mb-8 text-center gradient-text">
            Questions?
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="font-orbitron">How is my support used?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Your support goes directly toward my living expenses, allowing me to focus 
                  full-time on researching, writing, and building this platform. I maintain 
                  full transparency about how funds are used.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="font-orbitron">Can I cancel my monthly support?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Absolutely. You can cancel or modify your monthly support at any time. 
                  I understand that circumstances change, and I'm grateful for any support 
                  you can provide, no matter how long.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="font-orbitron">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  I accept all major credit cards, PayPal, and cryptocurrency payments 
                  including Bitcoin and Ethereum. Choose whatever is most convenient for you.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="font-orbitron">Is this tax-deductible?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Currently, these are personal contributions and not tax-deductible. 
                  I'm exploring options to set up a non-profit structure in the future 
                  if there's sufficient interest.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Contact */}
        <section className="text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="font-orbitron">Want to Connect?</CardTitle>
              <CardDescription>
                I'd love to hear from you and answer any questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="btn-primary">
                Send Me a Message
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Payment Form Modal */}
      {showPaymentForm && selectedTier && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm border-border/50">
            <CardHeader>
              <CardTitle className="text-center">
                Complete Your {donationType === 'monthly' ? 'Subscription' : 'Donation'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-primary">
                  ${selectedTier.amount}
                  {donationType === 'monthly' && <span className="text-sm text-muted-foreground">/month</span>}
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedTier.id !== 'custom' && selectedTier.name} Tier
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="mt-2"
                  required
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => setShowPaymentForm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePayment}
                  disabled={!email || isProcessing}
                  className="flex-1"
                >
                  {isProcessing ? 'Processing...' : 'Complete Payment'}
                </Button>
              </div>

              <div className="text-xs text-muted-foreground text-center">
                Powered by Stripe • Secure payment processing
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SupportPage;
