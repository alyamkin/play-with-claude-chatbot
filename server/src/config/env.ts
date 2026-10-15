function required(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing required environment variable: ${key}`)
  return value
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  get isProduction() {
    return this.nodeEnv === 'production'
  },
  anthropicApiKey: required('ANTHROPIC_API_KEY'),
} as const
