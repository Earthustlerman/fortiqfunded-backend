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

// ── IMPROVED PAYMENT VERIFICATION WITH MULTIPLE API FALLBACKS ──
async function checkPendingPayments() {
  console.log('Checking pending payments...');
  const { data: payments } = await supabase.from('payments').select('*').eq('status', 'pending');
  if (!payments || payments.length === 0) return;

  for (const payment of payments) {
    try {
      let amount = 0;
      let confirmations = 0;
      let found = false;

      // ── Method 1: TronGrid v1/transactions ──
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
              console.log('Method 1 (TronGrid v1) found TX:', payment.tx_hash, '| Amount:', amount, '| Confirmations:', confirmations);
            }
          }
        }
      } catch (e) {
        console.log('Method 1 TronGrid error:', e.message);
      }

      // ── Method 2: TronGrid events endpoint ──
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
                  console.log('Method 2 (TronGrid events) found TX:', payment.tx_hash, '| Amount:', amount);
                  break;
                }
              }
            }
          }
        } catch (e) {
          console.log('Method 2 TronGrid events error:', e.message);
        }
      }

      // ── Method 3: TronScan API fallback ──
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
              console.log('Method 3 (TronScan) found TX:', payment.tx_hash, '| Amount:', amount, '| Confirmations:', confirmations);
            }
          }
        } catch (e) {
          console.log('Method 3 TronScan error:', e.message);
        }
      }

      // ── Method 4: TronGrid wallet/transactions search ──
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
              if (amount > 0) {
                found = true;
                console.log('Method 4 (TronGrid contract search) found TX:', payment.tx_hash);
              }
            }
          }
        } catch (e) {
          console.log('Method 4 error:', e.message);
        }
      }

      if (!found || amount === 0) {
        console.log('TX not found yet by any method:', payment.tx_hash);
        continue;
      }

      console.log('TX verified:', payment.tx_hash, '| Amount:', amount, '| Confirmations:', confirmations);
      await supabase.from('payments').update({ confirmations, amount }).eq('id', payment.id);

      if (amount < 148) {
        console.log('Amount too low:', amount);
        await supabase.from('payments').update({ status: 'insufficient' }).eq('id', payment.id);
        await sendEmail('Payment Below Minimum — Fortiq Funded', 'TX Hash: ' + payment.tx_hash + '\nAmount: $' + amount + ' USDT\nUser ID: ' + payment.user_id);
        continue;
      }

      // Treat confirmations >= 19 OR 999 (from fallback methods) as confirmed
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

  // Check if already activated to prevent duplicate activation
  const { data: existing } = await supabase.from('accounts').select('account_id, status').eq('account_id', accId).single();
  if (existing && existing.status === 'active') {
    console.log('Account already active:', accId);
    await supabase.from('payments').update({ status: 'confirmed', account_id: accId }).eq('id', payment.id);
    return;
  }

  await supabase.from('accounts').upsert({
    user_id: profile.user_id,
    account_id: accId,
    account_type: 'challenge',
    status: 'active',
    stage: 1,
    balance: 5000,
    profit: 0,
    daily_loss: 0,
    max_drawdown: 0,
    active_days: 0
  }, { onConflict: 'account_id' });

  await supabase.from('payments').update({ status: 'confirmed', account_id: accId }).eq('id', payment.id);
  console.log('Challenge activated:', accId);

  await sendEmail('New Challenge Activated — Fortiq Funded', 'Trader: ' + profile.full_name + '\nEmail: ' + profile.email + '\nAccount ID: ' + accId + '\nAmount: $' + payment.amount + ' USDT');
  await sendTraderEmail(profile.email, '🚀 Your Fortiq Funded Challenge is Now Active — ' + accId, challengeActivatedEmail(profile.full_name || 'Trader', accId, parseFloat(payment.amount).toFixed(2)));
}

