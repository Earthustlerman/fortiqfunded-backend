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

// ── Email to admin ──
async function sendEmail(subject, text) {
  try {
    await mailer.sendMail({
      from: 'payments@fortiqfunded.com',
      to: 'payments@fortiqfunded.com',
      subject: subject,
      text: text
    });
    console.log('Admin email sent:', subject);
  } catch (e) {
    console.log('Email error:', e.message);
  }
}

// ── Email to trader ──
async function sendTraderEmail(toEmail, subject, html) {
  try {
    await mailer.sendMail({
      from: '"Fortiq Funded" <payments@fortiqfunded.com>',
      to: toEmail,
      subject: subject,
      html: html
    });
    console.log('Trader email sent to:', toEmail);
  } catch (e) {
    console.log('Trader email error:', e.message);
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

// ── PAYOUT NOTIFICATION ENDPOINT ──
app.post('/notify-payout', async (req, res) => {
  const { account_id, payout_amount, wallet_address } = req.body;

  if (!account_id || !payout_amount || !wallet_address) {
    return res.status(400).json({ error: 'Missing required fields: account_id, payout_amount, wallet_address' });
  }

  try {
    // Get account details
    const { data: account, error: accErr } = await supabase
      .from('accounts')
      .select('user_id, profit')
      .eq('account_id', account_id)
      .single();

    if (accErr || !account) {
      return res.status(404).json({ error: 'Account not found' });
    }

    // Get trader profile (email, name)
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('full_name, email, user_id')
      .eq('id', account.user_id)
      .single();

    if (profErr || !profile) {
      return res.status(404).json({ error: 'Trader profile not found' });
    }

    const traderName = profile.full_name || 'Trader';
    const traderEmail = profile.email;
    const totalProfit = parseFloat(account.profit || 0).toFixed(2);

    // Send email to trader
    const traderHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#04060f;font-family:'Outfit',Arial,sans-serif;color:#e8e6ff;">
  <div style="max-width:560px;margin:40px auto;background:#070b18;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;">
    
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0f1829,#162038);padding:32px;text-align:center;border-bottom:1px solid rgba(201,168,76,0.2);">
      <div style="font-size:28px;margin-bottom:8px;">🎉</div>
      <h1 style="font-family:'Cinzel',Georgia,serif;font-size:22px;font-weight:700;margin:0;background:linear-gradient(135deg,#c9a84c,#e8c96a);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">
        Payout Sent!
      </h1>
      <p style="color:#7a7a9a;font-size:14px;margin:8px 0 0;">Fortiq Funded — Profit Share Payment</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="font-size:15px;color:#e8e6ff;margin:0 0 20px;">Hi ${traderName},</p>
      <p style="font-size:14px;color:#7a7a9a;line-height:1.7;margin:0 0 24px;">
        Congratulations on passing the Fortiq Funded challenge! Your 80% profit share has been sent to your wallet. Here are the details:
      </p>

      <!-- Payment Details -->
      <div style="background:#0f1829;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
          <span style="color:#7a7a9a;font-size:13px;">Account ID</span>
          <span style="color:#a78bfa;font-family:monospace;font-size:13px;">${account_id}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
          <span style="color:#7a7a9a;font-size:13px;">Total Profit Earned</span>
          <span style="color:#00d68f;font-family:monospace;font-size:13px;">$${totalProfit} USDT</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
          <span style="color:#7a7a9a;font-size:13px;">Your Share (80%)</span>
          <span style="color:#c9a84c;font-family:monospace;font-size:16px;font-weight:700;">$${payout_amount} USDT</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
          <span style="color:#7a7a9a;font-size:13px;">Payment Method</span>
          <span style="color:#e8e6ff;font-size:13px;">USDT TRC20</span>
        </div>
        <div style="padding:10px 0;">
          <span style="color:#7a7a9a;font-size:13px;display:block;margin-bottom:4px;">Wallet Address</span>
          <span style="color:#e8e6ff;font-family:monospace;font-size:11px;word-break:break-all;">${wallet_address}</span>
        </div>
      </div>

      <p style="font-size:13px;color:#7a7a9a;line-height:1.7;margin:0 0 24px;">
        The USDT should appear in your wallet within a few minutes depending on network congestion. 
        If you don't see it after 30 minutes, please contact us at 
        <a href="mailto:payments@fortiqfunded.com" style="color:#a78bfa;">payments@fortiqfunded.com</a>
      </p>

      <!-- Note -->
      <div style="background:rgba(108,61,232,0.08);border:1px solid rgba(108,61,232,0.2);border-radius:10px;padding:16px;margin-bottom:24px;">
        <p style="font-size:13px;color:#a78bfa;margin:0;line-height:1.6;">
          💡 <strong>What's next?</strong> This funded account has reached its lifetime profit cap. 
          If you'd like to continue trading with Fortiq Funded, you can purchase a new challenge at any time.
        </p>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin-bottom:24px;">
        <a href="https://fortiqfunded.com/checkout.html" 
           style="display:inline-block;background:linear-gradient(135deg,#6c3de8,#1e5fff);color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:600;font-size:14px;">
          Start New Challenge
        </a>
      </div>

      <p style="font-size:13px;color:#7a7a9a;line-height:1.7;margin:0;">
        Thank you for trading with Fortiq Funded. We look forward to funding you again!
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#04060f;padding:20px 32px;border-top:1px solid rgba(255,255,255,0.04);text-align:center;">
      <p style="font-size:11px;color:#555575;margin:0;">
        Fortiq Funded — Fortiq Prop Digital<br>
        <a href="https://fortiqfunded.com" style="color:#6c3de8;text-decoration:none;">fortiqfunded.com</a> · 
        <a href="mailto:support@fortiqfunded.com" style="color:#6c3de8;text-decoration:none;">support@fortiqfunded.com</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    await sendTraderEmail(
      traderEmail,
      '🎉 Your Fortiq Funded Payout Has Been Sent — $' + payout_amount + ' USDT',
      traderHtml
    );

    // Also notify admin
    await sendEmail(
      'Payout Processed — ' + account_id,
      'Payout has been marked as sent.\n\n' +
      'Account: ' + account_id + '\n' +
      'Trader: ' + traderName + '\n' +
      'Email: ' + traderEmail + '\n' +
      'Amount: $' + payout_amount + ' USDT\n' +
      'Wallet: ' + wallet_address + '\n' +
      'Total Profit: $' + totalProfit + ' USDT'
    );

    res.json({ success: true, message: 'Payout notification sent to ' + traderEmail });

  } catch (err) {
    console.log('Payout notification error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

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
