import '../globals.css';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-app">
      <div className="w-full max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-accent text-glow-cyan">
            Virtual Tutor
          </h1>
          <p className="text-secondary mt-2">
            Your AI-powered learning companion
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}