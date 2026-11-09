import {
  Bed,
  PatientAssistanceRequest,
  CreateRequestPayload,
  RequestStatus,
  ApiResponse,
} from '../types/assistance';

const BASE_URL = import.meta.env.VITE_API_URL || '';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const json: ApiResponse<T> = await response.json().catch(() => ({
    success: false,
    message: 'Failed to parse JSON response from server',
    data: null as unknown as T,
  }));

  if (!response.ok || !json.success) {
    throw new ApiError(
      json.message || `Request failed with HTTP status ${response.status}`,
      response.status
    );
  }

  return json.data;
}

export const assistanceApi = {
  /**
   * GET /api/assistance/bed/:qrToken
   * Fetch bed details using its secure QR token
   */
  async getBedByToken(qrToken: string): Promise<Bed> {
    return request<Bed>(`/api/assistance/bed/${encodeURIComponent(qrToken)}`);
  },

  /**
   * POST /api/assistance/request
   * Create a new assistance request for a bed
   */
  async createRequest(payload: CreateRequestPayload): Promise<PatientAssistanceRequest> {
    return request<PatientAssistanceRequest>('/api/assistance/request', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * GET /api/assistance/active
   * Fetch all active requests (where status is PENDING or IN_PROGRESS)
   */
  async getActiveRequests(): Promise<PatientAssistanceRequest[]> {
    return request<PatientAssistanceRequest[]>('/api/assistance/active');
  },

  /**
   * PATCH /api/assistance/request/:id/status
   * Update request status (IN_PROGRESS sets acknowledgedAt, RESOLVED sets resolvedAt)
   */
  async updateStatus(id: string, status: RequestStatus): Promise<PatientAssistanceRequest> {
    return request<PatientAssistanceRequest>(`/api/assistance/request/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  /**
   * GET /api/assistance/request/:id
   * Fetch single request for live polling on confirmation screen
   */
  async getRequestById(id: string): Promise<PatientAssistanceRequest> {
    return request<PatientAssistanceRequest>(`/api/assistance/request/${id}`);
  },

  /**
   * GET /api/assistance/beds
   * Fetch list of all registered hospital beds
   */
  async getAllBeds(): Promise<Bed[]> {
    return request<Bed[]>('/api/assistance/beds');
  },
};

