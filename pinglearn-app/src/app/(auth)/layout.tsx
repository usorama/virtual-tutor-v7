import '../globals.css';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-secondary/20 px-4 py-12">
      <div className="w-full max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Virtual Tutor
          </h1>
          <p className="text-muted-foreground mt-2">
            Your AI-powered learning companion
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}