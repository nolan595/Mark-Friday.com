// Mock Prisma client for unit tests
vi.mock('@/lib/prisma', () => ({
  prisma: {
    task: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      aggregate: vi.fn().mockResolvedValue({ _max: { sortOrder: 0 } }),
    },
    $transaction: vi.fn(),
  },
}))
