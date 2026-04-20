export default function Privacy() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px', fontFamily: 'monospace', color: '#e2e8f0' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: 8, color: '#ffd700', letterSpacing: 2 }}>🔒 隱私政策</h1>
      <p style={{ color: '#94a3b8', marginBottom: 32 }}>最後更新：2026 年 4 月 19 日</p>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ color: '#ffd700', fontSize: '1.2rem' }}>1. 我們收集的資料</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          <li><strong>帳號資料：</strong>電子郵件地址、顯示名稱</li>
          <li><strong>掃描資料：</strong>您提交掃描的網址及掃描結果</li>
          <li><strong>付款資料：</strong>訂閱狀態（付款明細由 Stripe 保管，我們不儲存完整卡號）</li>
          <li><strong>使用資料：</strong>掃描次數、登入時間等使用紀錄</li>
        </ul>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ color: '#ffd700', fontSize: '1.2rem' }}>2. 我們如何使用資料</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          <li>提供、維護和改善服務</li>
          <li>處理付款及管理訂閱</li>
          <li>發送服務相關通知（如訂閱到期提醒）</li>
          <li>分析整體使用趨勢以優化產品（匿名彙總）</li>
        </ul>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ color: '#ffd700', fontSize: '1.2rem' }}>3. 資料共享</h2>
        <p>我們不會出售您的個人資料。僅在以下情況與第三方共享：</p>
        <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          <li><strong>Stripe：</strong>用於安全處理付款</li>
          <li><strong>法律要求：</strong>在依法要求揭露時</li>
        </ul>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ color: '#ffd700', fontSize: '1.2rem' }}>4. 資料保留</h2>
        <p>帳號資料在您主動刪除帳號前持續保存。掃描紀錄保留最多 12 個月。您可隨時聯絡我們要求刪除個人資料。</p>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ color: '#ffd700', fontSize: '1.2rem' }}>5. Cookie</h2>
        <p>本服務使用必要 Cookie 維持登入狀態，不使用第三方追蹤 Cookie。</p>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ color: '#ffd700', fontSize: '1.2rem' }}>6. 您的權利</h2>
        <p>您有權存取、更正或刪除您的個人資料。如需行使這些權利，請聯絡我們。</p>
      </section>
      <section>
        <h2 style={{ color: '#ffd700', fontSize: '1.2rem' }}>7. 聯絡我們</h2>
        <p>如有隱私相關疑問：<a href="mailto:support@accessscan.app" style={{ color: '#60a5fa' }}>support@accessscan.app</a></p>
      </section>
    </div>
  );
}
