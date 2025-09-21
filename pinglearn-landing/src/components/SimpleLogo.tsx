"use client";

export default function SimpleLogo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="relative"
      style={{
        width: size,
        height: size,
        perspective: "100px"
      }}
    >
      {/* Simple 3D cube/box style logo */}
      <div
        className="relative w-full h-full"
        style={{
          transformStyle: "preserve-3d",
          transform: "rotateX(-20deg) rotateY(30deg)"
        }}
      >
        {/* Front face - lighter */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #e5e7eb 0%, #9ca3af 100%)",
            transform: "translateZ(10px)",
            borderRadius: "4px"
          }}
        >
          <span className="text-black/80 font-bold text-lg">P</span>
        </div>

        {/* Top face - lightest */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #f3f4f6 0%, #d1d5db 100%)",
            transform: "rotateX(90deg) translateZ(10px)",
            borderRadius: "4px",
            height: "20px",
            transformOrigin: "top"
          }}
        />

        {/* Right side - darker */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
            transform: "rotateY(90deg) translateZ(10px)",
            borderRadius: "4px",
            width: "20px",
            transformOrigin: "right"
          }}
        />
      </div>
    </div>
  );
}