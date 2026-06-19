type BrandMarkProps = {
  className?: string;
  label?: string;
};

export function BrandMark({ className = "h-10 w-10", label = "Avtolink.uz" }: BrandMarkProps) {
  return (
    <svg className={className} viewBox="0 0 128 128" role="img" aria-label={label}>
      <defs>
        <linearGradient id="avtolink-mark-bg" x1="18" x2="110" y1="12" y2="116" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0EA5A0" />
          <stop offset="0.58" stopColor="#08746F" />
          <stop offset="1" stopColor="#102A2A" />
        </linearGradient>
        <linearGradient id="avtolink-mark-accent" x1="36" x2="96" y1="36" y2="96" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C7FFF5" />
          <stop offset="1" stopColor="#FFFFFF" />
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="30" fill="url(#avtolink-mark-bg)" />
      <path
        d="M33 85 55 33c3.4-8 14.6-8 18 0l22 52"
        fill="none"
        stroke="url(#avtolink-mark-accent)"
        strokeLinecap="round"
        strokeWidth="13"
      />
      <path d="M50 70h28" stroke="#B7FFF2" strokeLinecap="round" strokeWidth="9" />
      <path d="M83 42h12c7 0 12 5 12 12v8" fill="none" stroke="#F97316" strokeLinecap="round" strokeWidth="7" />
      <path d="M103 62h9" stroke="#F97316" strokeLinecap="round" strokeWidth="7" />
      <path d="M33 92h62l-6 12H39l-6-12Z" fill="#F8FAFC" opacity="0.96" />
      <circle cx="48" cy="101" r="5" fill="#102A2A" />
      <circle cx="80" cy="101" r="5" fill="#102A2A" />
    </svg>
  );
}
