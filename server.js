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

// ── EMAIL TEMPLATES ──

function emailFooter() {
  return `
    <div style="background:#04060f;padding:20px 32px;border-top:1px solid rgba(255,255,255,0.04);text-align:center;">
      <p style="font-size:11px;color:#555575;margin:0;">Fortiq Funded — Fortiq Prop Digital<br>
      <a href="https://fortiqfunded.com" style="color:#6c3de8;text-decoration:none;">fortiqfunded.com</a> · 
      <a href="mailto:support@fortiqfunded.com" style="color:#6c3de8;text-decoration:none;">support@fortiqfunded.com</a></p>
    </div>`;
}

function emailWrapper(content) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#04060f;font-family:Arial,sans-serif;color:#e8e6ff;">
  <div style="max-width:560px;margin:40px auto;background:#070b18;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;">
    ${content}
    ${emailFooter()}
  </div>
</body>
</html>`;
}

function challengeActivatedEmail(traderName, accId, amount) {
  return emailWrapper(`
    <div style="background:linear-gradient(135deg,#0f1829,#162038);padding:32px;text-align:center;border-bottom:1px solid rgba(108,61,232,0.2);">
      <div style="font-size:28px;margin-bottom:8px;">🚀</div>
      <h1 style="font-family:Georgia,serif;font-size:22px;font-weight:700;margin:0;color:#a78bfa;">Challenge Activated!</h1>
      <p style="color:#7a7a9a;font-size:14px;margin:8px 0 0;">Your Fortiq Funded evaluation is live</p>
    </div>
    <div style="padding:32px;">
      <p style="font-size:15px;color:#e8e6ff;margin:0 0 16px;">Hi ${traderName},</p>
      <p style="font-size:14px;color:#7a7a9a;line-height:1.7;margin:0 0 24px;">
        Your payment of <strong style="color:#e8e6ff;">$${amount} USDT</strong> has been confirmed and your challenge account is now active. You can start trading immediately!
      </p>
      <div style="background:#0f1829;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Account ID</span><span style="color:#a78bfa;font-family:monospace;font-size:13px;">${accId}</span></div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Account Size</span><span style="color:#e8e6ff;font-size:13px;font-weight:600;">$5,000 USDT</span></div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Profit Target</span><span style="color:#e8e6ff;font-size:13px;font-weight:600;">8% ($400)</span></div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Daily Loss Limit</span><span style="color:#e8e6ff;font-size:13px;font-weight:600;">5% ($250)</span></div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Max Drawdown</span><span style="color:#e8e6ff;font-size:13px;font-weight:600;">8% ($400)</span></div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;"><span style="color:#7a7a9a;font-size:13px;">Min Active Days</span><span style="color:#e8e6ff;font-size:13px;font-weight:600;">5 Days</span></div>
      </div>
      <div style="background:rgba(108,61,232,0.08);border:1px solid rgba(108,61,232,0.2);border-radius:10px;padding:16px;margin-bottom:24px;">
        <p style="font-size:13px;color:#a78bfa;margin:0;line-height:1.6;">💡 <strong>Reminder:</strong> Trade at least 5 active days, hit 8% profit, and stay within the daily loss and drawdown limits to pass the challenge.</p>
      </div>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="https://fortiqfunded.com/dashboard.html" style="display:inline-block;background:linear-gradient(135deg,#6c3de8,#1e5fff);color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:600;font-size:14px;">Open Trading Terminal</a>
      </div>
      <p style="font-size:13px;color:#7a7a9a;line-height:1.7;margin:0;">Good luck! If you have any questions, contact us at <a href="mailto:support@fortiqfunded.com" style="color:#a78bfa;">support@fortiqfunded.com</a></p>
    </div>`);
}

function challengeFailedEmail(traderName, accId, reason) {
  return emailWrapper(`
    <div style="background:linear-gradient(135deg,#0f1829,#162038);padding:32px;text-align:center;border-bottom:1px solid rgba(240,61,61,0.2);">
      <div style="font-size:28px;margin-bottom:8px;">❌</div>
      <h1 style="font-family:Georgia,serif;font-size:22px;font-weight:700;margin:0;color:#f03d3d;">Challenge Failed</h1>
      <p style="color:#7a7a9a;font-size:14px;margin:8px 0 0;">Your Fortiq Funded evaluation has ended</p>
    </div>
    <div style="padding:32px;">
      <p style="font-size:15px;color:#e8e6ff;margin:0 0 16px;">Hi ${traderName},</p>
      <p style="font-size:14px;color:#7a7a9a;line-height:1.7;margin:0 0 24px;">
        Unfortunately your challenge account <strong style="color:#e8e6ff;">${accId}</strong> has been marked as failed. ${reason ? 'Reason: <strong style="color:#e8e6ff;">' + reason + '</strong>' : 'A trading rule was breached.'}
      </p>
      <div style="background:rgba(240,61,61,0.06);border:1px solid rgba(240,61,61,0.2);border-radius:10px;padding:16px;margin-bottom:24px;">
        <p style="font-size:13px;color:#f03d3d;margin:0;line-height:1.6;">Don't give up — every great trader has setbacks. Review what happened, adjust your strategy, and try again.</p>
      </div>
      <div style="background:#0f1829;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="font-size:13px;color:#7a7a9a;margin:0 0 12px;font-weight:600;">Quick reminder of the rules:</p>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:12px;">Profit Target</span><span style="color:#e8e6ff;font-size:12px;">8% ($400)</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:12px;">Daily Loss Limit</span><span style="color:#e8e6ff;font-size:12px;">5% max ($250)</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:12px;">Max Drawdown</span><span style="color:#e8e6ff;font-size:12px;">8% max ($400)</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;"><span style="color:#7a7a9a;font-size:12px;">Min Active Days</span><span style="color:#e8e6ff;font-size:12px;">5 days</span></div>
      </div>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="https://fortiqfunded.com/checkout.html" style="display:inline-block;background:linear-gradient(135deg,#6c3de8,#1e5fff);color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:600;font-size:14px;">Try Again — $150</a>
      </div>
      <p style="font-size:13px;color:#7a7a9a;line-height:1.7;margin:0;">Questions? Contact us at <a href="mailto:support@fortiqfunded.com" style="color:#a78bfa;">support@fortiqfunded.com</a></p>
    </div>`);
}

function challengeFundedEmail(traderName, accId, profit) {
  const payout = (parseFloat(profit) * 0.8).toFixed(2);
  return emailWrapper(`
    <div style="background:linear-gradient(135deg,#0f1829,#162038);padding:32px;text-align:center;border-bottom:1px solid rgba(201,168,76,0.2);">
      <div style="font-size:28px;margin-bottom:8px;">🏆</div>
      <h1 style="font-family:Georgia,serif;font-size:22px;font-weight:700;margin:0;color:#c9a84c;">Challenge Passed!</h1>
      <p style="color:#7a7a9a;font-size:14px;margin:8px 0 0;">You are now a funded Fortiq trader</p>
    </div>
    <div style="padding:32px;">
      <p style="font-size:15px;color:#e8e6ff;margin:0 0 16px;">Hi ${traderName},</p>
      <p style="font-size:14px;color:#7a7a9a;line-height:1.7;margin:0 0 24px;">
        Congratulations! You have successfully passed the Fortiq Funded evaluation challenge. Your account <strong style="color:#e8e6ff;">${accId}</strong> is now a funded account.
      </p>
      <div style="background:#0f1829;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Account ID</span><span style="color:#a78bfa;font-family:monospace;font-size:13px;">${accId}</span></div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Total Profit</span><span style="color:#00d68f;font-size:13px;font-weight:600;">$${parseFloat(profit).toFixed(2)} USDT</span></div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;"><span style="color:#7a7a9a;font-size:13px;">Your Payout (80%)</span><span style="color:#c9a84c;font-size:16px;font-weight:700;">$${payout} USDT</span></div>
      </div>
      <div style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.2);border-radius:10px;padding:16px;margin-bottom:24px;">
        <p style="font-size:13px;color:#c9a84c;margin:0;line-height:1.6;">💰 <strong>Next step:</strong> Log in to your dashboard, go to the Payouts section, and submit your TRC20 wallet address to receive your <strong>$${payout} USDT</strong> payout. Payouts are processed every Saturday.</p>
      </div>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="https://fortiqfunded.com/dashboard.html" style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#e8c96a);color:#000;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:700;font-size:14px;">Claim Your Payout →</a>
      </div>
      <p style="font-size:13px;color:#7a7a9a;line-height:1.7;margin:0;">Questions about your payout? Contact us at <a href="mailto:payments@fortiqfunded.com" style="color:#a78bfa;">payments@fortiqfunded.com</a></p>
    </div>`);
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

  await supabase.from('accounts').upsert({
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

  // Email to admin
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

  // Email to trader
  await sendTraderEmail(
    profile.email,
    '🚀 Your Fortiq Funded Challenge is Now Active — ' + accId,
    challengeActivatedEmail(profile.full_name || 'Trader', accId, parseFloat(payment.amount).toFixed(2))
  );
}

// ── NOTIFY ACCOUNT STATUS CHANGE ──
app.post('/notify-status', async (req, res) => {
  const { account_id, status, reason } = req.body;
  if (!account_id || !status) {
    return res.status(400).json({ error: 'Missing account_id or status' });
  }
  try {
    const { data: account } = await supabase
      .from('accounts')
      .select('user_id, profit')
      .eq('account_id', account_id)
      .single();

    if (!account) return res.status(404).json({ error: 'Account not found' });

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', account.user_id)
      .single();

    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const traderName = profile.full_name || 'Trader';
    const traderEmail = profile.email;

    if (status === 'failed') {
      await sendTraderEmail(
        traderEmail,
        '❌ Your Fortiq Funded Challenge Has Ended — ' + account_id,
        challengeFailedEmail(traderName, account_id, reason || '')
      );
      await sendEmail(
        'Challenge Failed — ' + account_id,
        'Account ' + account_id + ' has been marked as failed.\nTrader: ' + traderName + '\nEmail: ' + traderEmail + (reason ? '\nReason: ' + reason : '')
      );
    } else if (status === 'funded') {
      await sendTraderEmail(
        traderEmail,
        '🏆 Congratulations! You Passed the Fortiq Funded Challenge — ' + account_id,
        challengeFundedEmail(traderName, account_id, account.profit || 0)
      );
      await sendEmail(
        'Challenge Passed — ' + account_id,
        'Account ' + account_id + ' has been marked as funded!\nTrader: ' + traderName + '\nEmail: ' + traderEmail + '\nProfit: $' + account.profit
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.log('Notify status error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── ADMIN LOGIN ──
app.post('/admin-login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ success: false, error: 'Missing password' });
  if (password === process.env.ADMIN_PASSWORD) {
    return res.json({ success: true });
  }
  return res.status(401).json({ success: false, error: 'Incorrect password' });
});

// ── PAYOUT NOTIFICATION ENDPOINT ──
app.post('/notify-payout', async (req, res) => {
  const { account_id, payout_amount, wallet_address } = req.body;

  if (!account_id || !payout_amount || !wallet_address) {
    return res.status(400).json({ error: 'Missing required fields: account_id, payout_amount, wallet_address' });
  }

  try {
    const { data: account, error: accErr } = await supabase
      .from('accounts')
      .select('user_id, profit')
      .eq('account_id', account_id)
      .single();

    if (accErr || !account) {
      return res.status(404).json({ error: 'Account not found' });
    }

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

    const traderHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#04060f;font-family:Arial,sans-serif;color:#e8e6ff;">
  <div style="max-width:560px;margin:40px auto;background:#070b18;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#0f1829,#162038);padding:32px;text-align:center;border-bottom:1px solid rgba(201,168,76,0.2);">
      <div style="font-size:28px;margin-bottom:8px;">🎉</div>
      <h1 style="font-family:Georgia,serif;font-size:22px;font-weight:700;margin:0;color:#c9a84c;">Payout Sent!</h1>
      <p style="color:#7a7a9a;font-size:14px;margin:8px 0 0;">Fortiq Funded — Profit Share Payment</p>
    </div>
    <div style="padding:32px;">
      <p style="font-size:15px;color:#e8e6ff;margin:0 0 20px;">Hi ${traderName},</p>
      <p style="font-size:14px;color:#7a7a9a;line-height:1.7;margin:0 0 24px;">Congratulations on passing the Fortiq Funded challenge! Your 80% profit share has been sent to your wallet.</p>
      <div style="background:#0f1829;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Account ID</span><span style="color:#a78bfa;font-family:monospace;font-size:13px;">${account_id}</span></div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Total Profit Earned</span><span style="color:#00d68f;font-family:monospace;font-size:13px;">$${totalProfit} USDT</span></div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Your Share (80%)</span><span style="color:#c9a84c;font-family:monospace;font-size:16px;font-weight:700;">$${payout_amount} USDT</span></div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Payment Method</span><span style="color:#e8e6ff;font-size:13px;">USDT TRC20</span></div>
        <div style="padding:10px 0;"><span style="color:#7a7a9a;font-size:13px;display:block;margin-bottom:4px;">Wallet Address</span><span style="color:#e8e6ff;font-family:monospace;font-size:11px;word-break:break-all;">${wallet_address}</span></div>
      </div>
      <p style="font-size:13px;color:#7a7a9a;line-height:1.7;margin:0 0 24px;">The USDT should appear in your wallet within a few minutes. If you don't see it after 30 minutes, contact <a href="mailto:payments@fortiqfunded.com" style="color:#a78bfa;">payments@fortiqfunded.com</a></p>
      <div style="background:rgba(108,61,232,0.08);border:1px solid rgba(108,61,232,0.2);border-radius:10px;padding:16px;margin-bottom:24px;">
        <p style="font-size:13px;color:#a78bfa;margin:0;line-height:1.6;">💡 <strong>What's next?</strong> This funded account has reached its lifetime profit cap. Purchase a new challenge to continue trading.</p>
      </div>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="https://fortiqfunded.com/checkout.html" style="display:inline-block;background:linear-gradient(135deg,#6c3de8,#1e5fff);color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:600;font-size:14px;">Start New Challenge</a>
      </div>
      <p style="font-size:13px;color:#7a7a9a;line-height:1.7;margin:0;">Thank you for trading with Fortiq Funded!</p>
    </div>
    <div style="background:#04060f;padding:20px 32px;border-top:1px solid rgba(255,255,255,0.04);text-align:center;">
      <p style="font-size:11px;color:#555575;margin:0;">Fortiq Funded — Fortiq Prop Digital<br><a href="https://fortiqfunded.com" style="color:#6c3de8;text-decoration:none;">fortiqfunded.com</a> · <a href="mailto:support@fortiqfunded.com" style="color:#6c3de8;text-decoration:none;">support@fortiqfunded.com</a></p>
    </div>
  </div>
</body>
</html>`;

    await sendTraderEmail(traderEmail, '🎉 Your Fortiq Funded Payout Has Been Sent — $' + payout_amount + ' USDT', traderHtml);
    await sendEmail('Payout Processed — ' + account_id, 'Payout has been marked as sent.\n\nAccount: ' + account_id + '\nTrader: ' + traderName + '\nEmail: ' + traderEmail + '\nAmount: $' + payout_amount + ' USDT\nWallet: ' + wallet_address + '\nTotal Profit: $' + totalProfit + ' USDT');

    res.json({ success: true, message: 'Payout notification sent to ' + traderEmail });

  } catch (err) {
    console.log('Payout notification error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── LEADERBOARD — only shows paid out traders ──
app.get('/leaderboard', async (req, res) => {
  try {
    const { data: accounts } = await supabase
      .from('accounts')
      .select('account_id, user_id, profit, active_days, status, payout_amount')
      .eq('status', 'funded')
      .eq('paid_out', true)
      .order('profit', { ascending: false })
      .limit(20);

    if (!accounts || accounts.length === 0) {
      return res.json({ leaderboard: [] });
    }

    const leaderboard = await Promise.all(accounts.map(async (acc, index) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', acc.user_id)
        .single();

      const name = profile ? profile.full_name : 'Anonymous Trader';
      const firstName = name.split(' ')[0];
      const lastInitial = name.split(' ')[1] ? name.split(' ')[1][0] + '.' : '';

      return {
        rank: index + 1,
        name: firstName + (lastInitial ? ' ' + lastInitial : ''),
        account_id: acc.account_id,
        profit: parseFloat(acc.profit || 0).toFixed(2),
        payout: parseFloat(acc.payout_amount || 0).toFixed(2),
        profit_pct: ((parseFloat(acc.profit || 0) / 5000) * 100).toFixed(2),
        active_days: acc.active_days || 0,
        status: acc.status
      };
    }));

    res.json({ leaderboard });
  } catch (err) {
    console.log('Leaderboard error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Check payments every 2 minutes
cron.schedule('*/2 * * * *', checkPendingPayments);

// Reset daily loss at midnight UTC every day
cron.schedule('0 0 * * *', async function() {
  console.log('Resetting daily loss for all active accounts...');
  try {
    const { data, error } = await supabase
      .from('accounts')
      .update({ daily_loss: 0 })
      .in('status', ['to_be_active', 'active', 'funded']);
    if (error) {
      console.log('Daily loss reset error:', error.message);
    } else {
      console.log('Daily loss reset complete');
    }
  } catch (err) {
    console.log('Daily loss reset failed:', err.message);
  }
});

app.get('/', (req, res) => res.send('Fortiq Funded Backend Running'));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ── REFERRAL TRACKING ──
app.post('/track-referral', async (req, res) => {
  const { referrer_code, referred_user_id } = req.body;
  if (!referrer_code || !referred_user_id) {
    return res.status(400).json({ error: 'Missing referrer_code or referred_user_id' });
  }
  try {
    const { data: referrer } = await supabase
      .from('profiles')
      .select('user_id')
      .or('user_id.eq.' + referrer_code + ',referral_code.eq.' + referrer_code)
      .single();

    if (!referrer) {
      return res.status(404).json({ error: 'Referrer not found' });
    }

    const { data: existing } = await supabase
      .from('affiliates')
      .select('id')
      .eq('referrer_id', referrer.user_id)
      .eq('referred_id', referred_user_id)
      .single();

    if (existing) {
      return res.json({ success: true, message: 'Referral already tracked' });
    }

    const { error } = await supabase.from('affiliates').insert({
      referrer_id: referrer.user_id,
      referred_id: referred_user_id,
      status: 'pending',
      commission: 50,
      paid: false
    });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    console.log('Referral tracked:', referrer.user_id, '->', referred_user_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/check-payment', async (req, res) => {
  await checkPendingPayments();
  res.json({ message: 'Check triggered' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port', PORT));
