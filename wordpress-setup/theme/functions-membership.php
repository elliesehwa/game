<?php
/**
 * 멤버십 사이트 테마 기능 확장
 * 기존 테마의 functions.php에 require_once로 포함하세요:
 * require_once get_template_directory() . '/functions-membership.php';
 */

if (!defined('ABSPATH')) exit;

// ============================================
// 1. 멤버십 사용자 등록 시 기본 레벨 설정
// ============================================
add_action('user_register', function($user_id) {
    update_user_meta($user_id, 'membership_level', 'free');
    update_user_meta($user_id, 'membership_start', current_time('Y-m-d'));
});

// ============================================
// 2. 커스텀 로그인/회원가입 페이지 리디렉트
// ============================================
add_action('template_redirect', function() {
    if (is_page('dashboard') && !is_user_logged_in()) {
        wp_redirect(wp_login_url(get_permalink()));
        exit;
    }
});

add_filter('login_redirect', function($redirect_to, $request, $user) {
    if (isset($user->roles) && is_array($user->roles)) {
        if (in_array('administrator', $user->roles)) {
            return admin_url();
        }
        return home_url('/dashboard');
    }
    return $redirect_to;
}, 10, 3);

// ============================================
// 3. 회원 대시보드 위젯
// ============================================
add_shortcode('member_dashboard', function() {
    if (!is_user_logged_in()) {
        return '<p>로그인 후 이용 가능합니다.</p>';
    }

    $user = wp_get_current_user();
    $level = get_user_meta($user->ID, 'membership_level', true) ?: 'free';
    $level_names = ['free' => '무료', 'basic' => '베이직', 'premium' => '프리미엄', 'vip' => 'VIP'];
    $level_colors = ['free' => '#6b7280', 'basic' => '#2563eb', 'premium' => '#7c3aed', 'vip' => '#dc2626'];

    $daily_posts = get_posts([
        'post_type'   => 'daily_content',
        'numberposts' => 5,
        'orderby'     => 'date',
        'order'       => 'DESC',
    ]);

    ob_start();
    ?>
    <div style="max-width:800px;margin:0 auto;">
        <div style="background:white;border-radius:16px;padding:24px;margin-bottom:20px;border:1px solid #e2e8f0;">
            <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px;">
                <div style="width:60px;height:60px;border-radius:50%;background:<?php echo esc_attr($level_colors[$level]); ?>;display:flex;align-items:center;justify-content:center;color:white;font-size:24px;font-weight:900;">
                    <?php echo esc_html(mb_substr($user->display_name, 0, 1)); ?>
                </div>
                <div>
                    <h2 style="margin:0;font-size:20px;"><?php echo esc_html($user->display_name); ?>님</h2>
                    <span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;color:white;background:<?php echo esc_attr($level_colors[$level]); ?>;">
                        <?php echo esc_html($level_names[$level]); ?> 멤버
                    </span>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;">
                <div style="padding:16px;background:#f8fafc;border-radius:8px;text-align:center;">
                    <div style="font-size:12px;color:#64748b;">가입일</div>
                    <div style="font-size:16px;font-weight:700;"><?php echo esc_html(get_user_meta($user->ID, 'membership_start', true) ?: '-'); ?></div>
                </div>
                <div style="padding:16px;background:#f8fafc;border-radius:8px;text-align:center;">
                    <div style="font-size:12px;color:#64748b;">등급</div>
                    <div style="font-size:16px;font-weight:700;"><?php echo esc_html($level_names[$level]); ?></div>
                </div>
                <div style="padding:16px;background:#f8fafc;border-radius:8px;text-align:center;">
                    <div style="font-size:12px;color:#64748b;">이메일</div>
                    <div style="font-size:14px;font-weight:700;"><?php echo esc_html($user->user_email); ?></div>
                </div>
            </div>
        </div>

        <div style="background:white;border-radius:16px;padding:24px;border:1px solid #e2e8f0;">
            <h3 style="margin-bottom:16px;">최근 데일리 콘텐츠</h3>
            <?php if (!empty($daily_posts)): ?>
                <?php foreach ($daily_posts as $p):
                    $post_level = get_post_meta($p->ID, '_membership_level', true) ?: 'free';
                    $accessible = ($this_levels[$level] ?? 0) >= ($this_levels[$post_level] ?? 0);
                ?>
                <a href="<?php echo esc_url(get_permalink($p)); ?>" style="display:flex;justify-content:space-between;align-items:center;padding:12px;border-bottom:1px solid #f1f5f9;text-decoration:none;color:inherit;">
                    <div>
                        <div style="font-size:11px;color:#94a3b8;"><?php echo esc_html(get_the_date('Y.m.d', $p)); ?></div>
                        <div style="font-weight:600;"><?php echo esc_html($p->post_title); ?></div>
                    </div>
                    <span style="font-size:20px;"><?php echo $post_level === 'free' || $accessible ? '→' : '🔒'; ?></span>
                </a>
                <?php endforeach; ?>
            <?php else: ?>
                <p style="color:#94a3b8;">아직 콘텐츠가 없습니다.</p>
            <?php endif; ?>
        </div>

        <?php if ($level === 'free'): ?>
        <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);border-radius:16px;padding:32px;margin-top:20px;text-align:center;color:white;">
            <h3 style="margin-bottom:8px;">멤버십을 업그레이드하세요</h3>
            <p style="opacity:0.9;margin-bottom:20px;">프리미엄 콘텐츠와 VIP 혜택을 이용해보세요.</p>
            <a href="<?php echo esc_url(home_url('/membership')); ?>" style="display:inline-block;padding:12px 32px;background:white;color:#2563eb;border-radius:8px;font-weight:700;text-decoration:none;">멤버십 보기</a>
        </div>
        <?php endif; ?>
    </div>
    <?php
    return ob_get_clean();
});