async function checkPendingLimitOrders() {
  try {
    const { data: orders } = await supabase.from('orders').select('*').eq('status', 'pending');
    if (!orders || orders.length === 0) return;
    for (const order of orders) {
      try {
        const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=' + order.symbol);
        const data = await res.json();
        const currentPrice = parseFloat(data.price);
        if (!currentPrice) continue;
        const limitPrice = parseFloat(order.limit_price);
        let shouldExecute = false;
        if (order.direction === 'long' && currentPrice <= limitPrice) shouldExecute = true;
        if (order.direction === 'short' && currentPrice >= limitPrice) shouldExecute = true;
        if (!shouldExecute) continue;
        const { data: account } = await supabase.from('accounts').select('*').eq('account_id', order.account_id).single();
        if (!account || account.status !== 'active') { await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id); continue; }
        if (parseFloat(order.amount) > parseFloat(account.balance)) { await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id); continue; }
        const pos = {
          user_id: order.user_id, account_id: order.account_id, symbol: order.symbol,
          direction: order.direction, amount: order.amount, leverage: order.leverage,
          entry_price: limitPrice, size: parseFloat(order.amount) * parseFloat(order.leverage),
          status: 'open', opened_at: new Date().toISOString()
        };
        if (order.take_profit) pos.take_profit = order.take_profit;
        if (order.stop_loss) pos.stop_loss = order.stop_loss;
        await supabase.from('positions').insert(pos);
        const newBalance = parseFloat(account.balance) - parseFloat(order.amount);
        await supabase.from('accounts').update({ balance: newBalance, status: 'active' }).eq('account_id', order.account_id);
        await supabase.from('orders').update({ status: 'executed', executed_at: new Date().toISOString() }).eq('id', order.id);
        console.log('Limit order executed:', order.id, order.symbol, order.direction, '@', limitPrice);
      } catch (err) {
        console.log('Error processing limit order:', order.id, err.message);
      }
    }
  } catch (err) {
    console.log('checkPendingLimitOrders error:', err.message);
  }
}

// ── CLOSE POSITION (SECURE SERVER-SIDE P&L CALCULATION) ──
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
    const priceRes = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=' + position.symbol);
    const priceData = await priceRes.json();
    const exitPrice = parseFloat(priceData.price);
    if (!exitPrice || isNaN(exitPrice)) return res.status(500).json({ error: 'Could not fetch current price' });
    const entryPrice = parseFloat(position.entry_price);
    const amount = parseFloat(position.amount);
    const size = parseFloat(position.size);
    let priceDiff = 0;
    if (position.direction === 'long') {
      priceDiff = (exitPrice - entryPrice) / entryPrice;
    } else {
      priceDiff = (entryPrice - exitPrice) / entryPrice;
    }
    let rawPnl = priceDiff * size;
    const maxLoss = -amount;
    if (rawPnl < maxLoss) rawPnl = maxLoss;
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
    if (pnl < 0) {
      const lossPercent = (Math.abs(pnl) / 5000) * 100;
      newDailyLoss = parseFloat((currentDailyLoss + lossPercent).toFixed(4));
    }
    const drawdownFromStart = ((5000 - newBalance) / 5000) * 100;
    const newMaxDrawdown = parseFloat(Math.max(currentMaxDrawdown, Math.max(0, drawdownFromStart)).toFixed(4));
    const dailyLimitBreached = newDailyLoss >= 5;
    const drawdownBreached = newMaxDrawdown >= 8;
    const ruleBreached = dailyLimitBreached || drawdownBreached;
    const stage = account.stage || 1;
    const activeDays = account.active_days || 0;
    const stage1Passed = stage === 1 && newProfit >= 400 && activeDays >= 5 && !ruleBreached;
    const stage2CapHit = stage === 2 && newProfit >= 5000;
    await supabase.from('positions').update({
      status: 'closed',
      exit_price: exitPrice,
      pnl: pnl,
      closed_at: new Date().toISOString()
    }).eq('id', position_id);
    if (ruleBreached) {
      await supabase.from('accounts').update({
        balance: newBalance, profit: newProfit, daily_loss: newDailyLoss,
        max_drawdown: newMaxDrawdown, status: 'failed'
      }).eq('account_id', account_id);
      const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', user_id).single();
      if (profile) {
        const reason = dailyLimitBreached ? 'Daily loss limit of 5% exceeded' : 'Maximum drawdown of 8% exceeded';
        await sendTraderEmail(profile.email, '❌ Your Fortiq Funded Account Has Failed — ' + account_id, challengeFailedEmail(profile.full_name || 'Trader', account_id, reason));
        await sendEmail('Account Auto-Failed — ' + account_id, 'Account: ' + account_id + '\nTrader: ' + profile.full_name + '\nReason: ' + reason);
      }
      console.log('Account failed after position close:', account_id);
      return res.json({ success: true, pnl, exitPrice, newBalance, newProfit, newDailyLoss, newMaxDrawdown, accountFailed: true, reason: dailyLimitBreached ? 'daily_loss' : 'drawdown' });
    }
    await supabase.from('accounts').update({
      balance: newBalance, profit: newProfit, daily_loss: newDailyLoss, max_drawdown: newMaxDrawdown
    }).eq('account_id', account_id);
    console.log('Position closed server-side:', position_id, '| P&L:', pnl, '| Exit:', exitPrice);
    if (stage1Passed) {
      console.log('Stage 1 passed! Creating Stage 2 for:', account_id);
      try {
        const { data: profile } = await supabase.from('profiles').select('user_id, full_name, email').eq('id', user_id).single();
        if (profile) {
          const userNum = profile.user_id.replace('USR-', '');
          const stage2AccId = 'FND-' + userNum;
          const { data: existing } = await supabase.from('accounts').select('account_id').eq('account_id', stage2AccId).single();
          if (!existing) {
            await supabase.from('accounts').insert({
              user_id: user_id, account_id: stage2AccId, account_type: 'funded',
              status: 'active', stage: 2, balance: 5000, profit: 0,
              daily_loss: 0, max_drawdown: 0, active_days: 0
            });
            await supabase.from('accounts').update({ status: 'funded', stage2_account_id: stage2AccId }).eq('account_id', account_id);
            await sendTraderEmail(profile.email, '🏆 You Are Now a Funded Trader — ' + stage2AccId, stage2ActivatedEmail(profile.full_name || 'Trader', stage2AccId));
            await sendEmail('Stage 2 Auto-Created — ' + stage2AccId, 'Trader: ' + profile.full_name + '\nEmail: ' + profile.email + '\nStage 1: ' + account_id + '\nStage 2: ' + stage2AccId);
          }
          return res.json({ success: true, pnl, exitPrice, newBalance, newProfit, newDailyLoss, newMaxDrawdown, stage1Passed: true, stage2AccountId: stage2AccId });
        }
      } catch (s2err) {
        console.log('Stage 2 creation error:', s2err.message);
      }
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

// ── CREATE STAGE 2 ACCOUNT ──
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
    await supabase.from('accounts').insert({
      user_id: user_id, account_id: stage2AccId, account_type: 'funded',
      status: 'active', stage: 2, balance: 5000, profit: 0,
      daily_loss: 0, max_drawdown: 0, active_days: 0
    });
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

// ── NOTIFY ACCOUNT STATUS CHANGE ──
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

// ── ADMIN LOGIN ──
app.post('/admin-login', (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ success: false, error: 'Missing password' });
  if (password === process.env.ADMIN_PASSWORD) return res.json({ success: true });
  return res.status(401).json({ success: false, error: 'Incorrect password' });
});

