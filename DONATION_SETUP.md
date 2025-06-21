# Donation System Setup Guide

## Overview

This guide will help you set up a complete donation system for the DOT platform using Stripe for payment processing.

## How Other Platforms Handle Donations

### 1. **Stripe (Recommended)**

- **Used by**: GitHub Sponsors, many indie creators
- **Fees**: 2.9% + 30¢ per transaction
- **Pros**: Reliable, great API, handles subscriptions, good documentation
- **Cons**: Requires business verification, higher fees than some alternatives

### 2. **PayPal**

- **Used by**: Many creators, especially international
- **Fees**: 2.9% + fixed fee (varies by country)
- **Pros**: Widely trusted, lower fees for nonprofits
- **Cons**: Less control over UX, account required

### 3. **Ko-fi/Buy Me a Coffee**

- **Used by**: Content creators, writers
- **Fees**: 5% + payment processor fees
- **Pros**: Simple setup, no technical work
- **Cons**: Higher fees, less customization, platform lock-in

### 4. **Patreon**

- **Used by**: Content creators, podcasters
- **Fees**: 5-12% depending on plan
- **Pros**: Built for creators, handles memberships
- **Cons**: High fees, platform lock-in

## Stripe Setup Instructions

### 1. Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete business verification (required for live payments)
3. Get your API keys from the Dashboard

### 2. Environment Configuration

#### Frontend (.env file)

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# App Configuration
VITE_APP_NAME=DOT Platform
VITE_APP_DESCRIPTION=Digital Organism Theory Platform
```

#### Backend (.env file)

```env
# Database
DATABASE_URL=sqlite:///dot_platform.db

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Flask Configuration
SECRET_KEY=your_flask_secret_key_here
FLASK_ENV=development
```

### 3. Database Setup

Run the following commands to set up the database:

```bash
cd backend
python -c "from src.main import app, db; app.app_context().push(); db.create_all()"
```

### 4. Webhook Setup

1. In your Stripe Dashboard, go to Webhooks
2. Add endpoint: `https://yourdomain.com/api/donations/webhook`
3. Select events:
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded`
4. Copy the webhook secret to your backend .env file

### 5. Test the System

1. Use Stripe's test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
2. Test both one-time donations and subscriptions
3. Verify webhook handling

## Alternative Payment Processors

### PayPal Integration

If you prefer PayPal, you can modify the donation service:

```javascript
// In donationService.js
async createPayPalDonation(amount, email) {
  // PayPal integration code
  const response = await axios.post('/api/donations/paypal', {
    amount,
    email,
    return_url: window.location.origin + '/support/success',
    cancel_url: window.location.origin + '/support'
  });
  
  // Redirect to PayPal
  window.location.href = response.data.approval_url;
}
```

### Ko-fi Integration

For Ko-fi, you can embed their widget:

```html
<script src='https://storage.ko-fi.com/cdn/scripts/overlay-widget.js'></script>
<script>
  kofiWidgetOverlay.draw('your-ko-fi-username', {
    'type': 'floating-chat',
    'floating-chat.donateButton.text': 'Support me',
    'floating-chat.donateButton.background-color': '#00b9fe',
    'floating-chat.donateButton.text-color': '#fff'
  });
</script>
```

## Legal Considerations

### 1. **Business Registration**

- Register as a business in your jurisdiction
- Get an EIN (US) or equivalent tax ID
- Consider forming an LLC for liability protection

### 2. **Tax Compliance**

- Track all donations for tax reporting
- Issue receipts for donations over $250
- Consider 501(c)(3) status for tax-deductible donations

### 3. **Terms of Service**

- Create clear terms for donations
- Specify refund policies
- Include privacy policy for payment data

### 4. **GDPR Compliance**

- Get explicit consent for payment processing
- Allow users to delete their data
- Document data retention policies

## Best Practices

### 1. **Transparency**

- Show how donations are used
- Provide regular updates to supporters
- Be honest about financial needs

### 2. **User Experience**

- Make donation process simple
- Provide multiple payment options
- Send confirmation emails
- Show supporter benefits clearly

### 3. **Security**

- Never store credit card data
- Use HTTPS everywhere
- Implement proper error handling
- Regular security audits

### 4. **Communication**

- Thank donors immediately
- Provide regular updates
- Create supporter-only content
- Build community around supporters

## Monitoring and Analytics

### 1. **Track Key Metrics**

- Total donations
- Monthly recurring revenue
- Supporter retention
- Conversion rates

### 2. **Tools to Consider**

- Stripe Dashboard
- Google Analytics
- Custom analytics dashboard
- Email marketing platform

## Troubleshooting

### Common Issues

1. **Webhook failures**: Check webhook endpoint URL and secret
2. **Payment declines**: Test with different card types
3. **Database errors**: Verify database schema and migrations
4. **CORS issues**: Check backend CORS configuration

### Support Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)
- [Flask Documentation](https://flask.palletsprojects.com)
- [React Documentation](https://react.dev)

## Next Steps

1. Set up Stripe account and get API keys
2. Configure environment variables
3. Test the donation system
4. Set up webhooks
5. Deploy to production
6. Monitor and optimize

Remember: Start with test mode and only switch to live mode when you're confident everything works correctly!
