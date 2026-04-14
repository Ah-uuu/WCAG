const { prisma }     = require('../lib/db');
const { PLAN_LIMITS } = require('../lib/stripe');

// ─────────────────────────────────────────────────────────────────────────────
// scanLimit middleware
// 已登入用戶：根據方案檢查每月掃描額度
// 未登入用戶：跳過（由 express-rate-limit 的 scanLimiter 控管）
// ─────────────────────────────────────────────────────────────────────────────
async function scanLimit(req, res, next) {
  // 未登入：直接放行（IP 限流已在 index.js 處理）
  if (!req.user) return next();

  try {
    // 取得訂閱資料
    const sub = await prisma.Subscription.findUnique({
      where: { userId: req.user.id },
    });

    const plan  = sub?.status === 'ACTIVE' ? (sub.plan || 'FREE') : 'FREE';
    const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;

    // -1 = 無限制（Enterprise）
    if (limit === -1) {
      req.scanPlan  = plan;
      req.scanLimit = -1;
      req.scanUsed  = 0;
      return next();
    }

    // 計算本月已使用次數
    const now       = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const used = await prisma.Scan.count({
      where: {
        userId:    req.user.id,
        createdAt: { gte: monthStart },
      },
    });

    if (used >= limit) {
      return res.status(429).json({
        error: `Monthly scan limit reached (${limit} scans). Upgrade your plan for more.`,
        plan,
        used,
        limit,
      });
    }

    // 把用量資訊掛在 req 上，供 scan route 回傳給前端
    req.scanPlan  = plan;
    req.scanLimit = limit;
    req.scanUsed  = used;

    return next();
  } catch (err) {
    console.error('[SCAN LIMIT] Error:', err.message);
    // DB 查詢失敗時不阻擋掃描，降級放行
    return next();
  }
}

module.exports = { scanLimit };
