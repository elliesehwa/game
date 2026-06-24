<?php
/**
 * Plugin Name: Daily Membership Content
 * Description: 매일 자동 콘텐츠 생성 + 멤버십 접근 제어 플러그인
 * Version: 1.0.0
 * Text Domain: daily-membership
 */

if (!defined('ABSPATH')) exit;

class DailyMembershipContent {

    private $levels = ['free' => 0, 'basic' => 1, 'premium' => 2, 'vip' => 3];

    public function __construct() {
        add_action('init', [$this, 'register_post_type']);
        add_action('wp', [$this, 'schedule_daily_content']);
        add_action('dmc_create_daily', [$this, 'create_daily_content']);
        add_filter('the_content', [$this, 'restrict_content']);
        add_action('add_meta_boxes', [$this, 'add_membership_metabox']);
        add_action('save_post', [$this, 'save_membership_meta']);
        add_shortcode('members_only', [$this, 'members_only_shortcode']);
        add_shortcode('daily_feed', [$this, 'daily_feed_shortcode']);
        add_shortcode('membership_status', [$this, 'membership_status_shortcode']);
        add_action('admin_menu', [$this, 'add_admin_menu']);
        register_activation_hook(__FILE__, [$this, 'activate']);
        register_deactivation_hook(__FILE__, [$this, 'deactivate']);
    }

    public function register_post_type() {
        register_post_type('daily_content', [
            'labels' => [
                'name'          => '데일리 콘텐츠',
                'singular_name' => '데일리 콘텐츠',
                'add_new'       => '새 콘텐츠 추가',
                'add_new_item'  => '새 데일리 콘텐츠 추가',
                'edit_item'     => '콘텐츠 편집',
            ],
            'public'       => true,
            'has_archive'  => true,
            'show_in_rest' => true,
            'menu_icon'    => 'dashicons-calendar-alt',
            'supports'     => ['title', 'editor', 'thumbnail', 'excerpt', 'custom-fields'],
            'rewrite'      => ['slug' => 'daily'],
        ]);
    }

    public function schedule_daily_content() {
        if (!wp_next_scheduled('dmc_create_daily')) {
            wp_schedule_event(
                strtotime('tomorrow 09:00:00'),
                'daily',
                'dmc_create_daily'
            );
        }
    }

    public function create_daily_content() {
        $today = current_time('Y-m-d');

        $existing = get_posts([
            'post_type'  => 'daily_content',
            'meta_key'   => '_daily_date',
            'meta_value' => $today,
            'numberposts' => 1,
        ]);

        if (!empty($existing)) return;

        $templates = get_option('dmc_templates', []);
        $day_of_week = current_time('N');
        $day_of_year = current_time('z');

        $title = sprintf('%s 오늘의 콘텐츠', current_time('Y년 m월 d일'));
        $content = '';

        if (!empty($templates)) {
            $template = $templates[$day_of_year % count($templates)];
            $title = str_replace('{date}', current_time('Y년 m월 d일'), $template['title'] ?? $title);
            $content = $template['content'] ?? '';
        }

        $post_id = wp_insert_post([
            'post_title'   => $title,
            'post_content' => $content,
            'post_status'  => 'publish',
            'post_type'    => 'daily_content',
            'post_author'  => 1,
        ]);

        if ($post_id && !is_wp_error($post_id)) {
            update_post_meta($post_id, '_daily_date', $today);
            update_post_meta($post_id, '_membership_level', 'basic');
            do_action('dmc_after_daily_created', $post_id, $today);
        }
    }

    public function restrict_content($content) {
        if (is_admin() || !is_singular()) return $content;

        global $post;
        $required = get_post_meta($post->ID, '_membership_level', true);
        if (!$required || $required === 'free') return $content;

        if (!is_user_logged_in()) {
            return $this->gate_message(
                '회원 전용 콘텐츠',
                '이 콘텐츠를 보려면 로그인이 필요합니다.',
                wp_login_url(get_permalink()),
                '로그인'
            );
        }

        $user_level = get_user_meta(get_current_user_id(), 'membership_level', true) ?: 'free';
        if (($this->levels[$user_level] ?? 0) < ($this->levels[$required] ?? 0)) {
            $level_names = ['basic' => '베이직', 'premium' => '프리미엄', 'vip' => 'VIP'];
            return $this->gate_message(
                '상위 멤버십 필요',
                ($level_names[$required] ?? $required) . ' 등급 이상 회원만 열람할 수 있습니다.',
                home_url('/membership'),
                '멤버십 업그레이드'
            );
        }

        return $content;
    }

