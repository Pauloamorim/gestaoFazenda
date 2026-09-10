import type { NextConfig } from 'next'

export default {
  // o padrão é 1 MB e corta o upload de documentos no meio
  experimental: { serverActions: { bodySizeLimit: '10mb' } },
} satisfies NextConfig
