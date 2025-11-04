import { GET } from '../route';
import { NextRequest } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/config';

jest.mock('@/lib/supabase/config');
jest.mock('@/lib/api/booking-queries');

const mockSupabase = {
  from: jest.fn(),
  rpc: jest.fn(),
};

describe('/api/exhibitions/[id]/time-slots', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServiceSupabase as jest.Mock).mockReturnValue(mockSupabase);
  });

  it('should return time slots for valid exhibition and date', async () => {
    const exhibitionId = 'test-exhibition-id';
    const date = '2025-12-01';

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { id: exhibitionId, name: 'Test Exhibition', status: 'active' },
            error: null,
          }),
        }),
      }),
    });

    const request = new NextRequest(
      `http://localhost:3000/api/exhibitions/${exhibitionId}/time-slots?date=${date}`
    );

    const response = await GET(request, { params: { id: exhibitionId } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('timeSlots');
  });

  it('should return 400 for missing date parameter', async () => {
    const exhibitionId = 'test-exhibition-id';

    const request = new NextRequest(
      `http://localhost:3000/api/exhibitions/${exhibitionId}/time-slots`
    );

    const response = await GET(request, { params: { id: exhibitionId } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });

  it('should return 400 for invalid date format', async () => {
    const exhibitionId = 'test-exhibition-id';
    const invalidDate = '12-01-2025';

    const request = new NextRequest(
      `http://localhost:3000/api/exhibitions/${exhibitionId}/time-slots?date=${invalidDate}`
    );

    const response = await GET(request, { params: { id: exhibitionId } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INVALID_DATE');
  });

  it('should return 404 for non-existent exhibition', async () => {
    const exhibitionId = 'non-existent-id';
    const date = '2025-12-01';

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
          }),
        }),
      }),
    });

    const request = new NextRequest(
      `http://localhost:3000/api/exhibitions/${exhibitionId}/time-slots?date=${date}`
    );

    const response = await GET(request, { params: { id: exhibitionId } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
  });
});
