# CI fail-closed

## Phạm vi

Workflow `.github/workflows/ci.yml` chạy trên pull request, push vào `main` và khi kích hoạt thủ
công. Workflow chỉ dùng dữ liệu Supabase local được dựng lại từ migration; không đọc repository
secret, environment secret, Production credential hoặc dữ liệu tài chính thật.

Các job bắt buộc:

- `Workflow policy`: kiểm tra policy nội bộ và lint cú pháp workflow bằng actionlint.
- `Quality and build`: frozen install, lint, typecheck, unit/regression test và production build.
- `Dependency and secret scan`: quét toàn bộ Git history bằng Gitleaks và chặn dependency mức High.
- `Supabase Auth pgTAP and E2E`: reset đủ migration, DB lint, pgTAP, Auth và Playwright E2E.
- `Required CI gate`: chỉ thành công khi cả bốn job trên đều `success`; job bị lỗi, hủy hoặc bỏ qua
  đều làm gate thất bại.

Concurrency tự hủy revision cũ trên cùng PR/ref. Mọi action bên ngoài được pin SHA đầy đủ; image
actionlint và Gitleaks được pin digest. Toolchain hiện khóa Node 24.15.0, pnpm 11.9.0, Supabase CLI
2.109.0 và Playwright 1.62.1.

## Kiểm tra local

```bash
pnpm install --frozen-lockfile
pnpm ci:validate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm audit --audit-level high
supabase start
supabase db reset
supabase db lint --level warning
supabase test db
pnpm test:auth
pnpm test:e2e
```

`scripts/fixtures/ci-unsafe.yml` là fixture cố ý không an toàn. Regression test phải chứng minh
policy từ chối `continue-on-error: true` và tham chiếu credential Production; fixture không chứa
credential thật và không được dùng làm workflow.

## Rollout GitHub

Hai cổng remote độc lập:

1. Sau xác nhận riêng, push commit workflow bằng fast-forward, không force-push; chờ toàn bộ workflow
   thật trên GitHub xanh và kiểm tra log không chứa secret.
2. Sau xác nhận riêng tiếp theo, bật branch protection cho `main` và đặt `Required CI gate` thành
   required check. Tạo một revision lỗi có kiểm soát trên nhánh/PR riêng để chứng minh merge bị chặn,
   rồi đóng hoặc sửa revision đó mà không đưa fixture lỗi vào `main`.

K04 chỉ hoàn tất sau cả hai cổng và hậu kiểm. K05 không được bắt đầu trước thời điểm đó.
