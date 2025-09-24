export default function TestDesignSystemPage() {
  return (
    <div className="min-h-screen bg-app p-8">
      <div className="container mx-auto space-y-12">
        {/* Typography Examples */}
        <section>
          <h2 className="text-title1 text-white mb-8">Typography System</h2>

          {/* Dashboard Cards with Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 - Study Sessions */}
            <div className="liquid-glass p-6 rounded-xl hover-lift">
              <h3 className="text-title2 text-white mb-4">Study Sessions</h3>
              <div className="flex items-center justify-between mb-2">
                <p className="text-largeTitle text-white">234</p>
                <span className="metric-badge-positive">+12%</span>
              </div>
              <p className="text-caption1 text-tertiary">Total completed this month</p>
            </div>

            {/* Card 2 - Active Time */}
            <div className="liquid-glass p-6 rounded-xl hover-lift">
              <h3 className="text-title2 text-white mb-4">Active Time</h3>
              <div className="flex items-center justify-between mb-2">
                <p className="text-largeTitle text-white">48h</p>
                <span className="metric-badge-negative">-5%</span>
              </div>
              <p className="text-caption1 text-tertiary">This week</p>
            </div>

            {/* Card 3 - Topics Mastered */}
            <div className="liquid-glass p-6 rounded-xl hover-lift">
              <h3 className="text-title2 text-white mb-4">Topics Mastered</h3>
              <div className="flex items-center justify-between mb-2">
                <p className="text-largeTitle text-white">15</p>
                <span className="metric-badge-neutral">0%</span>
              </div>
              <p className="text-caption1 text-tertiary">No change from last week</p>
            </div>

            {/* Card 4 - Accuracy */}
            <div className="liquid-glass p-6 rounded-xl hover-lift">
              <h3 className="text-title2 text-white mb-4">Accuracy</h3>
              <div className="flex items-center justify-between mb-2">
                <p className="text-largeTitle text-white">92%</p>
                <span className="metric-badge-positive">+23%</span>
              </div>
              <p className="text-caption1 text-tertiary">Improvement this month</p>
            </div>
          </div>
        </section>

        {/* Typography Demonstration */}
        <section>
          <h2 className="text-title1 text-white mb-8">Typography Scale</h2>
          <div className="space-y-6">
            <div className="liquid-glass p-6 rounded-xl">
              <p className="text-caption2 text-tertiary mb-2">Large Title (Bold - 700)</p>
              <h1 className="text-largeTitle text-white">Dashboard Metrics</h1>
            </div>

            <div className="liquid-glass p-6 rounded-xl">
              <p className="text-caption2 text-tertiary mb-2">Title 1 (Heavy - 800)</p>
              <h2 className="text-title1 text-white">Dashboard Metrics</h2>
            </div>

            <div className="liquid-glass p-6 rounded-xl">
              <p className="text-caption2 text-tertiary mb-2">Title 2 (Bold - 700)</p>
              <h3 className="text-title2 text-white">Study Sessions</h3>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}