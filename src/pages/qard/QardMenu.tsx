import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import MemberQardHasanah from './MemberQardHasanah';
import AdminQardHasanah from './AdminQardHasanah';

export default function QardMenu() {
  const { profile } = useAuthStore();

  if (profile?.role === 'admin') {
    return <AdminQardHasanah />;
  }

  return <MemberQardHasanah />;
}
