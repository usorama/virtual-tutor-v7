// Glass Morphism Component Library
// Apple-inspired design with large rounded corners and glass effects

export { GlassCard } from './glass-card'
export { TabbedGlassCard } from './tabbed-glass-card'
export type { Tab } from './tabbed-glass-card'

// Usage Examples:
//
// 1. Basic Glass Card:
// <GlassCard borderRadius="xlarge">
//   Your content here
// </GlassCard>
//
// 2. Elevated Glass Card with shadow:
// <GlassCard variant="elevated" borderRadius="xlarge">
//   Your content here
// </GlassCard>
//
// 3. Tabbed Glass Card:
// <TabbedGlassCard
//   tabs={[
//     { id: 0, label: 'Grade Selection', badge: 1 },
//     { id: 1, label: 'Subject Selection', badge: 2 },
//   ]}
//   activeTab={0}
//   onTabChange={(id) => console.log(id)}
// >
//   Your tab content here
// </TabbedGlassCard>