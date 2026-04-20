export default function Terms() {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px', fontFamily: 'monospace', color: '#e2e8f0' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: 8, color: '#ffd700', letterSpacing: 2 }}>📜 服務條款</h1>
      <p style={{ color: '#94a3b8', marginBottom: 32 }}>最後更新：2026 年 4 月 19 日</p>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ color: '#ffd700', fontSize: '1.2rem' }}>1. 接受條款</h2>
        <p>使用 AccessScan（以下簡稱「本服務」），即表示您同意遵守本服務條款。若不同意，請勿使用本服務。</p>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ color: '#ffd700', fontSize: '1.2rem' }}>2. 服務說明</h2>
        <p>AccessScan 提供網站無障礙（WCAG）掃描與報告服務，協助開發者與企業改善網站的可及性合規程度。掃描結果僅供參考，不構成法律合規保證。</p>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ color: '#ffd700', fontSize: '1.2rem' }}>3. 帳號責任</h2>
        <p>您有責任保管帳號憑證，並對帳號下發生的所有活動負責。請勿共用帳號或以自動化方式濫用本服務。</p>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ color: '#ffd700', fontSize: '1.2rem' }}>4. 使用限制</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          <li>對未經授權的網站執行掃描</li>
          <li>以任何方式干擾或破壞本服務的運作</li>
          <li>嘗試繞過付費方案限制或取得未授權存取</li>
          <li>將掃描結果用於非法用途</li>
        </ul>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ color: '#ffd700', fontSize: '1.2rem' }}>5. 訂閱與付款</h2>
        <p>付費方案按月計費，到期自動續約。您可隨時取消訂閱，取消後服務持續至當前計費週期結束。付款由 Stripe 安全處理。</p>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ color: '#ffd700', fontSize: '1.2rem' }}>6. 免責聲明</h2>
        <p>本服務「依現狀」提供，不作任何明示或暗示的保證。</p>
      </section>
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ color: '#ffd700', fontSize: '1.2rem' }}>7. 條款修改</h2>
        <p>我們保留隨時修改本條款的權利。重大變更將提前通知，繼續使用本服務即表示接受更新後的條款。</p>
      </section>
      <section>
        <h2 style={{ color: '#ffd700', fontSize: '1.2rem' }}>8. 聯絡我們</h2>
        <p>如有疑問，請聯絡：<a href="mailto:support@accessscan.app" style={{ color: '#60a5fa' }}>support@accessscan.app</a></p>
      </section>
    </div>
  );
}
