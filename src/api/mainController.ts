// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** health GET /api/main/health */
export async function healthUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseString_>('/api/main/health', {
    method: 'GET',
    ...(options || {}),
  })
}
