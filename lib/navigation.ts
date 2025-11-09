"use client";

import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect, useState } from 'react';

/**
 * Hook to get the appropriate dashboard URL based on user role
 * Returns '/patient' for patients, '/doctorportal' for doctors, or '/' for unauthenticated users
 */
export function useDashboardUrl(): string {
  const { user, isLoading } = useUser();
  const [dashboardUrl, setDashboardUrl] = useState<string>('/');
  const [checkingRole, setCheckingRole] = useState(false);

  useEffect(() => {
    async function fetchDashboardUrl() {
      if (isLoading || checkingRole) return;
      
      if (!user || !user.email) {
        setDashboardUrl('/');
        return;
      }

      setCheckingRole(true);
      try {
        // First, try to get role from the role API
        const response = await fetch(`/api/users/role?email=${encodeURIComponent(user.email)}`);
        const data = await response.json();
        
        if (data.success && data.role) {
          setDashboardUrl(data.role === 'doctor' ? '/doctorportal' : '/patient');
          setCheckingRole(false);
          return;
        }
        
        // Fallback: check user data directly
        const userResponse = await fetch(`/api/users?emailAddress=${encodeURIComponent(user.email)}`);
        
        if (userResponse.ok) {
        const userData = await userResponse.json();
        
        if (userData.success && userData.user?.userRole) {
          setDashboardUrl(userData.user.userRole === 'doctor' ? '/doctorportal' : '/patient');
        } else {
          // No role set, default to patient dashboard
            setDashboardUrl('/patient');
          }
        } else {
          // User doesn't exist (404) or other error - default to patient dashboard
          setDashboardUrl('/patient');
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        // Default to patient dashboard on error
        setDashboardUrl('/patient');
      } finally {
        setCheckingRole(false);
      }
    }

    fetchDashboardUrl();
  }, [user, isLoading, checkingRole]);

  return dashboardUrl;
}

