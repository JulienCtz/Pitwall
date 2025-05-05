const USAGE_LIMITS = {
    0: 10,       // Free
    1: 100,      // Pro
    2: 1000,     // Team
    3: Infinity  // Enterprise
  };
  
  export const checkUserRateLimit = (user) => {
    const level = user.plan_level ?? 0;
    const used = user.usage_count ?? 0;
    const allowed = USAGE_LIMITS[level] ?? 10;
  
    return used < allowed;
  };
  
  export const incrementUsage = async (supabase, userId) => {
    await supabase
      .from('users')
      .update({ usage_count: supabase.raw('usage_count + 1') })
      .eq('id', userId);
  };
  