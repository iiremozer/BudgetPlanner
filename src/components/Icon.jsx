// Emoji her platformda başka türlü çizildiği için uygulama derme çatma
// görünüyordu. Bunlar tek elden çizilmiş, aynı kalınlıkta, aynı köşe
// yuvarlaklığında ikonlar; rengi bulunduğu yerden alırlar.

const PATHS = {
  target: (
    <>
      <circle cx="12" cy="12" r="8.2" />
      <circle cx="12" cy="12" r="4.4" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  beach: (
    <>
      <path d="M3.4 12.2a8.6 8.6 0 0 1 17.2 0z" />
      <path d="M12 12.2v7.4" />
      <path d="M12 19.6a2.2 2.2 0 0 0 3.1.5" />
    </>
  ),
  house: (
    <>
      <path d="M3.4 10.8 12 3.6l8.6 7.2" />
      <path d="M5.6 9.6v10.8h12.8V9.6" />
      <path d="M10 20.4v-5.3h4v5.3" />
    </>
  ),
  car: (
    <>
      <path d="M4.4 15.6 6 10.6a2.2 2.2 0 0 1 2.1-1.5h7.8a2.2 2.2 0 0 1 2.1 1.5l1.6 5" />
      <path d="M3.4 15.6h17.2v3.1H3.4z" />
      <circle cx="7.6" cy="18.7" r="1.5" />
      <circle cx="16.4" cy="18.7" r="1.5" />
    </>
  ),
  books: (
    <>
      <rect x="4" y="5.2" width="4.2" height="13.6" rx="1" />
      <rect x="9.4" y="5.2" width="4.2" height="13.6" rx="1" />
      <path d="m15.4 6.6 3.9 1-2.6 12.1-3.9-1z" />
    </>
  ),
  gift: (
    <>
      <rect x="3.6" y="10.2" width="16.8" height="9.8" rx="1.6" />
      <path d="M12 10.2V20M3.6 14.4h16.8" />
      <path d="M12 10.2c-3.4 0-5-1.1-5-2.5s2.9-2.4 5 2.5zM12 10.2c3.4 0 5-1.1 5-2.5s-2.9-2.4-5 2.5z" />
    </>
  ),
  plane: <path d="M20.8 4.2 3.6 11l6.7 2.4 2.4 6.7z" />,
  plant: (
    <>
      <path d="M7.2 14.6h9.6l-1.2 5.8H8.4z" />
      <path d="M12 14.6c0-4-2.4-6-5-6.6 0 3.1 1.8 6.1 5 6.6z" />
      <path d="M12 14.6c0-3.3 2-5 4.2-5.5 0 2.6-1.5 5.1-4.2 5.5z" />
    </>
  ),
  coffee: (
    <>
      <path d="M4.6 8.8h10.8v5.4a5.4 5.4 0 0 1-10.8 0z" />
      <path d="M15.4 9.8h1.8a2.6 2.6 0 0 1 0 5.2h-1.8" />
      <path d="M3.4 19.6h13.2" />
      <path d="M8.2 5.6c.7-.8.7-1.6 0-2.4M11.8 5.6c.7-.8.7-1.6 0-2.4" />
    </>
  ),
  burger: (
    <>
      <path d="M3.8 10.4a8.2 4.8 0 0 1 16.4 0z" />
      <path d="M3.8 13.2h16.4M4.4 15.8h15.2" />
      <path d="M3.8 18a8.2 3.2 0 0 0 16.4 0z" />
    </>
  ),
  box: (
    <>
      <path d="M3.6 7.6 12 4l8.4 3.6v9L12 20.2l-8.4-3.6z" />
      <path d="M12 11.2v9M3.6 7.6 12 11.2l8.4-3.6" />
    </>
  ),
  taxi: (
    <>
      <rect x="9.6" y="3.6" width="4.8" height="2.6" rx="0.8" />
      <path d="M4.4 15.6 6 11a2.2 2.2 0 0 1 2.1-1.5h7.8a2.2 2.2 0 0 1 2.1 1.5l1.6 4.6" />
      <path d="M3.4 15.6h17.2v3.1H3.4z" />
      <circle cx="7.6" cy="18.7" r="1.5" />
      <circle cx="16.4" cy="18.7" r="1.5" />
    </>
  ),
  beer: (
    <>
      <path d="M6 8h9v11.4a1.6 1.6 0 0 1-1.6 1.6H7.6A1.6 1.6 0 0 1 6 19.4z" />
      <path d="M15 10.6h2.4a2.1 2.1 0 0 1 0 4.6H15" />
      <path d="M6 11.2h9" />
      <path d="M6 8a2.6 2.6 0 0 1 4.5-2 2.6 2.6 0 0 1 4.5 2" />
    </>
  ),
  snack: (
    <>
      <rect x="5" y="4.6" width="14" height="14.8" rx="1.6" />
      <path d="M9.7 4.6v14.8M14.3 4.6v14.8M5 9.5h14M5 14.5h14" />
    </>
  ),
  bag: (
    <>
      <path d="M5.6 8.6h12.8l1 11H4.6z" />
      <path d="M9 8.6V6.4a3 3 0 0 1 6 0v2.2" />
    </>
  ),
  screen: (
    <>
      <rect x="3.2" y="5" width="17.6" height="11.6" rx="2" />
      <path d="M8.4 20h7.2M12 16.6V20" />
    </>
  ),
  coins: (
    <>
      <ellipse cx="12" cy="7" rx="7.4" ry="3.1" />
      <path d="M4.6 7v5.2c0 1.7 3.3 3.1 7.4 3.1s7.4-1.4 7.4-3.1V7" />
      <path d="M4.6 12.2v4.8c0 1.7 3.3 3.1 7.4 3.1s7.4-1.4 7.4-3.1v-4.8" />
    </>
  ),
};

export const ICON_NAMES = Object.keys(PATHS);

export default function Icon({ name, size = 22, strokeWidth = 1.7, className }) {
  const shape = PATHS[name] ?? PATHS.coins;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {shape}
    </svg>
  );
}
