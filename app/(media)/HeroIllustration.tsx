// トップページのヒーロー用イラスト。
// 実在の犬・人物の写真は許諾の問題があるため、サイト配色に合わせたオリジナルSVGで表現する。
export default function HeroIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 260 210"
      className={className}
      role="img"
      aria-label="トリミングされたふわふわの犬のイラスト"
    >
      {/* 背景の丸 */}
      <circle cx="130" cy="112" r="88" fill="#fef3c7" />

      {/* 左上のハート */}
      <path
        d="M46 42c-4-6-14-5-15 3-1 6 7 12 15 17 8-5 16-11 15-17-1-8-11-9-15-3z"
        fill="#f9a8d4"
      />

      {/* 右上のハサミ */}
      <g stroke="#b45309" strokeWidth="4" strokeLinecap="round" fill="none">
        <line x1="196" y1="34" x2="224" y2="62" />
        <line x1="224" y1="34" x2="196" y2="62" />
      </g>
      <circle cx="192" cy="30" r="7" fill="none" stroke="#b45309" strokeWidth="4" />
      <circle cx="228" cy="30" r="7" fill="none" stroke="#b45309" strokeWidth="4" />

      {/* きらきら */}
      <path d="M38 120l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#fbbf24" />
      <path d="M222 128l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" fill="#fbbf24" />

      {/* 耳(たれ耳) */}
      <ellipse cx="78" cy="118" rx="22" ry="36" fill="#d9a05b" transform="rotate(14 78 118)" />
      <ellipse cx="182" cy="118" rx="22" ry="36" fill="#d9a05b" transform="rotate(-14 182 118)" />

      {/* 頭のふわふわ(輪郭) */}
      <circle cx="100" cy="76" r="20" fill="#f7e3bd" />
      <circle cx="130" cy="68" r="22" fill="#f7e3bd" />
      <circle cx="160" cy="76" r="20" fill="#f7e3bd" />
      <circle cx="88" cy="102" r="18" fill="#f7e3bd" />
      <circle cx="172" cy="102" r="18" fill="#f7e3bd" />

      {/* 顔 */}
      <circle cx="130" cy="112" r="52" fill="#f7e3bd" />

      {/* リボン */}
      <g transform="translate(130 58)">
        <path d="M0 0l-14-9v18z" fill="#ef8fb4" />
        <path d="M0 0l14-9v18z" fill="#ef8fb4" />
        <circle cx="0" cy="0" r="5" fill="#e0679a" />
      </g>

      {/* 目(にっこり) */}
      <path d="M106 106q6-9 12 0" stroke="#513a1f" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M142 106q6-9 12 0" stroke="#513a1f" strokeWidth="4" strokeLinecap="round" fill="none" />

      {/* ほっぺ */}
      <ellipse cx="98" cy="124" rx="9" ry="6" fill="#f9c6d3" />
      <ellipse cx="162" cy="124" rx="9" ry="6" fill="#f9c6d3" />

      {/* マズル */}
      <ellipse cx="130" cy="132" rx="22" ry="17" fill="#fdf3df" />
      <path d="M124 126a6 5 0 0 1 12 0q0 5-6 7-6-2-6-7z" fill="#513a1f" />
      <path d="M130 133v6" stroke="#513a1f" strokeWidth="3" strokeLinecap="round" />
      <path d="M130 139q-6 6-12 2M130 139q6 6 12 2" stroke="#513a1f" strokeWidth="3" strokeLinecap="round" fill="none" />

      {/* 舌 */}
      <path d="M124 146q6 8 12 0v-4h-12z" fill="#f28cab" />

      {/* 足あと */}
      <g fill="#d97706" opacity="0.55">
        <g transform="translate(44 178)">
          <ellipse cx="0" cy="4" rx="7" ry="6" />
          <circle cx="-8" cy="-4" r="3" />
          <circle cx="-2.5" cy="-7" r="3" />
          <circle cx="4" cy="-6" r="3" />
        </g>
        <g transform="translate(206 182)">
          <ellipse cx="0" cy="4" rx="7" ry="6" />
          <circle cx="-8" cy="-4" r="3" />
          <circle cx="-2.5" cy="-7" r="3" />
          <circle cx="4" cy="-6" r="3" />
        </g>
      </g>
    </svg>
  );
}