    private function gate_message($title, $desc, $url, $button_text) {
        return sprintf(
            '<div style="text-align:center;padding:40px 20px;background:#f8f9fa;border-radius:12px;margin:20px 0;">
                <h3 style="margin-bottom:10px;">🔒 %s</h3>
                <p style="color:#666;margin-bottom:20px;">%s</p>
                <a href="%s" style="display:inline-block;padding:12px 30px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">%s</a>
            </div>',
            esc_html($title),
            esc_html($desc),
            esc_url($url),
            esc_html($button_text)
        );
    }

    public function add_membership_metabox() {
        add_meta_box(
            'membership_level_box',
            '멤버십 접근 설정',
            [$this, 'render_membership_metabox'],
            ['post', 'page', 'daily_content'],
            'side',
            'high'
        );
    }

    public function render_membership_metabox($post) {
        $current = get_post_meta($post->ID, '_membership_level', true) ?: 'free';
        wp_nonce_field('dmc_membership_nonce', 'dmc_nonce');
        echo '<select name="membership_level" style="width:100%;padding:6px;">';
        $options = ['free' => '무료 (전체 공개)', 'basic' => '베이직 이상', 'premium' => '프리미엄 이상', 'vip' => 'VIP 전용'];
        foreach ($options as $value => $label) {
            printf('<option value="%s"%s>%s</option>', $value, selected($current, $value, false), $label);
        }
        echo '</select>';
        echo '<p style="margin-top:8px;color:#666;font-size:12px;">이 콘텐츠를 볼 수 있는 최소 멤버십 등급을 선택하세요.</p>';
    }

    public function save_membership_meta($post_id) {
        if (!isset($_POST['dmc_nonce']) || !wp_verify_nonce($_POST['dmc_nonce'], 'dmc_membership_nonce')) return;
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;
        if (!current_user_can('edit_post', $post_id)) return;

        if (isset($_POST['membership_level'])) {
            $allowed = array_keys($this->levels);
            $level = sanitize_text_field($_POST['membership_level']);
            if (in_array($level, $allowed, true)) {
                update_post_meta($post_id, '_membership_level', $level);
            }
        }
    }

    public function members_only_shortcode($atts, $content = null) {
        $atts = shortcode_atts(['level' => 'basic'], $atts);

        if (!is_user_logged_in()) {
            return '<p style="padding:16px;background:#fff3cd;border-radius:8px;text-align:center;">🔒 회원 전용 콘텐츠입니다. <a href="' . esc_url(wp_login_url(get_permalink())) . '">로그인</a>하세요.</p>';
        }

        $user_level = get_user_meta(get_current_user_id(), 'membership_level', true) ?: 'free';
        if (($this->levels[$user_level] ?? 0) >= ($this->levels[$atts['level']] ?? 0)) {
            return do_shortcode($content);
        }

        return '<p style="padding:16px;background:#fff3cd;border-radius:8px;text-align:center;">🔒 ' . esc_html($atts['level']) . ' 등급 이상 전용 콘텐츠입니다.</p>';
    }

    public function daily_feed_shortcode($atts) {
        $atts = shortcode_atts(['count' => 10], $atts);
        $posts = get_posts([
            'post_type'   => 'daily_content',
            'numberposts' => intval($atts['count']),
            'orderby'     => 'date',
            'order'       => 'DESC',
        ]);

        if (empty($posts)) return '<p>아직 콘텐츠가 없습니다.</p>';

        $html = '<div style="display:grid;gap:16px;">';
        foreach ($posts as $p) {
            $level = get_post_meta($p->ID, '_membership_level', true) ?: 'free';
            $badge = '';
            if ($level !== 'free') {
                $colors = ['basic' => '#2563eb', 'premium' => '#7c3aed', 'vip' => '#dc2626'];
                $badge = sprintf(' <span style="background:%s;color:white;padding:2px 8px;border-radius:4px;font-size:11px;">%s</span>', $colors[$level] ?? '#666', strtoupper($level));
            }
            $html .= sprintf(
                '<a href="%s" style="display:block;padding:16px;background:white;border-radius:8px;text-decoration:none;color:inherit;border:1px solid #e2e8f0;transition:box-shadow 0.2s;">
                    <div style="font-size:12px;color:#64748b;">%s</div>
                    <div style="font-size:16px;font-weight:700;margin-top:4px;">%s%s</div>
                    <div style="font-size:13px;color:#64748b;margin-top:6px;">%s</div>
                </a>',
                esc_url(get_permalink($p)),
                esc_html(get_the_date('Y.m.d', $p)),
                esc_html($p->post_title),
                $badge,
                esc_html(wp_trim_words($p->post_excerpt ?: $p->post_content, 30))
            );
        }
        $html .= '</div>';
        return $html;
    }

