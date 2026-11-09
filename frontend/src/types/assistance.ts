export type RequestType =
  | 'NURSE_CALL'
  | 'DRINKING_WATER'
  | 'HELP_OUT_OF_BED'
  | 'GENERAL_ASSISTANCE'
  | 'OTHER';

export type RequestStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';

export interface Bed {
  id: string;
  roomNumber: string;
  bedNumber: string;
  qrToken: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PatientAssistanceRequest {
  id: string;
  bedId: string;
  requestType: RequestType;
  customNote?: string | null;
  status: RequestStatus;
  submittedAt: string;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
  bed?: Bed;
}

export interface CreateRequestPayload {
  bedId: string;
  requestType: RequestType;
  customNote?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  count?: number;
  error?: string;
}

export interface RequestTypeMeta {
  type: RequestType;
  label: string;
  description: string;
  iconName: 'BellRing' | 'GlassWater' | 'Accessibility' | 'HelpCircle' | 'MessageSquare';
  badgeColor: string;
  buttonBg: string;
  buttonHover: string;
  borderColor: string;
  textColor: string;
  priority: 'high' | 'medium' | 'standard';
}

export const REQUEST_TYPE_CONFIG: Record<RequestType, RequestTypeMeta> = {
  NURSE_CALL: {
    type: 'NURSE_CALL',
    label: 'Nurse Call',
    description: 'Call attending nurse to bedside urgently',
    iconName: 'BellRing',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    buttonBg: 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200',
    buttonHover: 'hover:border-rose-400 hover:bg-rose-50',
    borderColor: 'border-rose-300',
    textColor: 'text-rose-600',
    priority: 'high',
  },
  DRINKING_WATER: {
    type: 'DRINKING_WATER',
    label: 'Drinking Water',
    description: 'Request fresh water or hot beverage refill',
    iconName: 'GlassWater',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    buttonBg: 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-200',
    buttonHover: 'hover:border-blue-400 hover:bg-blue-50',
    borderColor: 'border-blue-300',
    textColor: 'text-blue-600',
    priority: 'standard',
  },
  HELP_OUT_OF_BED: {
    type: 'HELP_OUT_OF_BED',
    label: 'Help Out of Bed',
    description: 'Assistance standing, washroom or wheelchair transfer',
    iconName: 'Accessibility',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    buttonBg: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200',
    buttonHover: 'hover:border-amber-400 hover:bg-amber-50',
    borderColor: 'border-amber-300',
    textColor: 'text-amber-600',
    priority: 'medium',
  },
  GENERAL_ASSISTANCE: {
    type: 'GENERAL_ASSISTANCE',
    label: 'General Assistance',
    description: 'Blanket, pillow, lighting, meal tray or room help',
    iconName: 'HelpCircle',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
    buttonBg: 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-200',
    buttonHover: 'hover:border-teal-400 hover:bg-teal-50',
    borderColor: 'border-teal-300',
    textColor: 'text-teal-600',
    priority: 'standard',
  },
  OTHER: {
    type: 'OTHER',
    label: 'Other Assistance',
    description: 'Any other specific inquiry or custom note',
    iconName: 'MessageSquare',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    buttonBg: 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200',
    buttonHover: 'hover:border-purple-400 hover:bg-purple-50',
    borderColor: 'border-purple-300',
    textColor: 'text-purple-600',
    priority: 'standard',
  },
};

