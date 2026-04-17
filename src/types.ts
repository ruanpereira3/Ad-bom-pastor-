export type UserRole = 'admin_sede' | 'secretary_sede' | 'treasurer_sede' | 'pastor_local' | 'secretary_local' | 'treasurer_local' | 'member';
export type UserStatus = 'active' | 'less_active' | 'inactive';
export type UnitType = 'sede' | 'congregacao';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  unitId: string;
  status: UserStatus;
  lastAccess: string;
  photoURL?: string;
  baptismDate?: string;
}

export interface Unit {
  id: string;
  name: string;
  type: UnitType;
  address: string;
}

export interface PrayerRequest {
  id: string;
  name?: string;
  request: string;
  date: string;
  status: 'pending' | 'prayed';
}

export interface FinanceRecord {
  id: string;
  unitId: string;
  type: 'tithe' | 'offering' | 'expense';
  amount: number;
  date: string;
  description: string;
  category?: string;
  contributorId?: string;
}

export interface BaptismRecord {
  id: string;
  memberId: string;
  date: string;
  status: 'scheduled' | 'completed';
}