// ============================================
// 4. REST API - 멤버십 레벨 업데이트 엔드포인트
// ============================================
add_action('rest_api_init', function() {
    register_rest_route('dmc/v1', '/update-level', [
        'methods'  => 'POST',
        'callback' => function(WP_REST_Request $request) {
            $user_id = $request->get_param('user_id');
            $level = $request->get_param('level');

            if (!$user_id || !$level) {
                return new WP_Error('missing_params', '필수 파라미터가 누락되었습니다.', ['status' => 400]);
            }

            $allowed = ['free', 'basic', 'premium', 'vip'];
            if (!in_array($level, $allowed, true)) {
                return new WP_Error('invalid_level', '유효하지 않은 멤버십 등급입니다.', ['status' => 400]);
            }

            update_user_meta($user_id, 'membership_level', $level);
            return ['success' => true, 'user_id' => $user_id, 'level' => $level];
        },
        'permission_callback' => function() {
            return current_user_can('manage_options');
        },
    ]);
});

// ============================================
// 5. 이메일 알림 - 새 콘텐츠 발행 시
// ============================================
add_action('dmc_after_daily_created', function($post_id, $date) {
    $notify = get_option('dmc_email_notify', 'off');
    if ($notify !== 'on') return;

    $post = get_post($post_id);
    $level = get_post_meta($post_id, '_membership_level', true) ?: 'free';

    $users = get_users(['meta_key' => 'membership_level']);
    $levels = ['free' => 0, 'basic' => 1, 'premium' => 2, 'vip' => 3];

    foreach ($users as $user) {
        $user_level = get_user_meta($user->ID, 'membership_level', true) ?: 'free';
        if (($levels[$user_level] ?? 0) >= ($levels[$level] ?? 0)) {
            wp_mail(
                $user->user_email,
                sprintf('[%s] 오늘의 새 콘텐츠: %s', get_bloginfo('name'), $post->post_title),
                sprintf(
                    "%s님, 안녕하세요!\n\n새로운 콘텐츠가 등록되었습니다.\n\n제목: %s\n\n지금 확인하세요: %s",
                    $user->display_name,
                    $post->post_title,
                    get_permalink($post_id)
                )
            );
        }
    }
}, 10, 2);

// ============================================
// 6. WooCommerce 결제 완료 시 멤버십 자동 부여
// ============================================
add_action('woocommerce_order_status_completed', function($order_id) {
    $order = wc_get_order($order_id);
    if (!$order) return;

    $user_id = $order->get_user_id();
    if (!$user_id) return;

    foreach ($order->get_items() as $item) {
        $product_id = $item->get_product_id();
        $membership_level = get_post_meta($product_id, '_grant_membership_level', true);
        $membership_days = get_post_meta($product_id, '_membership_duration_days', true);

        if ($membership_level) {
            update_user_meta($user_id, 'membership_level', $membership_level);
            if ($membership_days) {
                $expiry = date('Y-m-d', strtotime("+{$membership_days} days"));
                update_user_meta($user_id, 'membership_expiry', $expiry);
            }
        }
    }
});
