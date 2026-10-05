const LOAN_AMOUNTS=[1000000,3000000,6000000],LOAN_REPAY_PERCENT=30,LOAN_RULE_REVISION=2;
let lastSale=null;
function freshLoan(){return {principal:0,balance:0,repaid:0,remainder:0};}
function normalizeLoan(){
 const loan=s.loan;
 if(!loan||![loan.principal,loan.balance,loan.repaid,loan.remainder].every(Number.isSafeInteger)||loan.balance<0||loan.repaid<0||loan.principal!==loan.balance+loan.repaid||(!LOAN_AMOUNTS.includes(loan.principal)&&loan.principal!==0)||loan.remainder<0||loan.remainder>9)s.loan=freshLoan();
}
function normalizeLoanRules(){
 const legacy=s.loanRuleRevision!==LOAN_RULE_REVISION;
 for(const record of s.records){
  if(legacy){record.profitRepaymentBase=Math.max(0,record.revenue-record.cost);record.confirmedValue=null;}
  if(!Number.isSafeInteger(record.profitRepaymentBase)||record.profitRepaymentBase<0)record.profitRepaymentBase=0;
  if(!Number.isSafeInteger(record.confirmedValue)){
   const stock=s.stock.filter(it=>it.record===record.id);
   if(record.sold+stock.length===record.total)record.confirmedValue=record.revenue+stock.reduce((sum,it)=>sum+it.value,0);
  }
 }
 if(legacy)s.loan.remainder=0;
 s.loanRuleRevision=LOAN_RULE_REVISION;
}
function borrowLoan(amount){
 if(!LOAN_AMOUNTS.includes(amount)||s.loan.balance>0)return false;
 s.loan={principal:amount,balance:amount,repaid:0,remainder:0};s.cash+=amount;lastSale=null;return true;
}
function realizedCargoProfit(record){return record&&record.confirmedValue>record.cost?Math.max(0,record.revenue-record.cost):0;}
function settleLoanSale(amount,record){
 const profit=realizedCargoProfit(record),profitBase=Math.max(0,profit-(record?.profitRepaymentBase||0));
 if(record)record.profitRepaymentBase=Math.max(record.profitRepaymentBase||0,profit);
 let repayment=0;
 if(s.loan.balance>0&&profitBase>0){
  const numerator=profitBase*3+s.loan.remainder;
  repayment=Math.min(s.loan.balance,Math.floor(numerator/10));
  s.loan.balance-=repayment;s.loan.repaid+=repayment;
  s.loan.remainder=s.loan.balance?numerator%10:0;
 }
 return {gross:amount,profitBase,repaid:repayment,cash:amount-repayment};
}
function confirmCargoProfit(t){
 if(!t||!t.items.every(it=>it.revealed))return;
 const record=s.records.find(r=>r.id===t.id);if(!record)return;
 record.confirmedValue=t.items.reduce((sum,it)=>sum+it.value,0);
 const receipt=settleLoanSale(0,record);
 if(receipt.repaid){s.cash+=receipt.cash;record.repaid=(record.repaid||0)+receipt.repaid;lastSale={...receipt,debt:s.loan.balance,confirmation:true};}
}
function sellItems(uids){
 const receipt={gross:0,profitBase:0,repaid:0,cash:0};let sold=0;
 for(const uid of uids){const sale=sellItem(uid);if(!sale)continue;sold++;receipt.gross+=sale.gross;receipt.profitBase+=sale.profitBase;receipt.repaid+=sale.repaid;receipt.cash+=sale.cash;}
 if(sold)lastSale={...receipt,debt:s.loan.balance};
}
function saleNotice(){return lastSale?`<div class="notice sale-receipt" role="status"><strong>${lastSale.confirmation?'盈利确认还贷':'本次出售'}</strong>${lastSale.confirmation?'':`<span>货物收入 ${money(lastSale.gross)}</span>`}<span>新增已实现利润 ${money(lastSale.profitBase)}</span><span>自动还贷 ${money(lastSale.repaid)}</span><span>${lastSale.confirmation?'现金变动':'实际到账'} ${money(lastSale.cash)}</span><span>剩余贷款 ${money(lastSale.debt)}</span></div>`:'';}
function loanHint(){return s.loan.balance>0?`<div class="notice">未还贷款 ${money(s.loan.balance)}。整箱揭晓确认盈利后，卖货收入先收回箱价，超出箱价的净利润按${LOAN_REPAY_PERCENT}%自动还债。亏损、仅回本或尚未出售的货物不扣款。</div>`:'';}
function loanGrid(){
 const active=s.loan.balance>0;
 return heading('FINANCE / LOAN','贷款周转','选择100万、300万或600万游戏币贷款。借款立即到账，无利息。')+
 `<div class="stats"><div class="stat"><small>本笔借款</small><strong>${money(s.loan.principal)}</strong></div><div class="stat"><small>本笔已还</small><strong class="positive">${money(s.loan.repaid)}</strong></div><div class="stat"><small>剩余欠款</small><strong class="${active?'negative':'positive'}">${money(s.loan.balance)}</strong></div></div><div class="notice">${active?'当前贷款未还清，暂不能再次借款。':'当前无未还贷款，可以选择一个额度。'}整箱揭晓并确认盈利后，累计卖货收入超过买箱成本的部分，按${LOAN_REPAY_PERCENT}%自动还债；本金和亏损不扣款。还清后，收入全部到账。</div><div class="cards loan-options">${LOAN_AMOUNTS.map(amount=>`<article class="panel"><div class="eyebrow">周转额度</div><h2>${amount/10000}万</h2><p>到账 ${money(amount)}<br>无利息 · 盈利后自动偿还</p><button data-loan="${amount}" ${active?'disabled':''}>借款${amount/10000}万</button></article>`).join('')}</div><p class="loan-rule">例：150万买箱，整箱卖出200万，净赚50万，其中15万还贷，现金到账185万。只收藏不出售不还贷；单件和批量出售按同一累计利润结算。若揭晓前已卖出货物，确认盈利时会结算此前已赚到的利润。</p><button class="secondary" data-view="port">返回集装箱市场</button>`;
}
