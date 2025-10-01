/**
 * UserService
 * ARCH-002: Service Layer Architecture - Example Service Implementation
 *
 * Manages user operations, authentication, and profile management
 */

import { BaseService } from './base-service';
import type { BaseServiceConfig, ServiceHealth } from './types';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

/**
 * UserService configuration
 */
export interface UserServiceConfig extends BaseServiceConfig {
  /** Enable user caching */
  cacheEnabled?: boolean;
  /** Cache TTL in milliseconds */
  cacheTTL?: number;
}

/**
 * User creation data
 */
export interface CreateUserData {
  id: string;
  email: string;
  full_name: string;
}

/**
 * Authentication result
 */
export interface AuthResult {
  user: Profile;
  sessionToken: string;
}

/**
 * UserService
 *
 * Handles user management, authentication, and profile operations
 * with optional caching layer
 */
export class UserService extends BaseService<UserServiceConfig> {
  private static instance: UserService;
  private supabase = createClient();
  private userCache: Map<string, { user: Profile; timestamp: number }> =
    new Map();
  private cacheCleanupInterval?: NodeJS.Timeout;

  private constructor(config?: UserServiceConfig) {
    super('UserService', {
      enabled: true,
      cacheEnabled: true,
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      ...config,
    });
  }

  /**
   * Get singleton instance
   */
  public static getInstance(config?: UserServiceConfig): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService(config);
    }
    return UserService.instance;
  }

  // =============================================================================
  // LIFECYCLE HOOKS
  // =============================================================================

  /**
   * Initialize service
   */
  protected async doInitialize(): Promise<void> {
    // Verify database connection
    const { error } = await this.supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }

    console.log('[UserService] Database connection verified');
  }

  /**
   * Start service
   */
  protected async doStart(): Promise<void> {
    // Start cache cleanup interval if enabled
    if (this.config.cacheEnabled) {
      this.cacheCleanupInterval = setInterval(
        () => this.cleanupCache(),
        60000
      ); // Every minute
      console.log('[UserService] Cache cleanup started');
    }
  }

  /**
   * Stop service
   */
  protected async doStop(): Promise<void> {
    // Stop cache cleanup
    if (this.cacheCleanupInterval) {
      clearInterval(this.cacheCleanupInterval);
      this.cacheCleanupInterval = undefined;
    }

    // Clear cache
    this.userCache.clear();
    console.log('[UserService] Stopped and cleaned up');
  }

  /**
   * Health check
   */
  protected async doHealthCheck(): Promise<ServiceHealth> {
    try {
      // Check database connectivity
      const { error } = await this.supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        return {
          status: 'unhealthy',
          message: `Database error: ${error.message}`,
          lastCheck: new Date(),
        };
      }

      return {
        status: 'healthy',
        message: 'All systems operational',
        lastCheck: new Date(),
        metrics: {
          uptime: this.getUptime(),
          errorRate: 0,
          requestCount: this.userCache.size,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : String(error),
        lastCheck: new Date(),
      };
    }
  }

  // =============================================================================
  // USER OPERATIONS
  // =============================================================================

  /**
   * Create new user
   */
  async createUser(data: CreateUserData): Promise<Profile> {
    const profileData: ProfileInsert = {
      id: data.id,
      email: data.email,
      full_name: data.full_name,
    };

    const { data: user, error } = await this.supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    // Update cache
    if (this.config.cacheEnabled && user) {
      this.userCache.set(user.id, { user, timestamp: Date.now() });
    }

    return user;
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<Profile | null> {
    // Check cache first
    if (this.config.cacheEnabled) {
      const cached = this.userCache.get(id);
      if (cached && Date.now() - cached.timestamp < this.config.cacheTTL!) {
        return cached.user;
      }
    }

    const { data: user, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // Not found is ok
      throw new Error(`Failed to get user: ${error.message}`);
    }

    // Update cache
    if (this.config.cacheEnabled && user) {
      this.userCache.set(user.id, { user, timestamp: Date.now() });
    }

    return user;
  }

  /**
   * Update user
   */
  async updateUser(id: string, data: Partial<ProfileUpdate>): Promise<Profile> {
    const { data: user, error } = await this.supabase
      .from('profiles')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    // Invalidate cache
    this.userCache.delete(id);

    return user;
  }

  /**
   * Delete user
   */
  async deleteUser(id: string): Promise<boolean> {
    const { error } = await this.supabase.from('profiles').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }

    // Invalidate cache
    this.userCache.delete(id);

    return true;
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<Profile | null> {
    const { data: user, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to get user by email: ${error.message}`);
    }

    return user;
  }

  /**
   * Authenticate user (placeholder - would integrate with auth system)
   */
  async authenticateUser(
    email: string,
    _password: string
  ): Promise<AuthResult> {
    // This would integrate with Supabase Auth or your auth system
    const user = await this.getUserByEmail(email);

    if (!user) {
      throw new Error('Invalid credentials');
    }

    return {
      user,
      sessionToken: `token_${Date.now()}`, // Placeholder
    };
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    enabled: boolean;
    ttl: number;
  } {
    return {
      size: this.userCache.size,
      enabled: this.config.cacheEnabled || false,
      ttl: this.config.cacheTTL || 0,
    };
  }

  // =============================================================================
  // PRIVATE METHODS
  // =============================================================================

  /**
   * Cleanup expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const ttl = this.config.cacheTTL!;

    let cleanedCount = 0;
    for (const [id, cached] of this.userCache.entries()) {
      if (now - cached.timestamp > ttl) {
        this.userCache.delete(id);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`[UserService] Cache cleanup: removed ${cleanedCount} entries`);
    }
  }
}
