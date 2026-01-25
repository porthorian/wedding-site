import { defineEventHandler } from 'h3'
import type { IncomingMessage } from 'node:http'

function getRemoteAddress(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0]?.trim() || '-'
  }
  return req.socket?.remoteAddress || '-'
}

export default defineEventHandler((event) => {
  const req = event.node.req
  const res = event.node.res
  const startedAt = Date.now()
  const method = req.method || 'UNK'
  const url = req.url || '/'
  const httpVersion = req.httpVersion || 'UNK'
  const referer = typeof req.headers.referer === 'string' ? req.headers.referer : '-'
  const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : '-'
  const remoteAddress = getRemoteAddress(req)

  res.on('finish', () => {
    const status = res.statusCode || 0
    const lengthHeader = res.getHeader('content-length')
    const length = typeof lengthHeader === 'string' || typeof lengthHeader === 'number'
      ? lengthHeader
      : '-'
    const durationSec = ((Date.now() - startedAt) / 1000).toFixed(3)
    const timestamp = new Date().toISOString()

    console.log(
      `${remoteAddress} - - [${timestamp}] "${method} ${url} HTTP/${httpVersion}" ${status} ${length} ` +
        `"${referer}" "${userAgent}" ${durationSec}`
    )
  })
})

