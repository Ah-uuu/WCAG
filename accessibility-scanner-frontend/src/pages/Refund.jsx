export default function Refund() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px', fontFamily: 'monospace', color: '#e2e8f0' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: 8, color: '#ffd700', letterSpacing: 2 }}>💰 退款政策</h1>
      <p style={{ color: '#94a3b8', marginBottom: 32 }}>最後更新：2026 年 4 月 19 日</p>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ color: '#ffd700', fontSize: '1.2rem' }}>1. 退款資格</h2>
        <p>若您對服務不滿意，可在首次付款後 <strong>7 天內</strong> 申請全額退款，無需提供理由。此後恕不受理退款申請。</p>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ color: '#ffd700', fontSize: '1.2rem' }}>2. 不適用退款的情況</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          <li>距首次付款超過 7 天的訂閱費用</li>
          <li>已使用大量掃描次數（超過當月配額 50% 以上）</li>
          <li>因違反服務條款而被終止的帳號</li>
          <li>部分月份的按比例退款（取消後服務持續至週期末）</li>
        </ul>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ color: '#ffd700', fontSize: '1.2rem' }}>3. 如何申請退款</h2>
        <p>請以電子郵件聯絡我們，並提供以下資訊：</p>
        <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          <li>帳號電子郵件地址</li>
          <li>付款日期或 Stripe 交易編號</li>
          <li>退款原因（選填）</li>
        </ul>
        <p style={{ marginTop: 12 }}>聯絡信箱：<a href="mailto:support@accessscan.app" style={{ color: '#60a5fa' }}>support@accessscan.app</a></p>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ color: '#ffd700', fontSize: '1.2rem' }}>4. 處理時間</h2>
        <p>退款申請將在 <strong>3 個工作天內</strong> 審核。通過後款項將退回原付款方式，銀行處理時間約需 5–10 個工作天。</p>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ color: '#ffd700', fontSize: '1.2rem' }}>5. 取消訂閱</h2>
        <p>您可隨時在儀表板的「管理方案」中取消訂閱。取消後不再續費，但當前計費週期內仍可繼續使用服務。</p>
      </section>
      <section>
        <h2 style={{ color: '#ffd700', fontSize: '1.2rem' }}>6. 聯絡我們</h2>
        <p>如有任何退款相關疑問，請聯絡：<a href="mailto:support@accessscan.app" style={{ color: '#60a5fa' }}>support@accessscan.app</a></p>
      </section>
    </div>
  );
}
