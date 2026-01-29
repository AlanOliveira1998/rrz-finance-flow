import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mocks for supabase client
const mockGetUser = vi.fn()
const mockDeleteUser = vi.fn()
let mockProfileData: any = null

const mockFrom = vi.fn((table: string) => ({
  select: vi.fn(() => ({
    eq: vi.fn(() => ({
      single: vi.fn(async () => ({ data: mockProfileData, error: null }))
    }))
  }))
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser, admin: { deleteUser: mockDeleteUser } },
    from: mockFrom,
  }),
}))

// Import handler after mocking
const handler = (await import('../../api/delete-user.js')).default

function mockRes() {
  const res: any = {}
  res.status = vi.fn(() => res)
  res.json = vi.fn(() => res)
  return res
}

describe('DELETE /api/delete-user', () => {
  beforeEach(() => {
    mockGetUser.mockReset()
    mockDeleteUser.mockReset()
    mockFrom.mockReset()
    mockProfileData = null
  })

  it('returns 401 when missing Authorization header', async () => {
    const req: any = { method: 'POST', headers: {} , body: { userId: 'u2' } }
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('returns 401 when token invalid', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'invalid' } })
    const req: any = { method: 'POST', headers: { authorization: 'Bearer bad' }, body: { userId: 'u2' } }
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('returns 403 when caller is not admin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'caller' } }, error: null })
    mockProfileData = { role: 'user' }
    const req: any = { method: 'POST', headers: { authorization: 'Bearer t' }, body: { userId: 'u2' } }
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(403)
  })

  it('returns 400 when userId missing', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'caller' } }, error: null })
    mockProfileData = { role: 'admin' }
    const req: any = { method: 'POST', headers: { authorization: 'Bearer t' }, body: {} }
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(400)
  })

  it('returns 200 on success', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'caller' } }, error: null })
    mockProfileData = { role: 'admin' }
    mockDeleteUser.mockResolvedValue({ error: null })
    const req: any = { method: 'POST', headers: { authorization: 'Bearer ok' }, body: { userId: 'target' } }
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith({ success: true })
  })

  it('returns 500 when supabase delete fails', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: 'caller' } }, error: null })
    mockProfileData = { role: 'admin' }
    mockDeleteUser.mockResolvedValue({ error: { message: 'fail' } })
    const req: any = { method: 'POST', headers: { authorization: 'Bearer ok' }, body: { userId: 'target' } }
    const res = mockRes()
    await handler(req, res)
    expect(res.status).toHaveBeenCalledWith(500)
  })
})