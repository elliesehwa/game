<?php
/**
 * Template Name: 멤버십 플랜
 * 멤버십 가격표 및 가입 페이지 템플릿
 * 테마의 루트 디렉토리에 이 파일을 추가하세요.
 */

get_header();
?>

<style>
.membership-hero {
    background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%);
    color: white;
    padding: 60px 20px;
    text-align: center;
}
.membership-hero h1 { font-size: 36px; font-weight: 900; margin-bottom: 8px; }
.membership-hero p { font-size: 18px; opacity: 0.9; }

.plans-container {
    max-width: 1000px;
    margin: -40px auto 60px;
    padding: 0 20px;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 20px;
}

.plan-card {
    background: white;
    border-radius: 16px;
    padding: 32px 24px;
    text-align: center;
    border: 2px solid #e2e8f0;
    position: relative;
    transition: transform 0.3s, box-shadow 0.3s;
}

.plan-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.1);
}

.plan-card.featured {
    border-color: #2563eb;
    box-shadow: 0 8px 30px rgba(37, 99, 235, 0.15);
}

.plan-badge {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: #2563eb;
    color: white;
    padding: 4px 16px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
}

.plan-icon { font-size: 40px; margin-bottom: 12px; }
.plan-name { font-size: 20px; font-weight: 900; margin-bottom: 4px; }

.plan-price {
    font-size: 36px;
    font-weight: 900;
    color: #2563eb;
    margin: 16px 0;
}

.plan-price .period { font-size: 14px; font-weight: 400; color: #94a3b8; }
.plan-price .currency { font-size: 18px; }

.plan-features {
    list-style: none;
    padding: 0;
    margin: 20px 0;
    text-align: left;
}

.plan-features li {
    padding: 8px 0;
    font-size: 14px;
    border-bottom: 1px solid #f1f5f9;
    display: flex;
    align-items: center;
    gap: 8px;
}

.plan-features li::before {
    content: '✓';
    color: #059669;
    font-weight: 700;
    font-size: 16px;
}

.plan-features li.disabled {
    color: #cbd5e1;
    text-decoration: line-through;
}

.plan-features li.disabled::before {
    content: '✕';
    color: #cbd5e1;
}

.plan-btn {
    display: block;
    width: 100%;
    padding: 14px;
    border: none;
    border-radius: 10px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    text-decoration: none;
    text-align: center;
}

.plan-btn.primary {
    background: #2563eb;
    color: white;
}

.plan-btn.primary:hover { background: #1d4ed8; }

.plan-btn.outline {
    background: white;
    color: #2563eb;
    border: 2px solid #2563eb;
}

.plan-btn.outline:hover { background: #eff6ff; }

.faq-section {
    max-width: 700px;
    margin: 0 auto 60px;
    padding: 0 20px;
}

.faq-section h2 {
    text-align: center;
    font-size: 24px;
    margin-bottom: 24px;
}

.faq-item {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    margin-bottom: 10px;
    overflow: hidden;
}

.faq-question {
    padding: 16px 20px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.faq-answer {
    padding: 0 20px 16px;
    color: #64748b;
    font-size: 14px;
    line-height: 1.7;
    display: none;
}

.faq-item.active .faq-answer { display: block; }
.faq-item.active .faq-toggle { transform: rotate(45deg); }
.faq-toggle { font-size: 20px; transition: transform 0.2s; }
</style>

<div class="membership-hero">
    <h1>멤버십 플랜</h1>
    <p>당신에게 맞는 플랜을 선택하세요</p>
</div>

<div class="plans-container">

    <div class="plan-card">
        <div class="plan-icon">🆓</div>
        <div class="plan-name">무료 회원</div>
        <div class="plan-price">
            <span class="currency">₩</span>0<span class="period">/월</span>
        </div>
        <ul class="plan-features">
            <li>기본 콘텐츠 열람</li>
            <li>커뮤니티 참여</li>
            <li class="disabled">데일리 콘텐츠</li>
            <li class="disabled">프리미엄 자료</li>
            <li class="disabled">1:1 상담</li>
        </ul>
        <?php if (is_user_logged_in()): ?>
            <span class="plan-btn outline">현재 이용 중</span>
        <?php else: ?>
            <a href="<?php echo esc_url(wp_registration_url()); ?>" class="plan-btn outline">무료 가입</a>
        <?php endif; ?>
    </div>

    <div class="plan-card featured">
        <div class="plan-badge">인기</div>
        <div class="plan-icon">⭐</div>
        <div class="plan-name">베이직</div>
        <div class="plan-price">
            <span class="currency">₩</span>9,900<span class="period">/월</span>
        </div>
        <ul class="plan-features">
            <li>기본 콘텐츠 열람</li>
            <li>커뮤니티 참여</li>
            <li>데일리 콘텐츠</li>
            <li class="disabled">프리미엄 자료</li>
            <li class="disabled">1:1 상담</li>
        </ul>
        <a href="<?php echo esc_url(home_url('/checkout/?plan=basic')); ?>" class="plan-btn primary">베이직 시작</a>
    </div>

    <div class="plan-card">
        <div class="plan-icon">💎</div>
        <div class="plan-name">프리미엄</div>
        <div class="plan-price">
            <span class="currency">₩</span>29,900<span class="period">/월</span>
        </div>
        <ul class="plan-features">
            <li>기본 콘텐츠 열람</li>
            <li>커뮤니티 참여</li>
            <li>데일리 콘텐츠</li>
            <li>프리미엄 자료</li>
            <li>1:1 상담 (월 1회)</li>
        </ul>
        <a href="<?php echo esc_url(home_url('/checkout/?plan=premium')); ?>" class="plan-btn primary">프리미엄 시작</a>
    </div>

</div>

<div class="faq-section">
    <h2>자주 묻는 질문</h2>

    <div class="faq-item">
        <div class="faq-question" onclick="this.parentElement.classList.toggle('active')">
            결제는 어떻게 이루어지나요?
            <span class="faq-toggle">+</span>
        </div>
        <div class="faq-answer">
            신용카드, 계좌이체, 카카오페이, 네이버페이 등 다양한 결제 수단을 지원합니다.
            매월 동일 일자에 자동 결제되며, 언제든 해지할 수 있습니다.
        </div>
    </div>

    <div class="faq-item">
        <div class="faq-question" onclick="this.parentElement.classList.toggle('active')">
            환불이 가능한가요?
            <span class="faq-toggle">+</span>
        </div>
        <div class="faq-answer">
            결제 후 7일 이내 환불 요청 시 전액 환불됩니다.
            이후에는 남은 기간에 대한 일할 계산으로 환불됩니다.
        </div>
    </div>

    <div class="faq-item">
        <div class="faq-question" onclick="this.parentElement.classList.toggle('active')">
            플랜 변경은 어떻게 하나요?
            <span class="faq-toggle">+</span>
        </div>
        <div class="faq-answer">
            마이페이지에서 언제든 플랜을 변경할 수 있습니다.
            업그레이드 시 차액만 결제되고, 다운그레이드 시 다음 결제일부터 적용됩니다.
        </div>
    </div>

    <div class="faq-item">
        <div class="faq-question" onclick="this.parentElement.classList.toggle('active')">
            데일리 콘텐츠는 매일 언제 올라오나요?
            <span class="faq-toggle">+</span>
        </div>
        <div class="faq-answer">
            매일 오전 9시에 새로운 콘텐츠가 자동으로 게시됩니다.
            이전 콘텐츠도 모두 아카이브에서 열람 가능합니다.
        </div>
    </div>
</div>

<?php get_footer(); ?>
