"use client";

export default function Logo3D({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.5))" }}
    >
      {/* Define gradients */}
      <defs>
        {/* Light face gradient */}
        <linearGradient id="lightFace" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="50%" stopColor="#e5e7eb" />
          <stop offset="100%" stopColor="#9ca3af" />
        </linearGradient>

        {/* Dark face gradient */}
        <linearGradient id="darkFace" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6b7280" />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>

        {/* Medium face gradient */}
        <linearGradient id="mediumFace" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9ca3af" />
          <stop offset="100%" stopColor="#6b7280" />
        </linearGradient>
      </defs>

      {/* 3D cube structure */}

      {/* Top face (brightest) */}
      <path
        d="M 20 30 L 50 15 L 80 30 L 50 45 Z"
        fill="url(#lightFace)"
        stroke="#374151"
        strokeWidth="0.5"
      />

      {/* Left face (medium) */}
      <path
        d="M 20 30 L 20 60 L 50 75 L 50 45 Z"
        fill="url(#mediumFace)"
        stroke="#374151"
        strokeWidth="0.5"
      />

      {/* Right face (darkest) */}
      <path
        d="M 50 45 L 50 75 L 80 60 L 80 30 Z"
        fill="url(#darkFace)"
        stroke="#374151"
        strokeWidth="0.5"
      />

      {/* P letter embossed on top face */}
      <text
        x="50"
        y="35"
        fill="#06b6d4"
        fontSize="24"
        fontWeight="bold"
        fontFamily="system-ui"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          filter: "drop-shadow(1px 1px 2px rgba(0,0,0,0.3))",
        }}
      >
        P
      </text>
    </svg>
  );
}