// ── PAYOUT NOTIFICATION ──
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

// ── LEADERBOARD ──
app.get('/leaderboard', async (req, res) => {
  try {
    const { data: accounts } = await supabase.from('accounts').select('account_id, user_id, profit, active_days, status, payout_amount').eq('status', 'funded').eq('paid_out', true).order('profit', { ascending: false }).limit(20);
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

// ── REFERRAL TRACKING ──
app.post('/track-referral', async (req, res) => {
  const { referrer_code, referred_user_id } = req.body;
  if (!referrer_code || !referred_user_id) return res.status(400).json({ error: 'Missing fields' });
  try {
    const { data: referrer } = await supabase.from('profiles').select('user_id').or('user_id.eq.' + referrer_code + ',referral_code.eq.' + referrer_code).single();
    if (!referrer) return res.status(404).json({ error: 'Referrer not found' });
    const { data: existing } = await supabase.from('affiliates').select('id').eq('referrer_id', referrer.user_id).eq('referred_id', referred_user_id).single();
    if (existing) return res.json({ success: true, message: 'Referral already tracked' });
    const { error } = await supabase.from('affiliates').insert({ referrer_id: referrer.user_id, referred_id: referred_user_id, status: 'pending', commission: 50, paid: false });
    if (error) return res.status(500).json({ error: error.message });
    console.log('Referral tracked:', referrer.user_id, '->', referred_user_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── MANUAL PAYMENT CHECK TRIGGER ──
app.post('/check-payment', async (req, res) => {
  await checkPendingPayments();
  res.json({ message: 'Check triggered' });
});

// ── CRON JOBS ──
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
