export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    if (!secret || secret.trim() === '' || secret === 'roadsense_ai_super_secret_jwt_key_2026') {
      throw new Error('JWT_SECRET environment variable is missing or insecure in production environment');
    }
    return secret;
  }

  return secret || 'roadsense_ai_super_secret_jwt_key_2026';
}
