const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const cron = require('node-cron');
const { Resend } = require('resend');
const { createClient } = require('@supabase/supabase-js');

const app = express();

app.use(cors({
  origin: [
    'https://fortiqfunded.com',
    'https://www.fortiqfunded.com',
    'http://localhost:3000',
    'http://127.0.0.1:5500'
  ],
  methods: ['GET','POST'],
  credentials: true
}));

app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);
const TRONGRID_KEY = process.env.TRONGRID_API_KEY;

async function sendEmail(subject, text) {
  try {
    await resend.emails.send({
      from: 'Fortiq Funded <support@fortiqfunded.com>',
      to: 'support@fortiqfunded.com',
      subject: subject,
      text: text
    });
    console.log('Admin email sent:', subject);
  } catch (e) {
    console.log('Email error:', e.message);
  }
}

async function sendTraderEmail(toEmail, subject, html) {
  try {
    await resend.emails.send({
      from: 'Fortiq Funded <support@fortiqfunded.com>',
      to: toEmail,
      subject: subject,
      html: html
    });
    console.log('Trader email sent to:', toEmail);
  } catch (e) {
    console.log('Trader email error:', e.message);
  }
}

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
        <a href="https://fortiqfunded.com/terminal.html" style="display:inline-block;background:linear-gradient(135deg,#6c3de8,#1e5fff);color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:600;font-size:14px;">Open Trading Terminal</a>
      </div>
      <p style="font-size:13px;color:#7a7a9a;line-height:1.7;margin:0;">Good luck! If you have any questions, contact us at <a href="mailto:support@fortiqfunded.com" style="color:#a78bfa;">support@fortiqfunded.com</a></p>
    </div>`);
}

function challengeFailedEmail(traderName, accId, reason) {
  return emailWrapper(`
    <div style="background:linear-gradient(135deg,#0f1829,#162038);padding:32px;text-align:center;border-bottom:1px solid rgba(240,61,61,0.2);">
      <div style="font-size:28px;margin-bottom:8px;">❌</div>
      <h1 style="font-family:Georgia,serif;font-size:22px;font-weight:700;margin:0;color:#f03d3d;">Account Failed</h1>
      <p style="color:#7a7a9a;font-size:14px;margin:8px 0 0;">Your trading account has been closed</p>
    </div>
    <div style="padding:32px;">
      <p style="font-size:15px;color:#e8e6ff;margin:0 0 16px;">Hi ${traderName},</p>
      <p style="font-size:14px;color:#7a7a9a;line-height:1.7;margin:0 0 24px;">
        Unfortunately your account <strong style="color:#e8e6ff;">${accId}</strong> has been marked as failed. ${reason ? 'Reason: <strong style="color:#e8e6ff;">' + reason + '</strong>' : 'A trading rule was breached.'}
      </p>
      <div style="background:rgba(240,61,61,0.06);border:1px solid rgba(240,61,61,0.2);border-radius:10px;padding:16px;margin-bottom:24px;">
        <p style="font-size:13px;color:#f03d3d;margin:0;line-height:1.6;">Don't give up — every great trader has setbacks. Review what happened, adjust your strategy, and try again.</p>
      </div>
      <div style="background:#0f1829;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin-bottom:24px;">
        <p style="font-size:13px;color:#7a7a9a;margin:0 0 12px;font-weight:600;">Quick reminder of the rules:</p>
        <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:12px;">Daily Loss Limit</span><span style="color:#e8e6ff;font-size:12px;">5% max ($250)</span></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;"><span style="color:#7a7a9a;font-size:12px;">Max Drawdown</span><span style="color:#e8e6ff;font-size:12px;">8% max ($400)</span></div>
      </div>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="https://fortiqfunded.com/checkout.html" style="display:inline-block;background:linear-gradient(135deg,#6c3de8,#1e5fff);color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:600;font-size:14px;">Try Again — $150</a>
      </div>
      <p style="font-size:13px;color:#7a7a9a;line-height:1.7;margin:0;">Questions? Contact us at <a href="mailto:support@fortiqfunded.com" style="color:#a78bfa;">support@fortiqfunded.com</a></p>
    </div>`);
}

function stage2ActivatedEmail(traderName, accId) {
  return emailWrapper(`
    <div style="background:linear-gradient(135deg,#0f1829,#162038);padding:32px;text-align:center;border-bottom:1px solid rgba(201,168,76,0.2);">
      <div style="font-size:28px;margin-bottom:8px;">🏆</div>
      <h1 style="font-family:Georgia,serif;font-size:22px;font-weight:700;margin:0;color:#c9a84c;">You're Now Funded!</h1>
      <p style="color:#7a7a9a;font-size:14px;margin:8px 0 0;">Stage 2 — Funded Account Activated</p>
    </div>
    <div style="padding:32px;">
      <p style="font-size:15px;color:#e8e6ff;margin:0 0 16px;">Hi ${traderName},</p>
      <p style="font-size:14px;color:#7a7a9a;line-height:1.7;margin:0 0 24px;">
        Congratulations on passing the challenge! Your funded account is now active. Trade freely and keep <strong style="color:#c9a84c;">80% of every dollar you earn</strong>. Request a payout whenever you are ready from your dashboard.
      </p>
      <div style="background:#0f1829;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Funded Account ID</span><span style="color:#c9a84c;font-family:monospace;font-size:13px;">${accId}</span></div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Account Size</span><span style="color:#e8e6ff;font-size:13px;font-weight:600;">$5,000 USDT</span></div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Profit Split</span><span style="color:#c9a84c;font-size:13px;font-weight:600;">80% Yours</span></div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Max Account Profit</span><span style="color:#c9a84c;font-size:13px;font-weight:600;">$5,000 USDT</span></div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Daily Loss Limit</span><span style="color:#e8e6ff;font-size:13px;font-weight:600;">5% ($250)</span></div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;"><span style="color:#7a7a9a;font-size:13px;">Max Drawdown</span><span style="color:#e8e6ff;font-size:13px;font-weight:600;">8% ($400)</span></div>
      </div>
      <div style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.2);border-radius:10px;padding:16px;margin-bottom:24px;">
        <p style="font-size:13px;color:#c9a84c;margin:0;line-height:1.6;">💰 Trade freely — take profits whenever you like and request a payout from your dashboard at any time. Payouts are processed every Saturday in USDT TRC20.</p>
      </div>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="https://fortiqfunded.com/terminal.html" style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#e8c96a);color:#000;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:700;font-size:14px;">Start Trading Now →</a>
      </div>
      <p style="font-size:13px;color:#7a7a9a;line-height:1.7;margin:0;">Questions? Contact us at <a href="mailto:support@fortiqfunded.com" style="color:#a78bfa;">support@fortiqfunded.com</a></p>
    </div>`);
}

async function checkPendingPayments() {
  console.log('Checking pending payments...');
  const { data: payments } = await supabase.from('payments').select('*').eq('status', 'pending');
  if (!payments || payments.length === 0) return;

  for (const payment of payments) {
    try {
      let amount = 0;
      let confirmations = 0;
      let found = false;

      try {
        const res = await fetch('https://api.trongrid.io/v1/transactions/' + payment.tx_hash, {
          headers: { 'TRON-PRO-API-KEY': TRONGRID_KEY }
        });
        const data = await res.json();
        if (data.data && data.data.length > 0) {
          const tx = data.data[0];
          confirmations = tx.confirmations || 0;
          if (tx.trc20_transfers && tx.trc20_transfers.length > 0) {
            amount = parseInt(tx.trc20_transfers[0].amount_str || '0') / 1000000;
            if (amount > 0) {
              found = true;
              console.log('Method 1 found TX:', payment.tx_hash, '| Amount:', amount, '| Confirmations:', confirmations);
            }
          }
        }
      } catch (e) { console.log('Method 1 error:', e.message); }

      if (!found || amount === 0) {
        try {
          const res2 = await fetch('https://api.trongrid.io/v1/transactions/' + payment.tx_hash + '/events', {
            headers: { 'TRON-PRO-API-KEY': TRONGRID_KEY }
          });
          const data2 = await res2.json();
          if (data2.data && data2.data.length > 0) {
            for (const event of data2.data) {
              if (event.result && event.result.value) {
                const val = parseInt(event.result.value) / 1000000;
                if (val > 0) {
                  amount = val;
                  confirmations = confirmations || 999;
                  found = true;
                  console.log('Method 2 found TX:', payment.tx_hash, '| Amount:', amount);
                  break;
                }
              }
            }
          }
        } catch (e) { console.log('Method 2 error:', e.message); }
      }

      if (!found || amount === 0) {
        try {
          const res3 = await fetch('https://apilist.tronscanapi.com/api/transaction-info?hash=' + payment.tx_hash, {
            headers: { 'TRON-PRO-API-KEY': TRONGRID_KEY }
          });
          const data3 = await res3.json();
          if (data3 && data3.trc20TransferInfo && data3.trc20TransferInfo.length > 0) {
            const transfer = data3.trc20TransferInfo[0];
            const rawAmount = transfer.amount_str || transfer.amount || '0';
            amount = parseInt(rawAmount) / 1000000;
            confirmations = data3.confirmations || 999;
            if (amount > 0) {
              found = true;
              console.log('Method 3 found TX:', payment.tx_hash, '| Amount:', amount);
            }
          }
        } catch (e) { console.log('Method 3 error:', e.message); }
      }

      if (!found || amount === 0) {
        try {
          const res4 = await fetch('https://api.trongrid.io/v1/contracts/TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t/transactions?limit=10&only_confirmed=true', {
            headers: { 'TRON-PRO-API-KEY': TRONGRID_KEY }
          });
          const data4 = await res4.json();
          if (data4.data) {
            const match = data4.data.find(function(tx) { return tx.transaction_id === payment.tx_hash; });
            if (match) {
              amount = parseInt(match.token_info && match.value ? match.value : '0') / 1000000;
              confirmations = 999;
              if (amount > 0) { found = true; console.log('Method 4 found TX:', payment.tx_hash); }
            }
          }
        } catch (e) { console.log('Method 4 error:', e.message); }
      }

      if (!found || amount === 0) { console.log('TX not found yet:', payment.tx_hash); continue; }

      console.log('TX verified:', payment.tx_hash, '| Amount:', amount, '| Confirmations:', confirmations);
      await supabase.from('payments').update({ confirmations, amount }).eq('id', payment.id);

      if (amount < 148) {
        console.log('Amount too low:', amount);
        await supabase.from('payments').update({ status: 'insufficient' }).eq('id', payment.id);
        await sendEmail('Payment Below Minimum — Fortiq Funded', 'TX Hash: ' + payment.tx_hash + '\nAmount: $' + amount + ' USDT\nUser ID: ' + payment.user_id);
        continue;
      }

      if (confirmations >= 19 || confirmations === 999) {
        await activateChallenge(payment);
      } else {
        console.log('TX found but not enough confirmations yet:', confirmations);
      }

    } catch (err) {
      console.log('Error checking TX:', payment.tx_hash, err.message);
    }
  }
}

async function activateChallenge(payment) {
  const { data: profile } = await supabase.from('profiles').select('user_id, full_name, email').eq('id', payment.user_id).single();
  if (!profile) return;
  const userNum = profile.user_id.replace('USR-', '');
  const accId = 'ACC-' + userNum;

  const { data: existing } = await supabase.from('accounts').select('account_id, status').eq('account_id', accId).single();
  if (existing && existing.status === 'active') {
    console.log('Account already active:', accId);
    await supabase.from('payments').update({ status: 'confirmed', account_id: accId }).eq('id', payment.id);
    return;
  }

  await supabase.from('accounts').upsert({
    user_id: payment.user_id, account_id: accId, account_type: 'challenge',
    status: 'active', stage: 1, balance: 5000, profit: 0,
    daily_loss: 0, max_drawdown: 0, active_days: 0
  }, { onConflict: 'account_id' });

  await supabase.from('payments').update({ status: 'confirmed', account_id: accId }).eq('id', payment.id);
  console.log('Challenge activated:', accId);

  await sendEmail('New Challenge Activated — Fortiq Funded', 'Trader: ' + profile.full_name + '\nEmail: ' + profile.email + '\nAccount ID: ' + accId + '\nAmount: $' + payment.amount + ' USDT');
  // Auto-approve affiliate commission if this trader was referred
  try {
    const { data: affiliate } = await supabase.from('affiliates').select('*').eq('referred_id', profile.user_id).eq('status', 'pending').single();
    if (affiliate) {
      await supabase.from('affiliates').update({ status: 'approved' }).eq('id', affiliate.id);
      console.log('Affiliate commission approved for referrer:', affiliate.referrer_id);
    }
  } catch (e) {
    console.log('Affiliate approval check:', e.message);
  }
  await sendTraderEmail(profile.email, '🚀 Your Fortiq Funded Challenge is Now Active — ' + accId, challengeActivatedEmail(profile.full_name || 'Trader', accId, parseFloat(payment.amount).toFixed(2)));
}

async function checkPendingLimitOrders() {
  try {
    const { data: orders } = await supabase.from('orders').select('*').eq('status', 'pending');
    console.log('Checking limit orders... found:', orders ? orders.length : 0);
    if (!orders || orders.length === 0) return;
    for (const order of orders) {
      try {
        let currentPrice = null;

        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3000);
          const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=' + order.symbol, { signal: controller.signal });
          clearTimeout(timeout);
          const data = await res.json();
          if (data.price) currentPrice = parseFloat(data.price);
        } catch(e) { console.log('Binance price error for limit order:', e.message); }

        if (!currentPrice) {
          try {
            const res2 = await fetch('https://fapi.binance.com/fapi/v1/ticker/price?symbol=' + order.symbol);
            const data2 = await res2.json();
            if (data2.price) currentPrice = parseFloat(data2.price);
          } catch(e) { console.log('Binance futures price error:', e.message); }
        }

        if (!currentPrice) {
          try {
            const krakenMap = {'BTCUSDT':'XBTUSD','ETHUSDT':'ETHUSD','SOLUSDT':'SOLUSD','XRPUSDT':'XRPUSD','ADAUSDT':'ADAUSD','DOGEUSDT':'XDGUSD','DOTUSDT':'DOTUSD','LINKUSDT':'LINKUSD'};
            const krakenPair = krakenMap[order.symbol];
            if (krakenPair) {
              const kr = await fetch('https://api.kraken.com/0/public/Ticker?pair=' + krakenPair);
              const kd = await kr.json();
              const pairs = Object.values(kd.result || {});
              if (pairs.length > 0) currentPrice = parseFloat(pairs[0].c[0]);
            }
          } catch(e) { console.log('Kraken price error for limit order:', e.message); }
        }

        if (!currentPrice) continue;

        const limitPrice = parseFloat(order.limit_price);
        let shouldExecute = false;
        if (order.direction === 'long' && currentPrice <= limitPrice) shouldExecute = true;
        if (order.direction === 'short' && currentPrice >= limitPrice) shouldExecute = true;
        if (!shouldExecute) continue;

        const { data: claimed, error: claimErr } = await supabase.rpc('mark_order_executed', { order_id: order.id });
        if (claimErr || !claimed) {
          console.log('Order already claimed, skipping:', order.id);
          continue;
        }

        const { data: account } = await supabase.from('accounts').select('*').eq('account_id', order.account_id).single();
        if (!account || account.status !== 'active') continue;
        if (parseFloat(order.amount) > parseFloat(account.balance)) continue;

        const pos = {
          user_id: order.user_id, account_id: order.account_id, symbol: order.symbol,
          direction: order.direction, amount: parseFloat(order.amount), leverage: parseFloat(order.leverage),
          entry_price: limitPrice, size: parseFloat(order.amount) * parseFloat(order.leverage),
          status: 'open', opened_at: new Date().toISOString()
        };
        if (order.take_profit) pos.take_profit = parseFloat(order.take_profit);
        if (order.stop_loss) pos.stop_loss = parseFloat(order.stop_loss);
        await supabase.from('positions').insert(pos);
        const newBalance = parseFloat((parseFloat(account.balance) - parseFloat(order.amount)).toFixed(2));
        await supabase.from('accounts').update({ balance: newBalance, status: 'active' }).eq('account_id', order.account_id);
        console.log('Limit order executed:', order.id, order.symbol, order.direction, '@', limitPrice, '| New balance:', newBalance);
      } catch (err) {
        console.log('Error processing limit order:', order.id, err.message);
      }
    }
  } catch (err) {
    console.log('checkPendingLimitOrders error:', err.message);
  }
}

app.post('/open-position', async (req, res) => {
  const { user_id, account_id, symbol, direction, amount, leverage, entry_price, size, take_profit, stop_loss } = req.body;
  if (!user_id || !account_id || !symbol || !direction || !amount || !entry_price) return res.status(400).json({ error: 'Missing fields' });
  try {
    const { data: account, error: accErr } = await supabase
      .from('accounts').select('*').eq('account_id', account_id).eq('status', 'active').single();
    if (accErr || !account) return res.status(404).json({ error: 'Account not found or not active' });
    if (account.user_id !== user_id) return res.status(403).json({ error: 'Unauthorised' });

    const amt = parseFloat(amount);
    const currentBalance = parseFloat(account.balance);
    if (amt > currentBalance) return res.status(400).json({ error: 'Amount exceeds available balance' });
    if (parseFloat(account.daily_loss || 0) >= 5) return res.status(400).json({ error: 'Daily loss limit reached' });
    if (parseFloat(account.max_drawdown || 0) >= 8) return res.status(400).json({ error: 'Max drawdown reached' });

    const pos = {
      user_id, account_id, symbol, direction,
      amount: amt, leverage: parseFloat(leverage) || 1,
      entry_price: parseFloat(entry_price),
      size: parseFloat(size) || amt * (parseFloat(leverage) || 1),
      status: 'open', opened_at: new Date().toISOString()
    };
    if (take_profit) pos.take_profit = parseFloat(take_profit);
    if (stop_loss) pos.stop_loss = parseFloat(stop_loss);

    const { data: newPos, error: posErr } = await supabase.from('positions').insert(pos).select().single();
    if (posErr) return res.status(500).json({ error: posErr.message });

    const newBalance = parseFloat((currentBalance - amt).toFixed(2));
    await supabase.from('accounts').update({ balance: newBalance, status: 'active' }).eq('account_id', account_id);
    console.log('Position opened:', newPos.id, '| Symbol:', symbol, '| Amount:', amt, '| New balance:', newBalance);
    res.json({ success: true, position: newPos, newBalance });
  } catch (err) {
    console.log('open-position error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/close-position', async (req, res) => {
  const { position_id, account_id, user_id } = req.body;
  if (!position_id || !account_id || !user_id) return res.status(400).json({ error: 'Missing fields' });
  try {
    const { data: position, error: posErr } = await supabase
      .from('positions').select('*').eq('id', position_id).eq('account_id', account_id).eq('user_id', user_id).eq('status', 'open').single();
    if (posErr || !position) return res.status(404).json({ error: 'Position not found or already closed' });
    const { data: account, error: accErr } = await supabase
      .from('accounts').select('*').eq('account_id', account_id).eq('status', 'active').single();
    if (accErr || !account) return res.status(404).json({ error: 'Account not found or not active' });
    if (account.user_id !== user_id) return res.status(403).json({ error: 'Unauthorised' });

    let exitPrice = null;

    try {
      const priceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=' + position.symbol);
      const priceData = await priceRes.json();
      if (priceData.price) exitPrice = parseFloat(priceData.price);
    } catch (e) { console.log('Binance price fetch failed:', e.message); }

    if (!exitPrice || isNaN(exitPrice)) {
      try {
        const priceRes2 = await fetch('https://fapi.binance.com/fapi/v1/ticker/price?symbol=' + position.symbol);
        const priceData2 = await priceRes2.json();
        if (priceData2.price) exitPrice = parseFloat(priceData2.price);
      } catch (e) { console.log('Binance futures price fetch failed:', e.message); }
    }

    if (!exitPrice || isNaN(exitPrice)) {
      try {
        const coinMap = {'BTCUSDT':'bitcoin','ETHUSDT':'ethereum','BNBUSDT':'binancecoin','SOLUSDT':'solana','XRPUSDT':'ripple','ADAUSDT':'cardano','DOGEUSDT':'dogecoin','AVAXUSDT':'avalanche-2','DOTUSDT':'polkadot','LINKUSDT':'chainlink'};
        const coinId = coinMap[position.symbol] || 'bitcoin';
        const cgRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=' + coinId + '&vs_currencies=usd');
        const cgData = await cgRes.json();
        if (cgData[coinId] && cgData[coinId].usd) exitPrice = parseFloat(cgData[coinId].usd);
      } catch (e) { console.log('CoinGecko price fetch failed:', e.message); }
    }

    if (!exitPrice || isNaN(exitPrice)) {
      try {
        const krakenMap = {'BTCUSDT':'XBTUSD','ETHUSDT':'ETHUSD','SOLUSDT':'SOLUSD','XRPUSDT':'XRPUSD','ADAUSDT':'ADAUSD','DOGEUSDT':'XDGUSD','DOTUSDT':'DOTUSD','LINKUSDT':'LINKUSD'};
        const krakenPair = krakenMap[position.symbol];
        if (krakenPair) {
          const krakenRes = await fetch('https://api.kraken.com/0/public/Ticker?pair=' + krakenPair);
          const krakenData = await krakenRes.json();
          const pairs = Object.values(krakenData.result || {});
          if (pairs.length > 0) exitPrice = parseFloat(pairs[0].c[0]);
        }
      } catch (e) { console.log('Kraken price fetch failed:', e.message); }
    }

    if (!exitPrice || isNaN(exitPrice)) return res.status(500).json({ error: 'Could not fetch current price from any source' });

    const entryPrice = parseFloat(position.entry_price);
    const amount = parseFloat(position.amount);
    const size = parseFloat(position.size);
    let priceDiff = position.direction === 'long' ? (exitPrice - entryPrice) / entryPrice : (entryPrice - exitPrice) / entryPrice;
    let rawPnl = priceDiff * size;
    if (rawPnl < -amount) rawPnl = -amount;
    const pnl = parseFloat(rawPnl.toFixed(2));
    const returnedMargin = amount + pnl;
    const safeReturnedMargin = Math.max(0, returnedMargin);
    const currentBalance = parseFloat(account.balance);
    const currentProfit = parseFloat(account.profit || 0);
    const currentDailyLoss = parseFloat(account.daily_loss || 0);
    const currentMaxDrawdown = parseFloat(account.max_drawdown || 0);
    const newBalance = parseFloat((currentBalance + safeReturnedMargin).toFixed(2));
    const newProfit = parseFloat((currentProfit + pnl).toFixed(2));
    let newDailyLoss = currentDailyLoss;
    if (pnl < 0) newDailyLoss = parseFloat((currentDailyLoss + (Math.abs(pnl) / 5000) * 100).toFixed(4));
    const drawdownFromStart = ((5000 - newBalance) / 5000) * 100;
    const newMaxDrawdown = parseFloat(Math.max(currentMaxDrawdown + (pnl < 0 ? (Math.abs(pnl) / 5000) * 100 : 0), drawdownFromStart).toFixed(4));
    const dailyLimitBreached = newDailyLoss >= 5;
    const drawdownBreached = newMaxDrawdown >= 8;
    const ruleBreached = dailyLimitBreached || drawdownBreached;
    const stage = account.stage || 1;
    const activeDays = account.active_days || 0;
    const stage1Passed = stage === 1 && newProfit >= 400 && activeDays >= 5 && !ruleBreached;
    const stage2CapHit = stage === 2 && newProfit >= 5000;

    await supabase.from('positions').update({ status: 'closed', exit_price: exitPrice, pnl, closed_at: new Date().toISOString() }).eq('id', position_id);

    if (ruleBreached) {
      await supabase.from('accounts').update({ balance: newBalance, profit: newProfit, daily_loss: newDailyLoss, max_drawdown: newMaxDrawdown, status: 'failed' }).eq('account_id', account_id);
      const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user_id).single();
      if (profile) {
        const reason = dailyLimitBreached ? 'Daily loss limit of 5% exceeded' : 'Maximum drawdown of 8% exceeded';
        await sendTraderEmail(profile.email, '❌ Your Fortiq Funded Account Has Failed — ' + account_id, challengeFailedEmail(profile.full_name || 'Trader', account_id, reason));
        await sendEmail('Account Auto-Failed — ' + account_id, 'Account: ' + account_id + '\nTrader: ' + profile.full_name + '\nReason: ' + reason);
      }
      console.log('Account failed after position close:', account_id);
      return res.json({ success: true, pnl, exitPrice, newBalance, newProfit, newDailyLoss, newMaxDrawdown, accountFailed: true, reason: dailyLimitBreached ? 'daily_loss' : 'drawdown' });
    }

    await supabase.from('accounts').update({ balance: newBalance, profit: newProfit, daily_loss: newDailyLoss, max_drawdown: newMaxDrawdown }).eq('account_id', account_id);
    console.log('Position closed:', position_id, '| P&L:', pnl, '| Exit:', exitPrice);

    if (stage1Passed) {
      console.log('Stage 1 passed! Creating Stage 2 for:', account_id);
      try {
        const { data: profile } = await supabase.from('profiles').select('user_id, full_name, email').eq('id', user_id).single();
        if (profile) {
          const userNum = profile.user_id.replace('USR-', '');
          const stage2AccId = 'FND-' + userNum;
          const { data: existing } = await supabase.from('accounts').select('account_id').eq('account_id', stage2AccId).single();
          if (!existing) {
            await supabase.from('accounts').insert({ user_id, account_id: stage2AccId, account_type: 'funded', status: 'active', stage: 2, balance: 5000, profit: 0, daily_loss: 0, max_drawdown: 0, active_days: 0 });
            await supabase.from('accounts').update({ status: 'funded', stage2_account_id: stage2AccId }).eq('account_id', account_id);
            await sendTraderEmail(profile.email, '🏆 You Are Now a Funded Trader — ' + stage2AccId, stage2ActivatedEmail(profile.full_name || 'Trader', stage2AccId));
            await sendEmail('Stage 2 Auto-Created — ' + stage2AccId, 'Trader: ' + profile.full_name + '\nEmail: ' + profile.email + '\nStage 1: ' + account_id + '\nStage 2: ' + stage2AccId);
          }
          return res.json({ success: true, pnl, exitPrice, newBalance, newProfit, newDailyLoss, newMaxDrawdown, stage1Passed: true, stage2AccountId: stage2AccId });
        }
      } catch (s2err) { console.log('Stage 2 creation error:', s2err.message); }
    }

    if (stage2CapHit) {
      console.log('Stage 2 profit cap hit for:', account_id);
      return res.json({ success: true, pnl, exitPrice, newBalance, newProfit, newDailyLoss, newMaxDrawdown, stage2CapHit: true });
    }

    res.json({ success: true, pnl, exitPrice, newBalance, newProfit, newDailyLoss, newMaxDrawdown, accountFailed: false, stage1Passed: false });
  } catch (err) {
    console.log('close-position error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/create-stage2', async (req, res) => {
  const { stage1_account_id, user_id } = req.body;
  if (!stage1_account_id || !user_id) return res.status(400).json({ error: 'Missing fields' });
  try {
    const { data: profile } = await supabase.from('profiles').select('user_id, full_name, email').eq('id', user_id).single();
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    const userNum = profile.user_id.replace('USR-', '');
    const stage2AccId = 'FND-' + userNum;
    const { data: existing } = await supabase.from('accounts').select('account_id').eq('account_id', stage2AccId).single();
    if (existing) return res.json({ success: true, stage2_account_id: stage2AccId, message: 'Already exists' });
    await supabase.from('accounts').insert({ user_id, account_id: stage2AccId, account_type: 'funded', status: 'active', stage: 2, balance: 5000, profit: 0, daily_loss: 0, max_drawdown: 0, active_days: 0 });
    await supabase.from('accounts').update({ status: 'funded', stage2_account_id: stage2AccId }).eq('account_id', stage1_account_id);
    await sendTraderEmail(profile.email, '🏆 You Are Now a Funded Trader — ' + stage2AccId, stage2ActivatedEmail(profile.full_name || 'Trader', stage2AccId));
    await sendEmail('Stage 2 Funded Account Created — ' + stage2AccId, 'Trader: ' + profile.full_name + '\nEmail: ' + profile.email + '\nStage 1: ' + stage1_account_id + '\nStage 2: ' + stage2AccId);
    console.log('Stage 2 account created:', stage2AccId);
    res.json({ success: true, stage2_account_id: stage2AccId });
  } catch (err) {
    console.log('create-stage2 error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/notify-status', async (req, res) => {
  const { account_id, status, reason } = req.body;
  if (!account_id || !status) return res.status(400).json({ error: 'Missing fields' });
  try {
    const { data: account } = await supabase.from('accounts').select('user_id, profit').eq('account_id', account_id).single();
    if (!account) return res.status(404).json({ error: 'Account not found' });
    const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', account.user_id).single();
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    if (status === 'failed') {
      await sendTraderEmail(profile.email, '❌ Your Fortiq Funded Account Has Failed — ' + account_id, challengeFailedEmail(profile.full_name || 'Trader', account_id, reason || ''));
      await sendEmail('Account Failed — ' + account_id, 'Account ' + account_id + ' failed.\nTrader: ' + profile.full_name + '\nEmail: ' + profile.email + (reason ? '\nReason: ' + reason : ''));
    }
    res.json({ success: true });
  } catch (err) {
    console.log('Notify status error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/admin-login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ success: false, error: 'Missing password' });
  if (password === process.env.ADMIN_PASSWORD) return res.json({ success: true });
  return res.status(401).json({ success: false, error: 'Incorrect password' });
});

app.post('/notify-payout', async (req, res) => {
  const { account_id, payout_amount, wallet_address } = req.body;
  if (!account_id || !payout_amount || !wallet_address) return res.status(400).json({ error: 'Missing required fields' });
  try {
    const { data: account } = await supabase.from('accounts').select('user_id, profit').eq('account_id', account_id).single();
    if (!account) return res.status(404).json({ error: 'Account not found' });
    const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', account.user_id).single();
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    const traderName = profile.full_name || 'Trader';
    const traderEmail = profile.email;
    const totalProfit = parseFloat(account.profit || 0).toFixed(2);
    const traderHtml = emailWrapper(`
    <div style="background:linear-gradient(135deg,#0f1829,#162038);padding:32px;text-align:center;border-bottom:1px solid rgba(201,168,76,0.2);">
      <div style="font-size:28px;margin-bottom:8px;">🎉</div>
      <h1 style="font-family:Georgia,serif;font-size:22px;font-weight:700;margin:0;color:#c9a84c;">Payout Sent!</h1>
      <p style="color:#7a7a9a;font-size:14px;margin:8px 0 0;">Fortiq Funded — Profit Share Payment</p>
    </div>
    <div style="padding:32px;">
      <p style="font-size:15px;color:#e8e6ff;margin:0 0 20px;">Hi ${traderName},</p>
      <p style="font-size:14px;color:#7a7a9a;line-height:1.7;margin:0 0 24px;">Your 80% profit share has been sent to your wallet.</p>
      <div style="background:#0f1829;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Account ID</span><span style="color:#a78bfa;font-family:monospace;font-size:13px;">${account_id}</span></div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Total Profit</span><span style="color:#00d68f;font-family:monospace;font-size:13px;">$${totalProfit} USDT</span></div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Your Share (80%)</span><span style="color:#c9a84c;font-family:monospace;font-size:16px;font-weight:700;">$${payout_amount} USDT</span></div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Payment Method</span><span style="color:#e8e6ff;font-size:13px;">USDT TRC20</span></div>
        <div style="padding:10px 0;"><span style="color:#7a7a9a;font-size:13px;display:block;margin-bottom:4px;">Wallet Address</span><span style="color:#e8e6ff;font-family:monospace;font-size:11px;word-break:break-all;">${wallet_address}</span></div>
      </div>
      <div style="text-align:center;margin-bottom:24px;">
        <a href="https://fortiqfunded.com/checkout.html" style="display:inline-block;background:linear-gradient(135deg,#6c3de8,#1e5fff);color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:600;font-size:14px;">Start New Challenge →</a>
      </div>
    </div>`);
    await sendTraderEmail(traderEmail, '🎉 Your Fortiq Funded Payout Has Been Sent — $' + payout_amount + ' USDT', traderHtml);
    await sendEmail('Payout Processed — ' + account_id, 'Account: ' + account_id + '\nTrader: ' + traderName + '\nEmail: ' + traderEmail + '\nAmount: $' + payout_amount + ' USDT\nWallet: ' + wallet_address + '\nTotal Profit: $' + totalProfit + ' USDT');
    res.json({ success: true });
  } catch (err) {
    console.log('Payout notification error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/leaderboard', async (req, res) => {
  try {
    const { data: accounts } = await supabase.from('accounts').select('account_id, user_id, profit, active_days, status, payout_amount').in('status', ['funded', 'closed']).eq('paid_out', true).order('profit', { ascending: false }).limit(20);
    if (!accounts || accounts.length === 0) return res.json({ leaderboard: [] });
    const leaderboard = await Promise.all(accounts.map(async (acc, index) => {
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', acc.user_id).single();
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
app.post('/verify-recaptcha', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false });
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'secret=' + process.env.RECAPTCHA_SECRET_KEY + '&response=' + token
    });
    const data = await response.json();
    res.json({ success: data.success });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});
app.post('/track-referral', async (req, res) => {
  const { referrer_code, referred_user_id } = req.body;
  console.log('Track referral called:', referrer_code, '->', referred_user_id);
  if (!referrer_code || !referred_user_id) return res.status(400).json({ error: 'Missing fields' });
  try {
    let referrer = null;
    const { data: r1 } = await supabase.from('profiles').select('user_id').eq('user_id', referrer_code).single();
    if (r1) { referrer = r1; }
    if (!referrer) {
      const { data: r2 } = await supabase.from('profiles').select('user_id').eq('referral_code', referrer_code).single();
      if (r2) referrer = r2;
    }
    if (!referrer) return res.status(404).json({ error: 'Referrer not found' });
    console.log('Referrer found:', referrer.user_id);
    const { data: existing } = await supabase.from('affiliates').select('id').eq('referrer_id', referrer.user_id).eq('referred_id', referred_user_id).single();
    console.log('Existing referral check:', existing ? 'found' : 'not found');
    if (existing) return res.json({ success: true, message: 'Referral already tracked' });
    const { error } = await supabase.from('affiliates').insert({ referrer_id: referrer.user_id, referred_id: referred_user_id, status: 'pending', commission: 50, paid: false });
    console.log('Insert result:', error ? error.message : 'success');
    if (error) return res.status(500).json({ error: error.message });
    console.log('Referral tracked:', referrer.user_id, '->', referred_user_id);
    res.json({ success: true });
  } catch (err) {
    console.log('Track referral error:', err.message);
    res.status(500).json({ error: err.message });
  }
});
app.post('/submit-payout-wallet', async (req, res) => {
  const { account_id, wallet, user_id } = req.body;
  if (!account_id || !wallet || !user_id) return res.status(400).json({ error: 'Missing fields' });
  try {
    const { data: account } = await supabase.from('accounts').select('user_id').eq('account_id', account_id).single();
    if (!account || account.user_id !== user_id) return res.status(403).json({ error: 'Unauthorised' });
    await supabase.from('accounts').update({ payout_wallet: wallet }).eq('account_id', account_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/submit-affiliate-wallet', async (req, res) => {
  const { user_id, wallet } = req.body;
  if (!user_id || !wallet) return res.status(400).json({ error: 'Missing fields' });
  try {
    await supabase.from('profiles').update({ affiliate_wallet: wallet }).eq('id', user_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post('/check-payment', async (req, res) => {
  await checkPendingPayments();
  res.json({ message: 'Check triggered' });
});

cron.schedule('*/2 * * * *', checkPendingPayments);
cron.schedule('*/30 * * * * *', checkPendingLimitOrders);
cron.schedule('0 0 * * *', async function() {
  console.log('Resetting daily loss...');
  try {
    await supabase.from('accounts').update({ daily_loss: 0 }).in('status', ['to_be_active', 'active', 'funded']);
    console.log('Daily loss reset complete');
  } catch (err) {
    console.log('Daily loss reset failed:', err.message);
  }
});

app.get('/', (req, res) => res.send('Fortiq Funded Backend Running'));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port', PORT));
