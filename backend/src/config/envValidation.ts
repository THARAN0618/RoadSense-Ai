export function validateEnvironment(): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const missingVars: string[] = [];

  if (isProduction) {
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim() === '') {
      missingVars.push('DATABASE_URL');
    }

    if (
      !process.env.JWT_SECRET ||
      process.env.JWT_SECRET.trim() === '' ||
      process.env.JWT_SECRET === 'roadsense_ai_super_secret_jwt_key_2026'
    ) {
      missingVars.push('JWT_SECRET (must not use default fallback value in production)');
    }

    if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL.trim() === '') {
      missingVars.push('SUPABASE_URL');
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY.trim() === '') {
      missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
    }

    if (missingVars.length > 0) {
      const errorMsg = `CRITICAL ENVIRONMENT ERROR: Missing production variables:\n - ${missingVars.join('\n - ')}`;
      console.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }
  }
}
