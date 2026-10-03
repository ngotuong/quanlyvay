// Presentation-only mockup, no network/storage/financial operation.
const trigger = document.getElementById('privacy');
const fields = [...document.querySelectorAll('[data-private-money],[data-private-name]')];
const values = fields.map(e => e.textContent);
const slot = document.getElementById('chart-slot');
const chart = slot?.firstElementChild;
let privateMode = false;
function present(hidden) {
  privateMode = hidden;
  fields.forEach((e, i) => { e.textContent = hidden ? (e.hasAttribute('data-private-money') ? '—' : 'Nội dung đang ẩn') : values[i]; });
  if (slot) slot.replaceChildren();
  if (slot && hidden) {
    const notice = document.createElement('p');
    notice.className = 'chart-private';
    notice.textContent = 'Biểu đồ đang ẩn. Hiển thị số tiền để xem lại.';
    slot.append(notice);
  } else if (slot && chart) slot.append(chart);
  trigger.setAttribute('aria-pressed', String(hidden));
  trigger.setAttribute('aria-label', hidden ? 'Hiển thị số tiền trong mockup' : 'Ẩn số tiền trong mockup');
  trigger.querySelector('.privacy-label').textContent = hidden ? 'Hiển thị số tiền' : 'Ẩn số tiền';
}
trigger.addEventListener('click', () => present(!privateMode));
if (new URLSearchParams(location.search).get('privacy') === 'hidden') present(true);
