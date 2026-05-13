const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const cron = require('node-cron');
const { Resend } = require('resend');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors({ origin: ['https://fortiqfunded.com','https://www.fortiqfunded.com','http://localhost:3000','http://127.0.0.1:5500'], methods: ['GET','POST'], credentials: true }));
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);
const TRONGRID_KEY = process.env.TRONGRID_API_KEY;
const BEP20_WALLET = '0xC5c3f3E0f9267701987ED62Bd715e61cfB8749F9';
const USDC_BEP20_CONTRACT = '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d';

// PAYMENT THRESHOLDS
const INITIAL_MIN_TRC20 = 4.50;  // $6 advertised, min $4.50 received
const INITIAL_MIN_BEP20 = 5.50;  // $6 advertised, min $5.50 received
const BALANCE_MIN = 142;          // $144 advertised, min $142 received

async function sendEmail(subject, text) {
  try { await resend.emails.send({ from: 'Fortiq Funded <support@fortiqfunded.com>', to: 'support@fortiqfunded.com', subject, text }); } catch(e) {}
}
async function sendTraderEmail(toEmail, subject, html) {
  try { await resend.emails.send({ from: 'Fortiq Funded <support@fortiqfunded.com>', to: toEmail, subject, html }); } catch(e) {}
}

function emailFooter() {
  return '<div style="background:#04060f;padding:20px 32px;border-top:1px solid rgba(255,255,255,0.04);text-align:center;"><p style="font-size:11px;color:#555575;margin:0;">Fortiq Funded<br><a href="https://fortiqfunded.com" style="color:#6c3de8;text-decoration:none;">fortiqfunded.com</a></p></div>';
}
function emailWrapper(content) {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#04060f;font-family:Arial,sans-serif;color:#e8e6ff;"><div style="max-width:560px;margin:40px auto;background:#070b18;border:1px solid rgba(255,255,255,0.06);border-radius:16px;overflow:hidden;">' + content + emailFooter() + '</div></body></html>';
}

function challengeActivatedEmail(traderName, accId, amount, network) {
  var cur = network === 'BEP20' ? 'USDC' : 'USDT';
  return emailWrapper('<div style="background:linear-gradient(135deg,#0f1829,#162038);padding:32px;text-align:center;border-bottom:1px solid rgba(108,61,232,0.2);"><div style="font-size:28px">🚀</div><h1 style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#a78bfa;margin:8px 0 0;">Challenge Activated!</h1></div><div style="padding:32px;"><p style="color:#e8e6ff;margin:0 0 16px;">Hi ' + traderName + ',</p><p style="color:#7a7a9a;font-size:14px;line-height:1.7;margin:0 0 24px;">Entry payment of <strong style="color:#e8e6ff;">$' + amount + ' ' + cur + '</strong> confirmed. Your challenge is live!</p><div style="background:#0f1829;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin-bottom:24px;"><div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Account ID</span><span style="color:#a78bfa;font-family:monospace;font-size:13px;">' + accId + '</span></div><div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Account Size</span><span style="color:#e8e6ff;font-size:13px;font-weight:600;">$5,000 USDT</span></div><div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Profit Target</span><span style="color:#e8e6ff;font-size:13px;font-weight:600;">8% ($400)</span></div><div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Daily Loss Limit</span><span style="color:#e8e6ff;font-size:13px;font-weight:600;">5% ($250)</span></div><div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Max Drawdown</span><span style="color:#e8e6ff;font-size:13px;font-weight:600;">8% ($400)</span></div><div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Min Active Days</span><span style="color:#e8e6ff;font-size:13px;font-weight:600;">5 Days</span></div><div style="display:flex;justify-content:space-between;padding:8px 0;"><span style="color:#7a7a9a;font-size:13px;">Your Profits</span><span style="color:#00d68f;font-size:13px;font-weight:700;">100% Yours</span></div></div><div style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.2);border-radius:10px;padding:16px;margin-bottom:24px;"><p style="font-size:13px;color:#c9a84c;margin:0;line-height:1.6;">When you pass and request your payout, simply pay the remaining $144 balance. You only pay the full fee if you succeed!</p></div><div style="text-align:center;"><a href="https://fortiqfunded.com/terminal.html" style="display:inline-block;background:linear-gradient(135deg,#6c3de8,#1e5fff);color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:600;font-size:14px;">Open Trading Terminal</a></div></div>');
}

function challengeFailedEmail(traderName, accId, reason) {
  return emailWrapper('<div style="background:linear-gradient(135deg,#0f1829,#162038);padding:32px;text-align:center;border-bottom:1px solid rgba(240,61,61,0.2);"><div style="font-size:28px">❌</div><h1 style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#f03d3d;margin:8px 0 0;">Account Failed</h1></div><div style="padding:32px;"><p style="color:#e8e6ff;margin:0 0 16px;">Hi ' + traderName + ',</p><p style="color:#7a7a9a;font-size:14px;line-height:1.7;margin:0 0 24px;">Account <strong style="color:#e8e6ff;">' + accId + '</strong> failed. ' + (reason ? 'Reason: <strong style="color:#e8e6ff;">' + reason + '</strong>' : '') + '</p><div style="background:rgba(240,61,61,0.06);border:1px solid rgba(240,61,61,0.2);border-radius:10px;padding:16px;margin-bottom:24px;"><p style="font-size:13px;color:#f03d3d;margin:0;">Review your strategy and try again for just $6.</p></div><div style="text-align:center;"><a href="https://fortiqfunded.com/checkout.html" style="display:inline-block;background:linear-gradient(135deg,#6c3de8,#1e5fff);color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:600;font-size:14px;">Try Again — Only $6</a></div></div>');
}

