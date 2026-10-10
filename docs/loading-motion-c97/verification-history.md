# C97 — Lịch sử verification

1. Baseline source1b54be1: lần1 FAIL do kỳ vọng globalpending còn hiện sau cached/committed
   navigation; không phải assertion sản phẩm được sửa. Lần2 chưa chạy vì server3101 của lần1
   còn teardown. Lần3 giữ thông tin loadingObserved thay vì bắt pending ở mọi lần;1PASS1.6m,
   36content samples/4actualstreamedloading. Rawtrace/log ở ignored.cache/c97.
2. Targeted1:2PASS2FAIL5.6m. Matrix dừng ở linkExpenses do hai dialogMore trong DOM, locator
   chưa chọn[open]. ColdAuthfont và drawer2/10s/errorretry/abort PASS. Motion lấy grabbercoords
   khi enter/snapback chưa ổn định, gesture kế tiếp chạm backdrop trước códraft và đóng sheet.
   Sửa harness chờ animation/transform kết thúc, dùng realreleasePointerCapture;4prompts giữ,
   không đổi threshold/assertions/timeout/retries. Captureloss runtime vẫn reset/cancel.
3. Targeted2+visual:4PASS1FAIL6.4m.36route samples/4coldAuthfont/12drawerread/error/gesture/native
   details/reducedmotion PASS; probe7widths×2theme chạy được, rawP1 preparedfocus-scroll giữ.
   Video fail thiếu PlaywrightFFmpeg1011; không gọi toàngate PASS. CóFFmpeg hệ thống đã kiểm,
   dùng shim symlink ở.cache/c97/pw, không sửa dependency/globalcache. Sửa focusHủy trước
   loading→form trong runtime và bổ sung12focus assertions; nguyênthresholdCLS≤0.1/geometry giữ.
4. Review hình sau lượt2: loanplaceholder generic2lines chưa giống thẻ405pxmobile/161pxdesktop.
   Bổ sungidentity/tags/metadata/values/action placeholders, reservefilter176/184px; headeraction
   placeholderariahidden, khôngfakecontrols. Settings/theme/account và taskrows cóvùng tươngứng,
   chartcloseddisclosure khôngfake3tableRowsđangmở. Không đổi hình loadeddata/permissions.
5. Targeted3+visual:6PASS0FAIL7.0m, source153filesfrozen; testpendingdrag/Escape bịchặn và
   networkmutationerror giữdraft, transactioncountkhôngđổi. Probe hai theme và4video đã chạy.
6. Full1:83PASS18SKIP1FAIL18.7m. C78 gặp strict mode: streamed fallback và loaded Dashboard
   cùng có `.dashboard-primary-metrics` trong DOM. Không sửa C78 assertion/timeout; tách selector
   loading-metrics/loading-focus-grid và dành CSS riêng cho cấu trúc fallback. Nội dung loaded
   không đổi. Rawtrace/log giữ ở.cache/c97/full-failure1 vàfull-e2e-attempt1.log.
7. Targeted4+visual source sau sửa:6PASS0FAIL7.0m; full2:84PASS18SKIP0FAIL19.2m,retries0.
   Fullsource tách selector, không sửa assertion/timeout/retry/skip hiện hữu.

Không giảm hoặc đổi assertions/timeout/retry/skip hiện hữu; chỉ thêmC97tests. Không biến rawfailed
runs thànhPASS, không retryblind. Phone/AT/networkPWA-beforeHTML/remote save NOT_TESTED.

8. Observer bổ sung liên tục trước navigation/action hoặc coldinit:3PASS0FAIL5.4m,53observations;
   rawentry/sourceRects/hadRecentInput giữ; whole-window route/Auth/drawer CLS≤.1. Cùng153sourcefreeze,
   không sửa runtime/gate hiện hữu. Một observation read-error nằm trong drawer test nên tổng53,
   không phải52 (36+4+12 cộng1errorretryabort). Bằng chứng riêng window-evidence.json.
