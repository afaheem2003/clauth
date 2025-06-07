#!/usr/bin/env node

const { spawn } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Stripe Webhook Testing Script');
console.log('====================================');

function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
  });
}

async function testWebhookEndpoint() {
  console.log('\n📡 Testing webhook endpoint...');
  
  try {
    const response = await fetch('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test-signature'
      },
      body: JSON.stringify({
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123',
            status: 'active',
            items: {
              data: [{
                price: {
                  id: 'price_1RX5cMRgxXa12fTw2kN2DeeF'
                }
              }]
            }
          }
        }
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response:', await response.text());
  } catch (error) {
    console.error('❌ Error testing webhook:', error.message);
  }
}

async function main() {
  console.log('\nChoose an option:');
  console.log('1. Start webhook forwarding to local server');
  console.log('2. Test webhook endpoint directly');
  console.log('3. List recent webhook events');
  console.log('4. Simulate subscription update event');
  
  rl.question('\nEnter your choice (1-4): ', async (answer) => {
    try {
      switch (answer) {
        case '1':
          console.log('\n🔄 Starting webhook forwarding...');
          console.log('Make sure your local server is running on port 3000');
          console.log('This will forward Stripe events to: http://localhost:3000/api/webhooks/stripe');
          await runCommand('stripe', ['listen', '--forward-to', 'localhost:3000/api/webhooks/stripe']);
          break;
          
        case '2':
          await testWebhookEndpoint();
          break;
          
        case '3':
          console.log('\n📋 Recent webhook events:');
          await runCommand('stripe', ['events', 'list', '--limit', '10']);
          break;
          
        case '4':
          console.log('\n🧪 Simulating subscription update...');
          console.log('This will trigger a customer.subscription.updated event');
          await runCommand('stripe', ['events', 'resend', 'evt_test_webhook']);
          break;
          
        default:
          console.log('❌ Invalid choice');
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    } finally {
      rl.close();
    }
  });
}

main(); 