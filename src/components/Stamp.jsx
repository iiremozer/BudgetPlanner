import { formatMoney } from '../lib/money.js';

export default function Stamp({ amount, currency, at }) {
  const date = new Date(at);
  const stampDate = `${String(date.getDate()).padStart(2, '0')}.${String(
    date.getMonth() + 1
  ).padStart(2, '0')}.${date.getFullYear()}`;

  return (
    <div className="stamp-layer" aria-hidden="true">
      <div className="stamp-mark">
        <span>
          <span className="stamp-word">İşlendi</span>
          <span className="stamp-amount">+{formatMoney(amount, currency)}</span>
          <span className="stamp-date">{stampDate}</span>
        </span>
      </div>
    </div>
  );
}
