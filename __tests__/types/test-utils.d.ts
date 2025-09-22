// Test type augmentations
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'test' | 'production'
      DATABASE_URL?: string
      [key: string]: string | undefined
    }
  }
}

export {}