    public function membership_status_shortcode() {
        if (!is_user_logged_in()) {
            return '<p>로그인 후 멤버십 상태를 확인할 수 있습니다.</p>';
        }

        $user = wp_get_current_user();
        $level = get_user_meta($user->ID, 'membership_level', true) ?: 'free';
        $expiry = get_user_meta($user->ID, 'membership_expiry', true);
        $level_names = ['free' => '무료 회원', 'basic' => '베이직', 'premium' => '프리미엄', 'vip' => 'VIP'];

        $html = '<div style="padding:24px;background:white;border-radius:12px;border:1px solid #e2e8f0;">';
        $html .= '<h3 style="margin-bottom:16px;">내 멤버십 정보</h3>';
        $html .= '<p><strong>이름:</strong> ' . esc_html($user->display_name) . '</p>';
        $html .= '<p><strong>등급:</strong> ' . esc_html($level_names[$level] ?? $level) . '</p>';
        if ($expiry) {
            $html .= '<p><strong>만료일:</strong> ' . esc_html($expiry) . '</p>';
        }
        $html .= '</div>';
        return $html;
    }

    public function add_admin_menu() {
        add_menu_page(
            '멤버십 설정',
            '멤버십 관리',
            'manage_options',
            'dmc-settings',
            [$this, 'render_admin_page'],
            'dashicons-groups',
            30
        );
    }

    public function render_admin_page() {
        if (isset($_POST['dmc_save_settings']) && wp_verify_nonce($_POST['_wpnonce'], 'dmc_settings')) {
            update_option('dmc_auto_daily', sanitize_text_field($_POST['auto_daily'] ?? 'off'));
            update_option('dmc_daily_time', sanitize_text_field($_POST['daily_time'] ?? '09:00'));
            update_option('dmc_default_level', sanitize_text_field($_POST['default_level'] ?? 'basic'));
            echo '<div class="notice notice-success"><p>설정이 저장되었습니다.</p></div>';
        }

        $auto_daily = get_option('dmc_auto_daily', 'on');
        $daily_time = get_option('dmc_daily_time', '09:00');
        $default_level = get_option('dmc_default_level', 'basic');
        ?>
        <div class="wrap">
            <h1>멤버십 콘텐츠 관리</h1>
            <form method="post">
                <?php wp_nonce_field('dmc_settings'); ?>
                <table class="form-table">
                    <tr>
                        <th>매일 자동 콘텐츠 생성</th>
                        <td>
                            <select name="auto_daily">
                                <option value="on" <?php selected($auto_daily, 'on'); ?>>활성화</option>
                                <option value="off" <?php selected($auto_daily, 'off'); ?>>비활성화</option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th>일일 콘텐츠 생성 시간</th>
                        <td><input type="time" name="daily_time" value="<?php echo esc_attr($daily_time); ?>"></td>
                    </tr>
                    <tr>
                        <th>기본 멤버십 레벨</th>
                        <td>
                            <select name="default_level">
                                <option value="free" <?php selected($default_level, 'free'); ?>>무료 (전체 공개)</option>
                                <option value="basic" <?php selected($default_level, 'basic'); ?>>베이직</option>
                                <option value="premium" <?php selected($default_level, 'premium'); ?>>프리미엄</option>
                                <option value="vip" <?php selected($default_level, 'vip'); ?>>VIP</option>
                            </select>
                        </td>
                    </tr>
                </table>
                <p class="submit">
                    <input type="submit" name="dmc_save_settings" class="button-primary" value="설정 저장">
                </p>
            </form>

            <hr>
            <h2>사용 가능한 숏코드</h2>
            <table class="widefat">
                <thead>
                    <tr><th>숏코드</th><th>설명</th><th>예시</th></tr>
                </thead>
                <tbody>
                    <tr>
                        <td><code>[members_only level="premium"]</code></td>
                        <td>특정 등급 이상만 볼 수 있는 콘텐츠 영역</td>
                        <td><code>[members_only level="basic"]프리미엄 내용[/members_only]</code></td>
                    </tr>
                    <tr>
                        <td><code>[daily_feed count="10"]</code></td>
                        <td>최근 데일리 콘텐츠 목록 표시</td>
                        <td><code>[daily_feed count="5"]</code></td>
                    </tr>
                    <tr>
                        <td><code>[membership_status]</code></td>
                        <td>현재 로그인 회원의 멤버십 상태 표시</td>
                        <td><code>[membership_status]</code></td>
                    </tr>
                </tbody>
            </table>
        </div>
        <?php
    }

    public function activate() {
        $this->register_post_type();
        flush_rewrite_rules();
    }

    public function deactivate() {
        wp_clear_scheduled_hook('dmc_create_daily');
        flush_rewrite_rules();
    }
}

new DailyMembershipContent();
