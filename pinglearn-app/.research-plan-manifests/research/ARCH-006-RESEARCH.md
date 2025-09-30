# ARCH-006 RESEARCH MANIFEST
**Story**: ARCH-006 - Cache layer implementation
**Phase**: 1 - RESEARCH
**Date**: 2025-09-30
**Agent**: story_arch006_001
**Status**: COMPLETE

---

## RESEARCH SUMMARY

### 1. CONTEXT7 RESEARCH
**Status**: Not performed (no Context7 MCP server available in this session)
**Alternative**: Used Web Search for current best practices

### 2. WEB SEARCH FINDINGS

#### Modern Caching Strategies (2025)
**Sources**: Next.js docs, Medium articles, npm packages

**Key Findings**:
1. **LRU (Least Recently Used) Cache**
   - Industry standard for bounded memory caching
   - ES6 Map provides efficient insertion-order tracking
   - Popular library: `lru-cache` v11.2.2 (8M+ weekly downloads)
   - Supports TTL, allowStale, fetchMethod for SWR

2. **TTL (Time To Live)**
   - Essential for data freshness
   - Typical values: 5-60 minutes depending on data volatility
   - Should be configurable per cache namespace

3. **Stale-While-Revalidate (SWR)**
   - Next.js ISR pattern: serve stale, fetch fresh in background
   - Improves user experience (no loading states)
   - React Query pattern: `staleTime` + background refetch
   - Critical for high-traffic applications

4. **Best Practices 2025**:
   - Combine TTL + LRU eviction (balance freshness + performance)
   - Type-safe cache keys (prevent key collisions)
   - Namespace isolation (separate caches by domain)
   - Memory limits enforcement (prevent OOM)
   - Cache statistics tracking (hit/miss rates, eviction counts)
   - Graceful degradation (cache unavailable = fetch fresh)

#### Performance Patterns
- **Memory Management**: Set max size limits (1000-10000 items typical)
- **Eviction Policy**: LRU is most common, but consider:
  - LFU (Least Frequently Used) for access-based eviction
  - FIFO (First In First Out) for simple time-based eviction
- **Invalidation**: Manual invalidation on data mutations
- **Monitoring**: Track hit/miss rates, memory usage, eviction counts

### 3. CODEBASE ANALYSIS

#### Existing Cache Implementations Found

**1. CachedResponseStrategy** (`src/lib/resilience/strategies/cached-response.ts`)
- **Purpose**: Fallback strategy for failed operations
- **Implementation**: Simple Map-based cache with timestamps
- **TTL**: Fixed 1 hour (3600000ms)
- **Features**:
  - Cache key generation from operation context
  - Staleness indicator in returned data
  - Cache statistics (size, entry ages)
  - Clear cache methods (specific + all)
- **Limitations**:
  - No LRU eviction (unbounded growth)
  - No memory limits
  - Fixed TTL (not configurable per entry)
  - Single global cache (no namespaces)

**2. MemoryManager** (`src/lib/memory-manager.ts`)
- **Purpose**: Memory monitoring and cleanup for long sessions
- **Scope**: Client-side (browser) memory management
- **Features**:
  - Memory threshold monitoring (warning/critical)
  - Automatic cleanup intervals
  - Math renderer cache trimming
  - WebSocket buffer clearing
  - Garbage collection hints
- **NOT a general-purpose cache**: Specialized for cleanup

#### Cache Candidates Identified

**High-Value Cache Targets**:
1. **Curriculum Data** (`curriculum_data` table)
   - Grade/board/subject combinations
   - Rarely changes (perfect for caching)
   - Frequently accessed (textbook hierarchy routes)
   - TTL: 30-60 minutes

2. **Textbook Metadata** (`textbooks`, `chapters` tables)
   - Book series/book/chapter hierarchy
   - Accessed on every textbook wizard load
   - TTL: 15-30 minutes

3. **User Profiles** (`profiles` table)
   - User name, role, preferences
   - Accessed on every authenticated request
   - TTL: 5-10 minutes