function stage2ActivatedEmail(traderName, accId) {
  return emailWrapper('<div style="background:linear-gradient(135deg,#0f1829,#162038);padding:32px;text-align:center;border-bottom:1px solid rgba(201,168,76,0.2);"><div style="font-size:28px">🏆</div><h1 style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#c9a84c;margin:8px 0 0;">You\'re Now Funded!</h1><p style="color:#7a7a9a;font-size:14px;margin:8px 0 0;">Stage 2 — Funded Account Activated</p></div><div style="padding:32px;"><p style="color:#e8e6ff;margin:0 0 16px;">Hi ' + traderName + ',</p><p style="color:#7a7a9a;font-size:14px;line-height:1.7;margin:0 0 24px;">Congratulations! Keep <strong style="color:#00d68f;">100% of every dollar you earn</strong>.</p><div style="background:#0f1829;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin-bottom:24px;"><div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Funded Account ID</span><span style="color:#c9a84c;font-family:monospace;font-size:13px;">' + accId + '</span></div><div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Account Size</span><span style="color:#e8e6ff;font-size:13px;font-weight:600;">$5,000 USDT</span></div><div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Your Profits</span><span style="color:#00d68f;font-size:13px;font-weight:700;">100% Yours</span></div><div style="display:flex;justify-content:space-between;padding:8px 0;"><span style="color:#7a7a9a;font-size:13px;">Max Profit Cap</span><span style="color:#c9a84c;font-size:13px;font-weight:600;">$5,000 USDT</span></div></div><div style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.2);border-radius:10px;padding:16px;margin-bottom:24px;"><p style="font-size:13px;color:#c9a84c;margin:0;line-height:1.6;"><strong>To request your payout:</strong> Close all positions, enter your wallet in your dashboard, then pay the $144 challenge balance. We verify it on-chain and send your full profit every Saturday.</p></div><div style="text-align:center;"><a href="https://fortiqfunded.com/terminal.html" style="display:inline-block;background:linear-gradient(135deg,#c9a84c,#e8c96a);color:#000;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:700;font-size:14px;">Start Trading Now →</a></div></div>');
}

function balancePaymentReceivedEmail(traderName, accId, profit, wallet, network) {
  var cur = network === 'BEP20' ? 'USDC' : 'USDT';
  return emailWrapper('<div style="background:linear-gradient(135deg,#0f1829,#162038);padding:32px;text-align:center;border-bottom:1px solid rgba(201,168,76,0.2);"><div style="font-size:28px">⏳</div><h1 style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#c9a84c;margin:8px 0 0;">Balance Payment Confirmed</h1><p style="color:#7a7a9a;font-size:14px;margin:8px 0 0;">Payout queued for this Saturday</p></div><div style="padding:32px;"><p style="color:#e8e6ff;margin:0 0 16px;">Hi ' + traderName + ',</p><p style="color:#7a7a9a;font-size:14px;line-height:1.7;margin:0 0 24px;">Your $144 balance payment is confirmed. Your payout will be sent this Saturday.</p><div style="background:#0f1829;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin-bottom:24px;"><div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Account</span><span style="color:#c9a84c;font-family:monospace;font-size:13px;">' + accId + '</span></div><div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Profit</span><span style="color:#00d68f;font-size:13px;">$' + parseFloat(profit).toFixed(2) + ' ' + cur + '</span></div><div style="display:flex;justify-content:space-between;padding:8px 0;"><span style="color:#7a7a9a;font-size:13px;">Split</span><span style="color:#00d68f;font-size:13px;font-weight:700;">100% Yours</span></div></div></div>');
}

