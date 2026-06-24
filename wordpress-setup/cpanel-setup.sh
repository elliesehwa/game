#!/bin/bash
# =====================================================
# 워드프레스 서브도메인 cPanel 자동 설정 스크립트
# SSH 접속 후 실행: bash cpanel-setup.sh
# =====================================================

set -e

echo "=========================================="
echo " 워드프레스 서브도메인 멤버십 사이트 설정"
echo "=========================================="
echo ""

# 설정값 입력
read -p "서브도메인 이름 (예: members): " SUBDOMAIN
read -p "메인 도메인 (예: yourdomain.com): " DOMAIN
read -p "cPanel 계정명: " CPANEL_USER

SITE_DIR="/home/${CPANEL_USER}/public_html/${SUBDOMAIN}"
FULL_DOMAIN="${SUBDOMAIN}.${DOMAIN}"

echo ""
echo "설정 정보:"
echo "  서브도메인: ${FULL_DOMAIN}"
echo "  설치 경로: ${SITE_DIR}"
echo ""
read -p "계속 진행하시겠습니까? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "취소되었습니다."
    exit 0
fi

# 1. 디렉토리 생성
echo ""
echo "[1/6] 디렉토리 생성..."
mkdir -p "$SITE_DIR"
cd "$SITE_DIR"

# 2. WordPress 다운로드
echo "[2/6] WordPress 한국어 버전 다운로드..."
wget -q https://ko.wordpress.org/latest-ko_KR.tar.gz
tar -xzf latest-ko_KR.tar.gz
mv wordpress/* .
rm -rf wordpress latest-ko_KR.tar.gz

# 3. wp-config.php 생성
echo "[3/6] wp-config.php 설정..."
read -p "DB 이름: " DB_NAME
read -p "DB 사용자: " DB_USER
read -sp "DB 비밀번호: " DB_PASS
echo ""

SALT=$(curl -sS https://api.wordpress.org/secret-key/1.1/salt/)

cat > wp-config.php << WPCONFIG
<?php
define('DB_NAME', '${DB_NAME}');
define('DB_USER', '${DB_USER}');
define('DB_PASSWORD', '${DB_PASS}');
define('DB_HOST', 'localhost');
define('DB_CHARSET', 'utf8mb4');
define('DB_COLLATE', '');

${SALT}

\$table_prefix = 'wp_';

define('WPLANG', 'ko_KR');
define('WP_DEBUG', false);
define('WP_MEMORY_LIMIT', '256M');
define('WP_MAX_MEMORY_LIMIT', '512M');
define('DISALLOW_FILE_EDIT', true);
define('WP_AUTO_UPDATE_CORE', true);
define('DISABLE_WP_CRON', true);
define('WP_POST_REVISIONS', 5);

if (!defined('ABSPATH')) {
    define('ABSPATH', __DIR__ . '/');
}

require_once ABSPATH . 'wp-settings.php';
WPCONFIG

# 4. .htaccess 생성
echo "[4/6] .htaccess 설정..."
cat > .htaccess << 'HTACCESS'
# WordPress
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
RewriteBase /
RewriteRule ^index\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]
</IfModule>

# Security
<Files wp-config.php>
Order Allow,Deny
Deny from all
</Files>

<Files .htaccess>
Order Allow,Deny
Deny from all
</Files>

# Disable directory browsing
Options -Indexes

# Block access to sensitive files
<FilesMatch "^(wp-config\.php|readme\.html|license\.txt)$">
Order Allow,Deny
Deny from all
</FilesMatch>

# Cache static assets
<IfModule mod_expires.c>
ExpiresActive On
ExpiresByType image/jpg "access plus 1 month"
ExpiresByType image/jpeg "access plus 1 month"
ExpiresByType image/gif "access plus 1 month"
ExpiresByType image/png "access plus 1 month"
ExpiresByType image/webp "access plus 1 month"
ExpiresByType text/css "access plus 1 month"
ExpiresByType application/javascript "access plus 1 month"
</IfModule>

# GZIP Compression
<IfModule mod_deflate.c>
AddOutputFilterByType DEFLATE text/plain
AddOutputFilterByType DEFLATE text/html
AddOutputFilterByType DEFLATE text/xml
AddOutputFilterByType DEFLATE text/css
AddOutputFilterByType DEFLATE application/xml
AddOutputFilterByType DEFLATE application/xhtml+xml
AddOutputFilterByType DEFLATE application/rss+xml
AddOutputFilterByType DEFLATE application/javascript
AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
HTACCESS

# 5. 권한 설정
echo "[5/6] 파일 권한 설정..."
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
chmod 600 wp-config.php

# 6. 플러그인 복사
echo "[6/6] 멤버십 플러그인 설치..."
PLUGIN_DIR="${SITE_DIR}/wp-content/plugins/daily-membership-content"
mkdir -p "$PLUGIN_DIR"

echo ""
echo "=========================================="
echo " 설치 완료!"
echo "=========================================="
echo ""
echo " 다음 단계:"
echo ""
echo " 1. cPanel에서 서브도메인 생성:"
echo "    도메인: ${FULL_DOMAIN}"
echo "    경로:   ${SITE_DIR}"
echo ""
echo " 2. SSL 인증서 발급:"
echo "    cPanel > SSL/TLS > Let's Encrypt"
echo ""
echo " 3. WordPress 설치 완료:"
echo "    https://${FULL_DOMAIN}/wp-admin/install.php"
echo ""
echo " 4. cPanel Cron Job 추가:"
echo "    */15 * * * * /usr/local/bin/php ${SITE_DIR}/wp-cron.php"
echo ""
echo " 5. 플러그인 파일 복사:"
echo "    daily-membership-content.php를"
echo "    ${PLUGIN_DIR}/ 에 업로드"
echo ""
echo "=========================================="