4. **PDF Metadata Extraction Results**
   - Expensive PDF processing operations
   - Cacheable by file hash
   - TTL: 60 minutes (file won't change)

5. **Math Rendering Results** (Currently cached in MathRenderer)
   - KaTeX rendering is expensive
   - Already has cache (window.mathCache)
   - Opportunity: centralize with new cache manager

### 4. ARCHITECTURAL DECISIONS

#### Design Choices

**1. Cache Manager Architecture**
```
CacheManager (Singleton)
├── LRU eviction policy
├── TTL expiration
├── Namespace isolation
├── Type-safe API
└── Statistics tracking
```

**2. Cache Strategies**
- **Primary**: LRU with TTL (covers 90% of use cases)
- **Advanced**: Stale-While-Revalidate (for API responses)
- **Future**: Redis adapter (distributed caching)

**3. Type Safety**
```typescript
// Type-safe get/set
cache.set<User>('users', userId, userData);
const user = cache.get<User>('users', userId);
```

**4. Memory Limits**
- Default: 1000 entries per namespace
- Configurable per namespace
- Automatic LRU eviction when limit reached

**5. Cache Invalidation**
- Manual: `cache.delete(namespace, key)`
- TTL expiration: Automatic cleanup
- Namespace clear: `cache.clear(namespace)`
- Global clear: `cache.clearAll()` (emergency only)

#### Technology Stack
- **Storage**: ES6 Map (native, performant)
- **Eviction**: Doubly-linked list + Map (O(1) operations)
- **TTL**: Per-entry timestamps with lazy cleanup
- **Types**: Full TypeScript generics support

### 5. INTEGRATION POINTS

#### Where Cache Will Be Used

**1. API Routes** (Priority 1)
```typescript
// src/app/api/textbooks/hierarchy/route.ts
// Cache textbook hierarchy queries
const cached = cacheManager.get<BookSeries>('textbooks', seriesId);
if (cached) return NextResponse.json(cached);

const data = await fetchFromDatabase();
cacheManager.set('textbooks', seriesId, data, { ttl: 1800000 }); // 30 min
```

**2. Repository Base** (Priority 2)
```typescript
// src/lib/services/repository-base.ts
// Add optional caching layer to repository pattern
protected async cachedFindById<T>(id: string, options?: CacheOptions): Promise<T> {
  const cached = this.cache.get<T>(this.tableName, id);
  if (cached) return cached;

  const data = await this.findById(id);
  this.cache.set(this.tableName, id, data, options);
  return data;
}
```

**3. React Query Integration** (Priority 3)
```typescript
// Replace React Query cache with centralized cache
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const [namespace, ...keys] = queryKey;
        return cacheManager.getOrFetch(namespace, keys.join(':'), fetchFn);
      }
    }
  }
});
```

### 6. RISKS & MITIGATIONS

#### Identified Risks

**Risk 1: Memory Leaks**
- **Mitigation**: Strict LRU limits, automatic eviction
- **Monitoring**: Memory usage stats, eviction counts

**Risk 2: Stale Data**
- **Mitigation**: Conservative TTL values, manual invalidation on updates
- **Monitoring**: Cache age tracking, staleness warnings

**Risk 3: Cache Stampede** (many requests for same expired key)
- **Mitigation**: Stale-while-revalidate pattern, request deduplication
- **Implementation**: Phase 2 feature (not MVP)

**Risk 4: Key Collisions**
- **Mitigation**: Namespace isolation, structured key format
- **Format**: `namespace:entityType:entityId:params`

**Risk 5: Type Safety Violations**
- **Mitigation**: Generic type parameters, runtime validation hooks
- **Testing**: Comprehensive type tests

### 7. SUCCESS CRITERIA

**Phase 1 (Research) - COMPLETE**
- [x] Web search for caching best practices 2025
- [x] Analyze existing caching code
- [x] Identify cache candidates
- [x] Document architectural decisions
- [x] Define integration points
- [x] Identify risks and mitigations

**Phase 2 (Planning) - Next**
- [ ] Design detailed cache manager architecture
- [ ] Define cache strategy interfaces
- [ ] Plan test coverage (>80%)
- [ ] Create implementation roadmap
- [ ] Define acceptance criteria

---

## RESEARCH ARTIFACTS

### Discovered Patterns

**1. Existing Cache Pattern (CachedResponseStrategy)**
```typescript
// Simple Map-based cache with timestamps
private cache: Map<string, { data: unknown; timestamp: number }> = new Map();

// Cache key generation
private generateCacheKey(context: OperationContext): string {
  return [
    context.operationType,
    context.operationId,
    JSON.stringify(context.params || {})
  ].join(':');
}

// Staleness check
const age = Date.now() - cached.timestamp;
const isStale = age > this.maxAge;
```

**2. Memory Management Pattern (MemoryManager)**
```typescript
// Threshold-based cleanup
if (metrics.heapUsed > this.thresholds.critical) {
  this.performEmergencyCleanup();
} else if (metrics.heapUsed > this.thresholds.warning) {
  this.performCleanup();
}

// Cache trimming (keep recent 25 items)
const entries = Array.from(cache.entries());
cache.clear();
entries.slice(-25).forEach(([key, value]) => cache.set(key, value));
```

### Cache Candidates Priority

**High Priority** (Immediate ROI):
1. Curriculum data queries (API: `/api/textbooks/hierarchy`)
2. Textbook hierarchy (Database tables: `book_series`, `books`, `book_chapters`)
3. User profile lookups (Authentication middleware)

**Medium Priority** (Good ROI):
4. PDF metadata extraction results (Expensive operations)
5. Math rendering cache centralization (Already exists, consolidate)

**Low Priority** (Future optimization):
6. Supabase query results (Broad application)
7. API response caching (Edge cases)

### Performance Targets

**Cache Hit Rates**:
- Curriculum data: >90% (rarely changes)
- Textbook metadata: >80% (occasional updates)
- User profiles: >70% (frequent updates)

**Memory Usage**:
- Default limit: 1000 entries per namespace
- Estimated: ~100 bytes per entry = 100KB per namespace
- Total: <10 namespaces = <1MB cache overhead

**Latency Improvements**:
- Cache hit: <1ms (in-memory lookup)
- Cache miss: Database query time (50-200ms)
- Expected improvement: 50-90% latency reduction on cached paths

---

## NEXT STEPS (Phase 2: PLANNING)

1. Design `CacheManager` class with LRU eviction
2. Design `CacheStrategy` interface and implementations
3. Define cache key generation utilities
4. Plan namespace schema
5. Create test strategy (>80% coverage)
6. Document API surface and usage examples

---

**[RESEARCH-COMPLETE-ARCH-006]**

**Signature**: story_arch006_001
**Timestamp**: 2025-09-30T00:00:00Z
**Phase 1 Duration**: 45 minutes (estimated)
**Ready for Phase 2**: YES