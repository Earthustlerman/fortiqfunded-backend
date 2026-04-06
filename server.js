const express = require('express');
const fetch = require('node-fetch');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendEmail(subject, text) {
  try {
    await mailer.sendMail({
      from: 'payments@fortiqfunded.com',
      to: 'payments@fortiqfunded.com',
      subject: subject,
      text: text
    });
    console.log('Email sent:', subject);
  } catch (e) {
    console.log('Email error:', e.message);
  }
}

async function checkPendingPayments() {
  console.log('Checking pending payments...');
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('status', 'pending');

  if (!payments || payments.length === 0) return;

  for (const payment of payments) {
    try {
      const res = await fetch(
        'https://api.trongrid.io/v1/transactions/' + payment.tx_hash
      );
      const data = await res.json();

      if (!data.data || data.data.length === 0) continue;

      const tx = data.data[0];
      const confirmations = tx.confirmations || 0;
      let amount = 0;

      if (tx.trc20_transfers && tx.trc20_transfers.length > 0) {
        amount = parseInt(tx.trc20_transfers[0].amount_str || '0') / 1000000;
      }

      console.log('TX:', payment.tx_hash, '| Amount:', amount, '| Confirmations:', confirmations);

      await supabase.from('payments').update({
        confirmations: confirmations,
        amount: amount
      }).eq('id', payment.id);

      if (amount < 148) {
        console.log('Amount too low:', amount);
        await supabase.from('payments').update({ status: 'insufficient' }).eq('id', payment.id);
        await sendEmail(
          'Payment Below Minimum — Fortiq Funded',
          'A payment was received but was below the $148 minimum.\n\nTX Hash: ' + payment.tx_hash + '\nAmount: $' + amount + ' USDT\nUser ID: ' + payment.user_id
        );
        continue;
      }

      if (confirmations >= 19) {
        await activateChallenge(payment);
      }

    } catch (err) {
      console.log('Error checking TX:', payment.tx_hash, err.message);
    }
  }
}

async function activateChallenge(payment) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, full_name, email')
    .eq('id', payment.user_id)
    .single();

  if (!profile) return;

  const userNum = profile.user_id.replace('USR-', '');
  const accId = 'ACC-' + userNum;

  const { error } = await supabase.from('accounts').upsert({
    user_id: payment.user_id,
    account_id: accId,
    account_type: 'challenge',
    status: 'to_be_active',
    balance: 5000,
    profit: 0,
    daily_loss: 0,
    max_drawdown: 0,
    active_days: 0
  }, { onConflict: 'account_id' });

  await supabase.from('payments').update({
    status: 'confirmed',
    account_id: accId
  }).eq('id', payment.id);

  console.log('Challenge activated:', accId);

  await sendEmail(
    'New Challenge Activated — Fortiq Funded',
    'A new challenge has been activated!\n\n' +
    'Trader: ' + profile.full_name + '\n' +
    'Email: ' + profile.email + '\n' +
    'User ID: ' + profile.user_id + '\n' +
    'Account ID: ' + accId + '\n' +
    'Amount Paid: $' + payment.amount + ' USDT\n' +
    'TX Hash: ' + payment.tx_hash + '\n' +
    'Confirmations: ' + payment.confirmations
  );
}

// Check every 2 minutes
cron.schedule('*/2 * * * *', checkPendingPayments);

app.get('/', (req, res) => res.send('Fortiq Funded Backend Running'));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.post('/check-payment', async (req, res) => {
  await checkPendingPayments();
  res.json({ message: 'Check triggered' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port', PORT));