// CHECK TRC20 INITIAL PAYMENTS
async function checkPendingPayments() {
  const { data: payments } = await supabase.from('payments').select('*').eq('status','pending').eq('network','TRC20').is('payment_type',null);
  if (!payments || !payments.length) return;
  for (const payment of payments) {
    try {
      let amount=0, confirmations=0, found=false;
      try { const res=await fetch('https://api.trongrid.io/v1/transactions/'+payment.tx_hash,{headers:{'TRON-PRO-API-KEY':TRONGRID_KEY}}); const data=await res.json(); if(data.data&&data.data.length>0){const tx=data.data[0];confirmations=tx.confirmations||0;if(tx.trc20_transfers&&tx.trc20_transfers.length>0){amount=parseInt(tx.trc20_transfers[0].amount_str||'0')/1000000;if(amount>0)found=true;}} } catch(e) {}
      if (!found) { try { const res2=await fetch('https://api.trongrid.io/v1/transactions/'+payment.tx_hash+'/events',{headers:{'TRON-PRO-API-KEY':TRONGRID_KEY}}); const data2=await res2.json(); if(data2.data){for(const ev of data2.data){if(ev.result&&ev.result.value){const val=parseInt(ev.result.value)/1000000;if(val>0){amount=val;confirmations=confirmations||999;found=true;break;}}}} } catch(e) {} }
      if (!found) { try { const res3=await fetch('https://apilist.tronscanapi.com/api/transaction-info?hash='+payment.tx_hash,{headers:{'TRON-PRO-API-KEY':TRONGRID_KEY}}); const data3=await res3.json(); if(data3&&data3.trc20TransferInfo&&data3.trc20TransferInfo.length>0){amount=parseInt(data3.trc20TransferInfo[0].amount_str||data3.trc20TransferInfo[0].amount||'0')/1000000;confirmations=data3.confirmations||999;if(amount>0)found=true;} } catch(e) {} }
      if (!found||amount===0) continue;
      await supabase.from('payments').update({confirmations,amount}).eq('id',payment.id);
      if (amount<INITIAL_MIN_TRC20) { await supabase.from('payments').update({status:'insufficient'}).eq('id',payment.id); await sendEmail('TRC20 Initial Payment Below Min','TX:'+payment.tx_hash+'\nAmt:$'+amount+'\nMin:$'+INITIAL_MIN_TRC20); continue; }
      if (confirmations>=19||confirmations===999) await activateChallenge(payment);
    } catch(err) { console.log('TRC20 check error:',err.message); }
  }
}

// CHECK BEP20 INITIAL PAYMENTS
async function checkPendingBEP20Payments() {
  const { data: payments } = await supabase.from('payments').select('*').eq('status','pending').eq('network','BEP20').is('payment_type',null);
  if (!payments||!payments.length) return;
  for (const payment of payments) {
    try {
      const rpcRes=await fetch('https://bsc-dataseed.binance.org/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',method:'eth_getTransactionReceipt',params:[payment.tx_hash],id:1})});
      const rpcData=await rpcRes.json(); if(!rpcData.result) continue;
      const receipt=rpcData.result;
      const blockRes=await fetch('https://bsc-dataseed.binance.org/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',method:'eth_blockNumber',params:[],id:1})});
      const blockData=await blockRes.json();
      const confirmations=parseInt(blockData.result,16)-parseInt(receipt.blockNumber,16);
      let amount=0;
      for(const log of receipt.logs){if(log.address.toLowerCase()===USDC_BEP20_CONTRACT.toLowerCase()&&log.topics[0]==='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'){const to='0x'+log.topics[2].slice(26);if(to.toLowerCase()===BEP20_WALLET.toLowerCase()){amount=parseInt(log.data,16)/Math.pow(10,18);}}}
      if(amount===0) continue;
      await supabase.from('payments').update({confirmations,amount}).eq('id',payment.id);
      if(amount<INITIAL_MIN_BEP20){await supabase.from('payments').update({status:'insufficient'}).eq('id',payment.id);await sendEmail('BEP20 Initial Payment Below Min','TX:'+payment.tx_hash+'\nAmt:$'+amount+'\nMin:$'+INITIAL_MIN_BEP20);continue;}
      if(confirmations>=15) await activateChallenge(payment);
    } catch(err) { console.log('BEP20 check error:',err.message); }
  }
}

