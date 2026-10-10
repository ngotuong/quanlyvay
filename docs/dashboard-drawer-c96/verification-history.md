# C96 — Lịch sử kiểm chứng

Các lượt lỗi được giữ ở ignored `.cache/c96/`, không coi chúng là PASS.

1. Baseline source82151b6:1PASS1.3m. Production Chromium local, bốn samples375/1280×LightDark,
   warm browser cache;1click/1route transition. JS decoded initial512865/open570270,
   delta57405bytes mỗi sample; elapsed846–869ms local, không suy Production.
2. Lint/typecheck lượt đầu FAIL: ref update during render và VndText import từ barrel chưa export.
   Đổi thành layout effect/import đường component; lượt tiếp theo PASS. Unit121PASS0FAIL.
3. Targeted1:3PASS3FAIL4.1m. Dirty Back bị hashchange bypass global guard và restore thành default;
   bỏ subscription hashchange, giữ popstate guarded. Hai lỗi harness: nhãn VIEWER sai và
   dispatch submit ngay sau history traversal đang restore; source sửa đồng thời history race,
   giữ duplicate-submit assertion. Rapid selection dùng snapshot URL thực thay closure cũ.
4. Targeted2+probe:6PASS1FAIL4.2m. Draft/Back/Forward/abort/stale/readretry/timeout/rapid/VIEWER/privacy
   và partial/pending/idempotency/KPI đạt. Assertion task biến mất dùng overpay số dư hôm nay,
   nhưng task là số dư projection cuối kỳ; đổi fixture amount sang task projected authoritative
   cộng1000, assert final balance theo actual ledger, không sửa engine hoặc assertion nghiệp vụ.
5. Probe2 rawLightP2 từ tiền phía Dashboard/tooltip sau exploratory submit default, được giữ;
   tool có thể bấm submit khi amount códefault. Adapter kế tiếp clear ô required trước exploration
   như C95 để native validation ngăn financial submit. Không sửa measurement rules;
   context/suggestion vẫn là dữ liệu server. Raw warnings focus/native picker/hover/density giữ.

6. Targeted3+probe:6PASS1FAIL4.4m. Task đã biến mất đúng sau advance đủ projected amount,
   nhưng focus về trigger cũ trước RSC commit làm mất focus khi node bị gỡ. Source dùng rAF
   sau native dialog cleanup, resolve trigger hiện hành và bounded observer chỉ phục hồi nếu
   returned node bị gỡ/focus về body; không lấy focus khỏi control khác.
7. Targeted4+probe:7PASS0FAIL3.5m trên140websrc finalfreeze. Transport mutation retry giữ
   draft/key,actualpartial/advance1POST1transaction/replay/KPI/task/focusfallback đạt.
   RawLight/DarkP3 mỗi theme được giữ:2tooltip spans opacity0 và body preparedfocus scroll1px.
8. Fullgate source cuối:79PASS18SKIP0FAIL15.5m,retries0;6C96 đạt. Thêm exact375×812
   Light/Dark initialscroll0/preparedfocus188px,18matrix states; toast/save/reset/focus assertions đạt.
   Lint/typecheck/unit121/rootbuild19PASS;source140hashes giữ qua gates.
9. Preservation:1207before/10scopechanged/1197unchanged,73financialprotected giữ,17C75exact/
   15generatedrestored,C20-test55322/sixcounts0. Artifact8PNG/HTTP/links/script và redactedsecret0 đạt.
Không thay assertions/timeout/retry/skip của E2E hiện hữu. Full server log từng có
“destination stream closed early” như baseline C94/C95, giữ rõ, không chứng nhận runtimeerrors0 toànapp.
