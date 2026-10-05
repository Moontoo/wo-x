const LOAN_AMOUNTS=[1000000,3000000,6000000],LOAN_REPAY_PERCENT=30;
let lastSale=null;
function freshLoan(){return {principal:0,balance:0,repaid:0,remainder:0};}
function normalizeLoan(){
 const loan=s.loan;
 if(!loan||![loan.principal,loan.balance,loan.repaid,loan.remainder].every(Number.isSafeInteger)||loan.balance<0||loan.repaid<0||loan.principal!==loan.balance+loan.repaid||(!LOAN_AMOUNTS.includes(loan.principal)&&loan.principal!==0)||loan.remainder<0||loan.remainder>9)s.loan=freshLoan();
}
function borrowLoan(amount){
 if(!LOAN_AMOUNTS.includes(amount)||s.loan.balance>0)return false;
 s.loan={principal:amount,balance:amount,repaid:0,remainder:0};s.cash+=amount;lastSale=null;return true;
}
function settleLoanSale(amount){
 let repayment=0;
 if(s.loan.balance>0){
  const numerator=amount*3+s.loan.remainder;
  repayment=Math.min(s.loan.balance,Math.floor(numerator/10));
  s.loan.balance-=repayment;s.loan.repaid+=repayment;
  s.loan.remainder=s.loan.balance?numerator%10:0;
 }
 return {gross:amount,repaid:repayment,cash:amount-repayment};
}
function sellItems(uids){
 const receipt={gross:0,repaid:0,cash:0};let sold=0;
 for(const uid of uids){const sale=sellItem(uid);if(!sale)continue;sold++;receipt.gross+=sale.gross;receipt.repaid+=sale.repaid;receipt.cash+=sale.cash;}
 if(sold)lastSale={...receipt,debt:s.loan.balance};
}
function saleNotice(){return lastSale?`<div class="notice sale-receipt" role="status"><strong>本次出售</strong><span>货物收入 ${money(lastSale.gross)}</span><span>自动还贷 ${money(lastSale.repaid)}</span><span>实际到账 ${money(lastSale.cash)}</span><span>剩余贷款 ${money(lastSale.debt)}</span></div>`:'';}
function loanHint(){return s.loan.balance>0?`<div class="notice">未还贷款 ${money(s.loan.balance)}。本次卖出金额的${LOAN_REPAY_PERCENT}%会自动用于还债，最多扣除剩余欠款；其余金额到账。</div>`:'';}
function loanGrid(){
 const active=s.loan.balance>0;
 return heading('FINANCE / LOAN','贷款周转','选择100万、300万或600万游戏币贷款。借款立即到账，无利息。')+
 `<div class="stats"><div class="stat"><small>本笔借款</small><strong>${money(s.loan.principal)}</strong></div><div class="stat"><small>本笔已还</small><strong class="positive">${money(s.loan.repaid)}</strong></div><div class="stat"><small>剩余欠款</small><strong class="${active?'negative':'positive'}">${money(s.loan.balance)}</strong></div></div><div class="notice">${active?'当前贷款未还清，暂不能再次借款。':'当前无未还贷款，可以选择一个额度。'}每次出售货物，卖出金额的${LOAN_REPAY_PERCENT}%自动还债；还清后，卖出金额全部到账。无利息，不扣除额外费用。</div><div class="cards loan-options">${LOAN_AMOUNTS.map(amount=>`<article class="panel"><div class="eyebrow">周转额度</div><h2>${amount/10000}万</h2><p>到账 ${money(amount)}<br>无利息 · 自动偿还</p><button data-loan="${amount}" ${active?'disabled':''}>借款${amount/10000}万</button></article>`).join('')}</div><p class="loan-rule">单件出售、整箱出售和仓库全部出售均会自动还债。按卖出金额计算，即使本箱亏损也会还款；还清前不能叠加借款。</p><button class="secondary" data-view="port">返回集装箱市场</button>`;
}