// CHECK BALANCE PAYMENTS ($144 payout balance)
async function checkPendingBalancePayments() {
  const { data: payments } = await supabase.from('payments').select('*').eq('status','pending').eq('payment_type','payout_balance');
  if (!payments||!payments.length) return;
  for (const payment of payments) {
    try {
      let amount=0, confirmations=0, found=false;
      if (payment.network==='TRC20') {
        try { const res=await fetch('https://api.trongrid.io/v1/transactions/'+payment.tx_hash,{headers:{'TRON-PRO-API-KEY':TRONGRID_KEY}}); const data=await res.json(); if(data.data&&data.data.length>0){const tx=data.data[0];confirmations=tx.confirmations||0;if(tx.trc20_transfers&&tx.trc20_transfers.length>0){amount=parseInt(tx.trc20_transfers[0].amount_str||'0')/1000000;if(amount>0)found=true;}} } catch(e) {}
        if (!found) { try { const res3=await fetch('https://apilist.tronscanapi.com/api/transaction-info?hash='+payment.tx_hash,{headers:{'TRON-PRO-API-KEY':TRONGRID_KEY}}); const data3=await res3.json(); if(data3&&data3.trc20TransferInfo&&data3.trc20TransferInfo.length>0){amount=parseInt(data3.trc20TransferInfo[0].amount_str||data3.trc20TransferInfo[0].amount||'0')/1000000;confirmations=data3.confirmations||999;if(amount>0)found=true;} } catch(e) {} }
        if (!found||amount===0) continue;
        await supabase.from('payments').update({confirmations,amount}).eq('id',payment.id);
        if(amount<BALANCE_MIN){await supabase.from('payments').update({status:'insufficient'}).eq('id',payment.id);await sendEmail('Balance TRC20 Below Min','TX:'+payment.tx_hash+'\nAmt:$'+amount+'\nAcct:'+payment.account_id);continue;}
        if(confirmations>=19||confirmations===999) await confirmBalancePayment(payment);
      } else if (payment.network==='BEP20') {
        const rpcRes=await fetch('https://bsc-dataseed.binance.org/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',method:'eth_getTransactionReceipt',params:[payment.tx_hash],id:1})});
        const rpcData=await rpcRes.json(); if(!rpcData.result) continue;
        const receipt=rpcData.result;
        const blockRes=await fetch('https://bsc-dataseed.binance.org/',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',method:'eth_blockNumber',params:[],id:1})});
        const blockData=await blockRes.json();
        confirmations=parseInt(blockData.result,16)-parseInt(receipt.blockNumber,16);
        for(const log of receipt.logs){if(log.address.toLowerCase()===USDC_BEP20_CONTRACT.toLowerCase()&&log.topics[0]==='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'){const to='0x'+log.topics[2].slice(26);if(to.toLowerCase()===BEP20_WALLET.toLowerCase()){amount=parseInt(log.data,16)/Math.pow(10,18);found=true;}}}
        if(!found||amount===0) continue;
        await supabase.from('payments').update({confirmations,amount}).eq('id',payment.id);
        if(amount<BALANCE_MIN){await supabase.from('payments').update({status:'insufficient'}).eq('id',payment.id);await sendEmail('Balance BEP20 Below Min','TX:'+payment.tx_hash+'\nAmt:$'+amount+'\nAcct:'+payment.account_id);continue;}
        if(confirmations>=15) await confirmBalancePayment(payment);
      }
    } catch(err) { console.log('Balance payment check error:',err.message); }
  }
}

async function confirmBalancePayment(payment) {
  console.log('Balance payment confirmed:',payment.account_id);
  await supabase.from('payments').update({status:'confirmed'}).eq('id',payment.id);
  await supabase.from('accounts').update({balance_paid:true,payout_balance_pending:false}).eq('account_id',payment.account_id);
  const {data:account}=await supabase.from('accounts').select('user_id,profit,payout_wallet,payment_network').eq('account_id',payment.account_id).single();
  if(!account) return;
  const {data:profile}=await supabase.from('profiles').select('full_name,email').eq('id',account.user_id).single();
  if(!profile) return;
  const network=account.payment_network||'TRC20', currency=network==='BEP20'?'USDC':'USDT';
  await sendTraderEmail(profile.email,'✅ Balance Payment Confirmed — Payout Queued — '+payment.account_id,balancePaymentReceivedEmail(profile.full_name||'Trader',payment.account_id,account.profit,account.payout_wallet,network));
  await sendEmail('💰 PAYOUT READY — '+payment.account_id,'Account: '+payment.account_id+'\nTrader: '+profile.full_name+'\nEmail: '+profile.email+'\nProfit (100%): $'+parseFloat(account.profit||0).toFixed(2)+' '+currency+'\nWallet: '+account.payout_wallet+'\nNetwork: '+network+'\nBalance TX: '+payment.tx_hash+'\nBalance Received: $'+parseFloat(payment.amount||0).toFixed(2)+'\n\nGo to Admin Panel → Payouts to process.');
}

async function activateChallenge(payment) {
  const {data:profile,error:profErr}=await supabase.from('profiles').select('user_id,full_name,email').eq('id',payment.user_id).single();
  if(profErr||!profile){console.log('activateChallenge: profile not found for user_id:',payment.user_id,profErr);return;}
  const accId='ACC-'+profile.user_id.replace('USR-','');
  const {data:existing}=await supabase.from('accounts').select('account_id,status').eq('account_id',accId).single().catch(()=>({data:null}));
  if(existing&&existing.status==='active'){await supabase.from('payments').update({status:'confirmed',account_id:accId}).eq('id',payment.id);return;}
  // Use profile.user_id (USR-format) to match what accounts table expects
  const {error:accErr}=await supabase.from('accounts').upsert({user_id:profile.user_id,account_id:accId,account_type:'challenge',status:'active',stage:1,balance:5000,profit:0,daily_loss:0,max_drawdown:0,active_days:0,payment_network:payment.network||'TRC20'},{onConflict:'account_id'});
  if(accErr){console.log('activateChallenge: account upsert failed:',accErr.message);return;}
  await supabase.from('payments').update({status:'confirmed',account_id:accId}).eq('id',payment.id);
  console.log('Challenge activated:',accId);
  await sendEmail('New Challenge Activated','Trader: '+profile.full_name+'\nEmail: '+profile.email+'\nAccount: '+accId+'\nEntry: $'+payment.amount+' '+(payment.network==='BEP20'?'USDC':'USDT'));
  await sendTraderEmail(profile.email,'🚀 Your Challenge is Now Active — '+accId,challengeActivatedEmail(profile.full_name||'Trader',accId,parseFloat(payment.amount).toFixed(2),payment.network||'TRC20'));
}

