# Shadcn MCP Integration for Agents

## Overview
All agents in this repository now have full access to the shadcn MCP server, enabling them to work with shadcn/ui components and multiple registries including TweakCN for premium theming.

## Available Registries

### 1. Official Shadcn/ui Registry (@shadcn)
- **URL**: `https://ui.shadcn.com/r/{name}.json`
- **Content**: Core shadcn/ui components
- **Access**: Default registry, no authentication required

### 2. TweakCN Registry (@tweakcn)
- **URL**: `https://tweakcn.com/r/{name}.json`
- **Content**: Premium themed components, animations, micro-interactions
- **Features**: Visual theme editor, custom styling, premium design elements

### 3. V0 Registry (@v0)
- **URL**: `https://v0.dev/chat/b/{name}`
- **Content**: Advanced blocks, page templates, complex patterns
- **Use Case**: Full-featured dashboards, complete workflows

### 4. Community Registries (@acme, etc.)
- **Content**: Third-party components, specialized widgets
- **Access**: Configured via components.json

## MCP Server Tools Available to Agents

All agents can use these shadcn MCP server tools:

```typescript
// List all available components
mcp__shadcn-ui-server__list_shadcn_components()

// Get detailed component information
mcp__shadcn-ui-server__get_component_details(componentName: string)

// Get component usage examples
mcp__shadcn-ui-server__get_component_examples(componentName: string)

// Search for components by keyword
mcp__shadcn-ui-server__search_components(query: string)
```

## Agent-Specific Capabilities

### Shadcn Component Researcher
- Searches across ALL configured registries
- Compares implementations from different sources
- Documents registry sources for each component
- Creates comprehensive research reports

### Shadcn Implementation Builder
- Installs components from multiple registries
- Applies TweakCN theming for premium styling
- Combines components from different registries
- Creates production-ready implementations

### Shadcn Quick Helper
- Provides instant installation commands
- Maps natural language to component names
- Suggests registry alternatives
- Offers quick usage examples

### Shadcn Requirements Analyzer
- Breaks down complex UIs into component requirements
- Maps features to appropriate registries
- Creates component hierarchy with registry annotations
- Validates availability across registries

### Premium UX Designer
- Leverages TweakCN for premium theming
- Accesses animation libraries from registries
- Creates sophisticated visual designs
- Implements micro-interactions

### System Architect
- Designs registry-based architecture patterns
- Plans component migration strategies
- Defines theme architecture using TweakCN
- Creates micro-frontend patterns with registry isolation

## Registry Configuration

To add custom registries, update `components.json`:

```json
{
  "registries": {
    "@shadcn": "https://ui.shadcn.com/r/{name}.json",
    "@tweakcn": "https://tweakcn.com/r/{name}.json",
    "@v0": "https://v0.dev/chat/b/{name}",
    "@custom": "https://your-registry.com/r/{name}.json"
  }
}
```

## Installation Commands

### Official Components
```bash
npx shadcn@latest add button dialog form
```

### Registry-Specific Components
```bash
# TweakCN themed components
npx shadcn@latest add @tweakcn/themed-button

# V0 blocks
npx shadcn@latest add @v0/dashboard-layout

# Community components  
npx shadcn@latest add @acme/color-picker
```

## Authentication for Private Registries

For registries requiring authentication:

```json
{
  "@private": {
    "url": "https://api.company.com/registry/{name}.json",
    "headers": {
      "Authorization": "Bearer ${REGISTRY_TOKEN}",
      "X-API-Key": "${API_KEY}"
    }
  }
}
```

## Best Practices

1. **Registry Priority**: Official → TweakCN → V0 → Community → Custom
2. **Theme Consistency**: Use TweakCN for consistent premium styling
3. **Performance**: Consider bundle size when mixing registries
4. **Documentation**: Always note registry source in implementations
5. **Version Control**: Pin registry versions for stability

## Troubleshooting

### Component Not Found
- Search alternative registries
- Check registry configuration in components.json
- Verify network access to registry URLs

### Registry Conflicts
- Check version compatibility
- Use specific registry prefixes
- Resolve dependency conflicts

### MCP Server Issues
- Verify shadcn-ui-server is enabled in global.json
- Check MCP server logs
- Restart MCP server if needed

## Support

For issues or questions:
- Check shadcn/ui documentation: https://ui.shadcn.com
- Visit TweakCN: https://tweakcn.com
- Review MCP server docs in ~/.claude-code/mcp/README.md