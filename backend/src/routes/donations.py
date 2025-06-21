from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import stripe
import os
from datetime import datetime
from ..models.user import db, Donation, Subscription
import json

donations_bp = Blueprint('donations', __name__)

# Initialize Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY', 'sk_test_your_test_key_here')

@donations_bp.route('/donations/create-payment-intent', methods=['POST'])
@cross_origin()
def create_payment_intent():
    """Create a Stripe payment intent for one-time donations"""
    try:
        data = request.get_json()
        amount = data.get('amount')  # Amount in cents
        currency = data.get('currency', 'usd')
        description = data.get('description', 'DOT Platform Support')
        
        # Create payment intent
        payment_intent = stripe.PaymentIntent.create(
            amount=amount,
            currency=currency,
            description=description,
            metadata={
                'donation_type': 'one_time',
                'platform': 'DOT'
            }
        )
        
        return jsonify({
            'client_secret': payment_intent.client_secret,
            'payment_intent_id': payment_intent.id
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@donations_bp.route('/donations/create-subscription', methods=['POST'])
@cross_origin()
def create_subscription():
    """Create a Stripe subscription for recurring donations"""
    try:
        data = request.get_json()
        amount = data.get('amount')  # Amount in cents
        currency = data.get('currency', 'usd')
        tier = data.get('tier', 'supporter')
        email = data.get('email')
        
        # Create or get customer
        customer = stripe.Customer.create(
            email=email,
            metadata={
                'platform': 'DOT',
                'tier': tier
            }
        )
        
        # Create subscription
        subscription = stripe.Subscription.create(
            customer=customer.id,
            items=[{
                'price_data': {
                    'currency': currency,
                    'unit_amount': amount,
                    'product_data': {
                        'name': f'DOT {tier.title()} Support',
                        'description': f'Monthly support for DOT platform - {tier} tier'
                    },
                },
                'recurring': {
                    'interval': 'month',
                },
            }],
            metadata={
                'platform': 'DOT',
                'tier': tier
            }
        )
        
        return jsonify({
            'subscription_id': subscription.id,
            'customer_id': customer.id,
            'status': subscription.status
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@donations_bp.route('/donations/confirm-payment', methods=['POST'])
@cross_origin()
def confirm_payment():
    """Confirm a payment and save to database"""
    try:
        data = request.get_json()
        payment_intent_id = data.get('payment_intent_id')
        amount = data.get('amount')
        email = data.get('email')
        tier = data.get('tier', 'custom')
        
        # Verify payment with Stripe
        payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        if payment_intent.status == 'succeeded':
            # Save donation to database
            donation = Donation(
                amount=amount,
                currency='usd',
                payment_intent_id=payment_intent_id,
                email=email,
                tier=tier,
                status='completed',
                donation_type='one_time'
            )
            db.session.add(donation)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Payment confirmed successfully',
                'donation_id': donation.id
            })
        else:
            return jsonify({'error': 'Payment not completed'}), 400
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@donations_bp.route('/donations/confirm-subscription', methods=['POST'])
@cross_origin()
def confirm_subscription():
    """Confirm a subscription and save to database"""
    try:
        data = request.get_json()
        subscription_id = data.get('subscription_id')
        customer_id = data.get('customer_id')
        amount = data.get('amount')
        email = data.get('email')
        tier = data.get('tier', 'supporter')
        
        # Verify subscription with Stripe
        subscription = stripe.Subscription.retrieve(subscription_id)
        
        if subscription.status == 'active':
            # Save subscription to database
            sub = Subscription(
                subscription_id=subscription_id,
                customer_id=customer_id,
                amount=amount,
                currency='usd',
                email=email,
                tier=tier,
                status='active',
                current_period_start=datetime.fromtimestamp(subscription.current_period_start),
                current_period_end=datetime.fromtimestamp(subscription.current_period_end)
            )
            db.session.add(sub)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Subscription confirmed successfully',
                'subscription_id': sub.id
            })
        else:
            return jsonify({'error': 'Subscription not active'}), 400
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@donations_bp.route('/donations/webhook', methods=['POST'])
@cross_origin()
def stripe_webhook():
    """Handle Stripe webhooks for subscription updates"""
    try:
        payload = request.get_data(as_text=True)
        sig_header = request.headers.get('Stripe-Signature')
        
        # Verify webhook signature (you'll need to set up webhook endpoint in Stripe)
        # event = stripe.Webhook.construct_event(payload, sig_header, os.getenv('STRIPE_WEBHOOK_SECRET'))
        
        # For now, just parse the event
        event = stripe.Event.construct_from(json.loads(payload), sig_header)
        
        if event.type == 'invoice.payment_succeeded':
            # Handle successful subscription payment
            subscription_id = event.data.object.subscription
            subscription = Subscription.query.filter_by(subscription_id=subscription_id).first()
            if subscription:
                subscription.status = 'active'
                db.session.commit()
        
        elif event.type == 'customer.subscription.deleted':
            # Handle subscription cancellation
            subscription_id = event.data.object.id
            subscription = Subscription.query.filter_by(subscription_id=subscription_id).first()
            if subscription:
                subscription.status = 'cancelled'
                db.session.commit()
        
        return jsonify({'success': True})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@donations_bp.route('/donations/stats', methods=['GET'])
@cross_origin()
def get_donation_stats():
    """Get donation statistics"""
    try:
        # Get total donations
        total_donations = db.session.query(db.func.sum(Donation.amount)).scalar() or 0
        
        # Get active subscriptions
        active_subscriptions = Subscription.query.filter_by(status='active').count()
        
        # Get monthly recurring revenue
        monthly_revenue = db.session.query(db.func.sum(Subscription.amount)).filter_by(status='active').scalar() or 0
        
        # Get supporter count
        supporter_count = db.session.query(db.func.count(db.func.distinct(Donation.email))).scalar() or 0
        supporter_count += db.session.query(db.func.count(db.func.distinct(Subscription.email))).scalar() or 0
        
        return jsonify({
            'total_donations': total_donations,
            'active_subscriptions': active_subscriptions,
            'monthly_revenue': monthly_revenue,
            'supporter_count': supporter_count
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@donations_bp.route('/donations/subscriptions/<email>', methods=['GET'])
@cross_origin()
def get_user_subscriptions(email):
    """Get user's subscription status"""
    try:
        subscription = Subscription.query.filter_by(email=email, status='active').first()
        
        if subscription:
            return jsonify({
                'has_subscription': True,
                'tier': subscription.tier,
                'amount': subscription.amount,
                'subscription_id': subscription.subscription_id
            })
        else:
            return jsonify({
                'has_subscription': False
            })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400 