async function checkPendingLimitOrders() {
  try {
    const {data:orders}=await supabase.from('orders').select('*').eq('status','pending');
    if(!orders||!orders.length) return;
    for(const order of orders){
      try{
        let currentPrice=null;
        try{const ctrl=new AbortController();const t=setTimeout(()=>ctrl.abort(),3000);const res=await fetch('https://api.binance.com/api/v3/ticker/price?symbol='+order.symbol,{signal:ctrl.signal});clearTimeout(t);const d=await res.json();if(d.price)currentPrice=parseFloat(d.price);}catch(e){}
        if(!currentPrice){try{const res2=await fetch('https://fapi.binance.com/fapi/v1/ticker/price?symbol='+order.symbol);const d2=await res2.json();if(d2.price)currentPrice=parseFloat(d2.price);}catch(e){}}
        if(!currentPrice) continue;
        const lp=parseFloat(order.limit_price);
        if(!((order.direction==='long'&&currentPrice<=lp)||(order.direction==='short'&&currentPrice>=lp))) continue;
        const {data:claimed,error:claimErr}=await supabase.rpc('mark_order_executed',{order_id:order.id});
        if(claimErr||!claimed) continue;
        const {data:account}=await supabase.from('accounts').select('*').eq('account_id',order.account_id).single();
        if(!account||account.status!=='active'||parseFloat(order.amount)>parseFloat(account.balance)) continue;
        const pos={user_id:order.user_id,account_id:order.account_id,symbol:order.symbol,direction:order.direction,amount:parseFloat(order.amount),leverage:parseFloat(order.leverage),entry_price:lp,size:parseFloat(order.amount)*parseFloat(order.leverage),status:'open',opened_at:new Date().toISOString()};
        if(order.take_profit)pos.take_profit=parseFloat(order.take_profit);if(order.stop_loss)pos.stop_loss=parseFloat(order.stop_loss);
        await supabase.from('positions').insert(pos);
        await supabase.from('accounts').update({balance:parseFloat((parseFloat(account.balance)-parseFloat(order.amount)).toFixed(2))}).eq('account_id',order.account_id);
      }catch(err){console.log('Limit order error:',err.message);}
    }
  }catch(err){console.log('checkPendingLimitOrders error:',err.message);}
}

// ROUTES
app.post('/open-position',async(req,res)=>{
  const{user_id,account_id,symbol,direction,amount,leverage,entry_price,size,take_profit,stop_loss}=req.body;
  if(!user_id||!account_id||!symbol||!direction||!amount||!entry_price)return res.status(400).json({error:'Missing fields'});
  try{
    const{data:account}=await supabase.from('accounts').select('*').eq('account_id',account_id).eq('status','active').single();
    if(!account||account.user_id!==user_id)return res.status(403).json({error:'Unauthorised'});
    const amt=parseFloat(amount);
    if(amt>parseFloat(account.balance))return res.status(400).json({error:'Amount exceeds balance'});
    if(parseFloat(account.daily_loss||0)>=5)return res.status(400).json({error:'Daily loss limit reached'});
    if(parseFloat(account.max_drawdown||0)>=8)return res.status(400).json({error:'Max drawdown reached'});
    const pos={user_id,account_id,symbol,direction,amount:amt,leverage:parseFloat(leverage)||1,entry_price:parseFloat(entry_price),size:parseFloat(size)||amt*(parseFloat(leverage)||1),status:'open',opened_at:new Date().toISOString()};
    if(take_profit)pos.take_profit=parseFloat(take_profit);if(stop_loss)pos.stop_loss=parseFloat(stop_loss);
    const{data:newPos,error:posErr}=await supabase.from('positions').insert(pos).select().single();
    if(posErr)return res.status(500).json({error:posErr.message});
    await supabase.from('accounts').update({balance:parseFloat((parseFloat(account.balance)-amt).toFixed(2)),status:'active'}).eq('account_id',account_id);
    res.json({success:true,position:newPos,newBalance:parseFloat((parseFloat(account.balance)-amt).toFixed(2))});
  }catch(err){res.status(500).json({error:err.message});}
});

