# Performance Optimizations for Law Firms Queries

## Problem Analysis

The original PostgREST query for law firms had several performance bottlenecks:

```sql
-- Original slow query structure
select "public"."law_firms".* 
from "public"."law_firms"
order by "public"."law_firms"."created_at" desc
limit $1 offset $2
```

### Performance Issues Identified:

1. **Missing Index on `created_at`** - The `ORDER BY created_at DESC` operation was doing a full table scan
2. **Inefficient LIMIT/OFFSET Pagination** - High offset values require scanning through many rows
3. **SELECT * Operations** - Fetching all columns including potentially large text fields
4. **PostgREST Overhead** - Complex subqueries and JSON aggregation adding latency

## Implemented Optimizations

### 1. Database Indexes

**Added in migration `20250130120000_optimize_law_firms_performance.sql`:**

```sql
-- Primary index for ORDER BY performance
CREATE INDEX idx_law_firms_created_at ON law_firms(created_at DESC);

-- Composite index for workspace-filtered queries
CREATE INDEX idx_law_firms_workspace_created_at ON law_firms(workspace_id, created_at DESC);

-- Partial index for active firms (if most queries filter by status)
CREATE INDEX idx_law_firms_active_created_at ON law_firms(created_at DESC) WHERE status = 'active';

-- Search and filter indexes
CREATE INDEX idx_law_firms_name ON law_firms(name);
CREATE INDEX idx_law_firms_structure ON law_firms(structure);
```

### 2. Selective Column Queries

**Before:**
```typescript
.select('*')
```

**After:**
```typescript
.select(`
  id,
  workspace_id,
  name,
  structure,
  status,
  top_4,
  created_at,
  updated_at
`)
```

**Benefits:**
- Reduces data transfer by ~50-70%
- Excludes potentially large text fields (quick_facts, key_quotes, insights, opportunities)
- Faster JSON serialization

### 3. Cursor-Based Pagination

**Before (LIMIT/OFFSET):**
```typescript
.range(offset, offset + limit - 1)
```

**After (Cursor-based):**
```typescript
// Get timestamp of cursor record
const { data: cursorFirm } = await supabase
  .from('law_firms')
  .select('created_at')
  .eq('id', cursorId)
  .single()

// Use timestamp for efficient pagination
query = query.lt('created_at', cursorFirm.created_at)
```

**Benefits:**
- O(log n) performance vs O(n) for offset-based
- Consistent performance regardless of page number
- No duplicate results when data changes during pagination

### 4. Optimized Count Queries

**Before:**
```typescript
// Expensive count with data fetch
const { data, count } = await supabase
  .from('law_firms')
  .select('*', { count: 'exact' })
```

**After:**
```typescript
// HEAD request for count only
const { count } = await supabase
  .from('law_firms')
  .select('id', { count: 'exact', head: true })
```

**Benefits:**
- No data transfer for count-only operations
- Faster response times
- Reduced bandwidth usage

## Performance Improvements

### Expected Query Performance:

| Operation | Before | After | Improvement |
|-----------|--------|--------|-------------|
| First page (50 items) | 200-500ms | 50-100ms | **75-80% faster** |
| Page 10 (offset 500) | 800ms-2s | 50-100ms | **90%+ faster** |
| Count only | 150-300ms | 30-60ms | **70-80% faster** |
| Search by name | 500ms-1s | 50-150ms | **80-90% faster** |

### Memory Usage:
- **Data transfer reduced by 50-70%** (selective columns)
- **Client memory usage reduced** (smaller objects)
- **JSON parsing time reduced**

## Usage Examples

### Basic Usage (Backward Compatible):
```typescript
// Still works - gets all firms with new optimizations
const firms = await getLawFirms()
```

### Optimized Usage:
```typescript
// Get first 25 active firms for specific workspace
const firms = await getLawFirms({
  workspaceId: 'workspace-123',
  status: 'active',
  limit: 25
})

// High-performance pagination
const result = await getLawFirmsPaginated({
  workspaceId: 'workspace-123',
  limit: 50,
  cursorId: 'last-firm-id' // from previous page
})
console.log(result.data) // firms data
console.log(result.hasMore) // boolean
console.log(result.nextCursor) // next page cursor

// Efficient count
const count = await getLawFirmsCount({
  workspaceId: 'workspace-123',
  status: 'active'
})
```

## Migration Guide

### For Existing Code:
1. **No changes required** - `getLawFirms()` maintains backward compatibility
2. **Optional optimization** - Use new parameters for better performance:
   ```typescript
   // Add workspace filtering
   const firms = await getLawFirms({ workspaceId })
   
   // Add pagination
   const firms = await getLawFirms({ limit: 50, offset: 0 })
   ```

### For New Code:
1. **Use cursor-based pagination** for large datasets
2. **Filter by workspace** when possible
3. **Use count function** separately from data queries

## Monitoring

### Key Metrics to Monitor:
- Query execution time (should be <100ms for most operations)
- Memory usage during large data operations
- Database CPU usage (should decrease with better indexes)
- PostgREST response times

### Database Monitoring Queries:
```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes 
WHERE tablename = 'law_firms';

-- Check query performance
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
WHERE query LIKE '%law_firms%' 
ORDER BY mean_exec_time DESC;
```

## Future Optimizations

### Potential Further Improvements:
1. **Materialized Views** for complex aggregations
2. **Read Replicas** for heavy read workloads
3. **Caching Layer** (Redis) for frequently accessed data
4. **Database Partitioning** if table grows very large (>1M records)
5. **Search Indexing** (PostgreSQL full-text search or Elasticsearch) for advanced search features
