#!/usr/bin/env python3
"""
Test script for the donation system
Run this to verify all endpoints are working correctly
"""

import requests
import json
import os
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5000/api"
TEST_EMAIL = "test@example.com"

def test_donation_endpoints():
    """Test all donation endpoints"""
    
    print("🧪 Testing Donation System Endpoints")
    print("=" * 50)
    
    # Test 1: Get donation stats
    print("\n1. Testing GET /donations/stats")
    try:
        response = requests.get(f"{BASE_URL}/donations/stats")
        if response.status_code == 200:
            stats = response.json()
            print(f"✅ Success: {stats}")
        else:
            print(f"❌ Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Create payment intent
    print("\n2. Testing POST /donations/create-payment-intent")
    try:
        payment_data = {
            "amount": 500,  # $5.00
            "currency": "usd",
            "description": "Test donation",
            "email": TEST_EMAIL
        }
        response = requests.post(f"{BASE_URL}/donations/create-payment-intent", 
                               json=payment_data)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success: Payment intent created")
            print(f"   Client Secret: {result.get('client_secret', 'N/A')[:20]}...")
            print(f"   Payment Intent ID: {result.get('payment_intent_id', 'N/A')}")
        else:
            print(f"❌ Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: Create subscription
    print("\n3. Testing POST /donations/create-subscription")
    try:
        subscription_data = {
            "amount": 1500,  # $15.00
            "currency": "usd",
            "tier": "patron",
            "email": TEST_EMAIL
        }
        response = requests.post(f"{BASE_URL}/donations/create-subscription", 
                               json=subscription_data)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success: Subscription created")
            print(f"   Subscription ID: {result.get('subscription_id', 'N/A')}")
            print(f"   Customer ID: {result.get('customer_id', 'N/A')}")
        else:
            print(f"❌ Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 4: Get user subscription
    print("\n4. Testing GET /donations/subscriptions/{email}")
    try:
        response = requests.get(f"{BASE_URL}/donations/subscriptions/{TEST_EMAIL}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success: {result}")
        else:
            print(f"❌ Failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("🎉 Donation system test completed!")

def test_stripe_connection():
    """Test Stripe connection"""
    print("\n🔌 Testing Stripe Connection")
    print("=" * 30)
    
    try:
        import stripe
        stripe.api_key = os.getenv('STRIPE_SECRET_KEY', 'sk_test_your_test_key_here')
        
        # Test Stripe connection by creating a test payment intent
        payment_intent = stripe.PaymentIntent.create(
            amount=1000,
            currency='usd',
            description='Test connection'
        )
        
        print(f"✅ Stripe connection successful!")
        print(f"   Test Payment Intent ID: {payment_intent.id}")
        
    except Exception as e:
        print(f"❌ Stripe connection failed: {e}")
        print("   Make sure you have set STRIPE_SECRET_KEY in your environment")

if __name__ == "__main__":
    print("🚀 Starting Donation System Tests")
    print("Make sure your backend server is running on http://localhost:5000")
    print("Press Enter to continue...")
    input()
    
    test_stripe_connection()
    test_donation_endpoints() 