app.post('/close-position',async(req,res)=>{
  const{position_id,account_id,user_id}=req.body;
  if(!position_id||!account_id||!user_id)return res.status(400).json({error:'Missing fields'});
  try{
    const{data:position}=await supabase.from('positions').select('*').eq('id',position_id).eq('account_id',account_id).eq('user_id',user_id).eq('status','open').single();
    if(!position)return res.status(404).json({error:'Position not found'});
    const{data:account}=await supabase.from('accounts').select('*').eq('account_id',account_id).eq('status','active').single();
    if(!account||account.user_id!==user_id)return res.status(403).json({error:'Unauthorised'});
    let exitPrice=null;
    try{const r=await fetch('https://api.binance.com/api/v3/ticker/price?symbol='+position.symbol);const d=await r.json();if(d.price)exitPrice=parseFloat(d.price);}catch(e){}
    if(!exitPrice){try{const r=await fetch('https://fapi.binance.com/fapi/v1/ticker/price?symbol='+position.symbol);const d=await r.json();if(d.price)exitPrice=parseFloat(d.price);}catch(e){}}
    if(!exitPrice){try{const coinMap={'BTCUSDT':'bitcoin','ETHUSDT':'ethereum','SOLUSDT':'solana','XRPUSDT':'ripple','ADAUSDT':'cardano','DOGEUSDT':'dogecoin'};const coinId=coinMap[position.symbol]||'bitcoin';const r=await fetch('https://api.coingecko.com/api/v3/simple/price?ids='+coinId+'&vs_currencies=usd');const d=await r.json();if(d[coinId])exitPrice=d[coinId].usd;}catch(e){}}
    if(!exitPrice)return res.status(500).json({error:'Could not fetch price'});
    const entryPrice=parseFloat(position.entry_price),amount=parseFloat(position.amount),size=parseFloat(position.size);
    let rawPnl=(position.direction==='long'?(exitPrice-entryPrice)/entryPrice:(entryPrice-exitPrice)/entryPrice)*size;
    if(rawPnl<-amount)rawPnl=-amount;
    const pnl=parseFloat(rawPnl.toFixed(2)),returnedMargin=Math.max(0,amount+pnl);
    const currentBalance=parseFloat(account.balance),currentProfit=parseFloat(account.profit||0),currentDailyLoss=parseFloat(account.daily_loss||0),currentMaxDrawdown=parseFloat(account.max_drawdown||0);
    const newBalance=parseFloat((currentBalance+returnedMargin).toFixed(2)),newProfit=parseFloat((currentProfit+pnl).toFixed(2));
    let newDailyLoss=currentDailyLoss;if(pnl<0)newDailyLoss=parseFloat((currentDailyLoss+(Math.abs(pnl)/5000)*100).toFixed(4));
    const newMaxDrawdown=parseFloat((currentMaxDrawdown+(pnl<0?(Math.abs(pnl)/5000)*100:0)).toFixed(4));
    const dailyLimitBreached=newDailyLoss>=5,drawdownBreached=newMaxDrawdown>=8,ruleBreached=dailyLimitBreached||drawdownBreached;
    const stage=account.stage||1,activeDays=account.active_days||0;
    const stage1Passed=stage===1&&newProfit>=400&&activeDays>=5&&!ruleBreached;
    const stage2CapHit=stage===2&&newProfit>=5000;
    await supabase.from('positions').update({status:'closed',exit_price:exitPrice,pnl,closed_at:new Date().toISOString()}).eq('id',position_id);
    if(ruleBreached){
      await supabase.from('accounts').update({balance:newBalance,profit:newProfit,daily_loss:newDailyLoss,max_drawdown:newMaxDrawdown,status:'failed'}).eq('account_id',account_id);
      const{data:profile}=await supabase.from('profiles').select('full_name,email').eq('id',user_id).single();
      if(profile){const reason=dailyLimitBreached?'Daily loss limit of 5% exceeded':'Maximum drawdown of 8% exceeded';await sendTraderEmail(profile.email,'❌ Account Failed — '+account_id,challengeFailedEmail(profile.full_name||'Trader',account_id,reason));await sendEmail('Account Auto-Failed — '+account_id,'Reason: '+reason);}
      return res.json({success:true,pnl,exitPrice,newBalance,newProfit,newDailyLoss,newMaxDrawdown,accountFailed:true,reason:dailyLimitBreached?'daily_loss':'drawdown'});
    }
    await supabase.from('accounts').update({balance:newBalance,profit:newProfit,daily_loss:newDailyLoss,max_drawdown:newMaxDrawdown}).eq('account_id',account_id);
    if(stage1Passed){
      try{
        const{data:profile}=await supabase.from('profiles').select('user_id,full_name,email').eq('id',user_id).single();
        if(profile){
          const stage2AccId='FND-'+profile.user_id.replace('USR-','');
          const{data:existing}=await supabase.from('accounts').select('account_id').eq('account_id',stage2AccId).single().catch(()=>({data:null}));
          if(!existing){
            await supabase.from('accounts').insert({user_id,account_id:stage2AccId,account_type:'funded',status:'active',stage:2,balance:5000,profit:0,daily_loss:0,max_drawdown:0,active_days:0,payment_network:account.payment_network||'TRC20'});
            await supabase.from('accounts').update({status:'funded',stage2_account_id:stage2AccId}).eq('account_id',account_id);
            await sendTraderEmail(profile.email,'🏆 You Are Now Funded — '+stage2AccId,stage2ActivatedEmail(profile.full_name||'Trader',stage2AccId));
            await sendEmail('Stage 2 Created — '+stage2AccId,'Trader: '+profile.full_name+'\nEmail: '+profile.email);
          }
          return res.json({success:true,pnl,exitPrice,newBalance,newProfit,newDailyLoss,newMaxDrawdown,stage1Passed:true,stage2AccountId:stage2AccId});
        }
      }catch(s2err){console.log('Stage 2 error:',s2err.message);}
    }
    if(stage2CapHit)return res.json({success:true,pnl,exitPrice,newBalance,newProfit,newDailyLoss,newMaxDrawdown,stage2CapHit:true});
    res.json({success:true,pnl,exitPrice,newBalance,newProfit,newDailyLoss,newMaxDrawdown,accountFailed:false,stage1Passed:false});
  }catch(err){res.status(500).json({error:err.message});}
});

