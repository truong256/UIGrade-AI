#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 UIGrade AI contributors
# SPDX-License-Identifier: MIT

set -euo pipefail

failure=0

check_absent() {
  local description="$1"
  local pattern="$2"
  shift 2
  if rg -n --pcre2 "$pattern" "$@"; then
    echo "[FAIL] ${description}" >&2
    failure=1
  else
    echo "[OK] ${description}"
  fi
}

check_absent "Không có callback rỗng/TODO runtime" \
  'onClick\s*=\s*\{\s*\}|onValueChange\s*=\s*\{\s*\}|clickable\s*\{\s*\}|TODO\(|NotImplementedError|UnsupportedOperationException' \
  app/src

check_absent "Không ép null bằng !! trong production Kotlin" '!!' app/src/main/java

check_absent "Không có coroutine/blocking nguy hiểm" \
  'GlobalScope|runBlocking\s*\{|Thread\.sleep\s*\(' app/src/main/java

check_absent "Repository demo không tạo độ trễ mạng giả" \
  '\bdelay\s*\(' app/src/main/java/com/uigrade/ai/data/repository

check_absent "Không có đường dẫn SDK cá nhân trong code/script" \
  'C:\\Users\\[^%]|/Users/[^$]|/home/[^$]' app run_app.bat build.gradle.kts settings.gradle.kts

check_absent "Không có mẫu secret phổ biến" \
  'sk-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{30,}|-----BEGIN (RSA |EC )?PRIVATE KEY-----|SUPABASE_SERVICE_ROLE_KEY\s*=' \
  app gradle.properties build.gradle.kts settings.gradle.kts

if (( failure != 0 )); then
  exit 1
fi

echo "Static project quality checks passed."