// NEW: Submit $144 balance payment when requesting payout
app.post('/submit-balance-payment',async(req,res)=>{
  const{account_id,tx_hash,user_id,network}=req.body;
  if(!account_id||!tx_hash||!user_id||!network)return res.status(400).json({error:'Missing fields'});
  try{
    const{data:account}=await supabase.from('accounts').select('user_id,profit,payout_wallet').eq('account_id',account_id).single();
    if(!account||account.user_id!==user_id)return res.status(403).json({error:'Unauthorised'});
    if(!account.payout_wallet)return res.status(400).json({error:'Please enter your payout wallet address first'});
    if(parseFloat(account.profit||0)<=0)return res.status(400).json({error:'No profit to pay out'});
    const{data:dup}=await supabase.from('payments').select('id,status').eq('tx_hash',tx_hash).single().catch(()=>({data:null}));
    if(dup)return res.json({success:true,message:'Already submitted',status:dup.status});
    await supabase.from('payments').insert({user_id,account_id,tx_hash,amount:0,status:'pending',confirmations:0,network,payment_type:'payout_balance'});
    await supabase.from('accounts').update({payout_balance_pending:true}).eq('account_id',account_id);
    res.json({success:true,message:'Balance payment submitted. We will verify it on-chain and process your payout this Saturday.'});
  }catch(err){res.status(500).json({error:err.message});}
});

app.post('/notify-status',async(req,res)=>{
  const{account_id,status,reason}=req.body;
  if(!account_id||!status)return res.status(400).json({error:'Missing fields'});
  try{
    const{data:account}=await supabase.from('accounts').select('user_id').eq('account_id',account_id).single();
    if(!account)return res.status(404).json({error:'Not found'});
    const{data:profile}=await supabase.from('profiles').select('full_name,email').eq('id',account.user_id).single();
    if(status==='failed'&&profile){await sendTraderEmail(profile.email,'❌ Account Failed — '+account_id,challengeFailedEmail(profile.full_name||'Trader',account_id,reason||''));await sendEmail('Account Failed — '+account_id,'Reason: '+(reason||'Rule breach'));}
    res.json({success:true});
  }catch(err){res.status(500).json({error:err.message});}
});

app.post('/admin-login',(req,res)=>{
  const{password}=req.body;if(!password)return res.status(400).json({success:false});
  if(password===process.env.ADMIN_PASSWORD)return res.json({success:true});
  return res.status(401).json({success:false,error:'Incorrect password'});
});

app.post('/notify-payout',async(req,res)=>{
  const{account_id,payout_amount,wallet_address}=req.body;
  if(!account_id||!payout_amount||!wallet_address)return res.status(400).json({error:'Missing fields'});
  try{
    const{data:account}=await supabase.from('accounts').select('user_id,profit,payment_network').eq('account_id',account_id).single();
    if(!account)return res.status(404).json({error:'Not found'});
    const{data:profile}=await supabase.from('profiles').select('full_name,email').eq('id',account.user_id).single();
    if(!profile)return res.status(404).json({error:'Profile not found'});
    const payNet=account.payment_network||'TRC20',payCur=payNet==='BEP20'?'USDC':'USDT',payLabel=payNet==='BEP20'?'USDC BEP20':'USDT TRC20';
    const html=emailWrapper('<div style="background:linear-gradient(135deg,#0f1829,#162038);padding:32px;text-align:center;border-bottom:1px solid rgba(201,168,76,0.2);"><div style="font-size:28px">🎉</div><h1 style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#c9a84c;margin:8px 0 0;">Payout Sent!</h1><p style="color:#7a7a9a;font-size:14px;margin:8px 0 0;">100% Profit Payment</p></div><div style="padding:32px;"><p style="color:#e8e6ff;margin:0 0 20px;">Hi '+profile.full_name+',</p><p style="color:#7a7a9a;font-size:14px;line-height:1.7;margin:0 0 24px;">Your full 100% profit has been sent.</p><div style="background:#0f1829;border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px;margin-bottom:24px;"><div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Account</span><span style="color:#a78bfa;font-family:monospace;font-size:13px;">'+account_id+'</span></div><div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Payout (100%)</span><span style="color:#c9a84c;font-family:monospace;font-size:16px;font-weight:700;">$'+payout_amount+' '+payCur+'</span></div><div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="color:#7a7a9a;font-size:13px;">Network</span><span style="color:#e8e6ff;font-size:13px;">'+payLabel+'</span></div><div style="padding:8px 0;"><span style="color:#7a7a9a;font-size:13px;display:block;margin-bottom:4px;">Wallet</span><span style="color:#e8e6ff;font-family:monospace;font-size:11px;word-break:break-all;">'+wallet_address+'</span></div></div><div style="text-align:center;"><a href="https://fortiqfunded.com/checkout.html" style="display:inline-block;background:linear-gradient(135deg,#6c3de8,#1e5fff);color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:600;font-size:14px;">Start New Challenge — Only $6 →</a></div></div>');
    await sendTraderEmail(profile.email,'🎉 Payout Sent — $'+payout_amount+' '+payCur,html);
    await sendEmail('Payout Processed — '+account_id,'Account: '+account_id+'\nTrader: '+profile.full_name+'\nAmount: $'+payout_amount+' '+payCur+'\nWallet: '+wallet_address);
    res.json({success:true});
  }catch(err){res.status(500).json({error:err.message});}
});

app.get('/leaderboard',async(req,res)=>{
  try{
    const{data:accounts}=await supabase.from('accounts').select('account_id,user_id,profit,active_days,status,payout_amount').in('status',['funded','closed']).eq('paid_out',true).order('profit',{ascending:false}).limit(20);
    if(!accounts||!accounts.length)return res.json({leaderboard:[]});
    const leaderboard=await Promise.all(accounts.map(async(acc,index)=>{
      const{data:profile}=await supabase.from('profiles').select('full_name').eq('id',acc.user_id).single();
      const name=profile?profile.full_name:'Anonymous';const firstName=name.split(' ')[0];const li=name.split(' ')[1]?name.split(' ')[1][0]+'.':'';
      return{rank:index+1,name:firstName+(li?' '+li:''),account_id:acc.account_id,profit:parseFloat(acc.profit||0).toFixed(2),payout:parseFloat(acc.payout_amount||0).toFixed(2),profit_pct:((parseFloat(acc.profit||0)/5000)*100).toFixed(2),active_days:acc.active_days||0,status:acc.status};
    }));
    res.json({leaderboard});
  }catch(err){res.status(500).json({error:err.message});}
});

app.post('/verify-recaptcha',async(req,res)=>{
  const{token}=req.body;if(!token)return res.status(400).json({success:false});
  try{const r=await fetch('https://www.google.com/recaptcha/api/siteverify',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'secret='+process.env.RECAPTCHA_SECRET_KEY+'&response='+token});const d=await r.json();res.json({success:d.success});}catch(err){res.status(500).json({success:false});}
});

app.post('/submit-payout-wallet',async(req,res)=>{
  const{account_id,wallet,user_id}=req.body;if(!account_id||!wallet||!user_id)return res.status(400).json({error:'Missing fields'});
  try{const{data:account}=await supabase.from('accounts').select('user_id').eq('account_id',account_id).single();if(!account||account.user_id!==user_id)return res.status(403).json({error:'Unauthorised'});await supabase.from('accounts').update({payout_wallet:wallet}).eq('account_id',account_id);res.json({success:true});}catch(err){res.status(500).json({error:err.message});}
});

app.post('/create-stage2',async(req,res)=>{
  const{stage1_account_id,user_id}=req.body;if(!stage1_account_id||!user_id)return res.status(400).json({error:'Missing fields'});
  try{
    const{data:profile}=await supabase.from('profiles').select('user_id,full_name,email').eq('id',user_id).single();if(!profile)return res.status(404).json({error:'Profile not found'});
    const stage2AccId='FND-'+profile.user_id.replace('USR-','');
    const{data:existing}=await supabase.from('accounts').select('account_id').eq('account_id',stage2AccId).single().catch(()=>({data:null}));if(existing)return res.json({success:true,stage2_account_id:stage2AccId,message:'Already exists'});
    const{data:stage1}=await supabase.from('accounts').select('payment_network').eq('account_id',stage1_account_id).single().catch(()=>({data:null}));
    await supabase.from('accounts').insert({user_id,account_id:stage2AccId,account_type:'funded',status:'active',stage:2,balance:5000,profit:0,daily_loss:0,max_drawdown:0,active_days:0,payment_network:(stage1&&stage1.payment_network)||'TRC20'});
    await supabase.from('accounts').update({status:'funded',stage2_account_id:stage2AccId}).eq('account_id',stage1_account_id);
    await sendTraderEmail(profile.email,'🏆 You Are Now Funded — '+stage2AccId,stage2ActivatedEmail(profile.full_name||'Trader',stage2AccId));
    await sendEmail('Stage 2 Created — '+stage2AccId,'Trader: '+profile.full_name);
    res.json({success:true,stage2_account_id:stage2AccId});
  }catch(err){res.status(500).json({error:err.message});}
});

cron.schedule('*/2 * * * *', checkPendingPayments);
cron.schedule('*/2 * * * *', checkPendingBEP20Payments);
cron.schedule('*/2 * * * *', checkPendingBalancePayments);
cron.schedule('*/30 * * * * *', checkPendingLimitOrders);
cron.schedule('0 0 * * *', async function(){
  try{await supabase.from('accounts').update({daily_loss:0}).in('status',['to_be_active','active','funded']);console.log('Daily loss reset');}catch(err){console.log('Reset failed:',err.message);}
});

app.get('/',(req,res)=>res.send('Fortiq Funded Backend Running'));
app.get('/health',(req,res)=>res.json({status:'ok'}));
const PORT=process.env.PORT||3000;
app.listen(PORT,()=>console.log('Server running on port',PORT));
