import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/stores/auth.store';
import { authApi } from '@/lib/api';
import { extractError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export function useLogin() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: { email: string; password: string }) => authApi.login(data),
    onSuccess: ({ data }) => {
      const { accessToken, user } = data.data;
      setAuth(user, accessToken);
      router.push('/dashboard');
    },
    onError: (err) => toast.error(extractError(err)),
  });
}

export function useLogout() {
  const { clearAuth } = useAuthStore();
  const router = useRouter();

  return () => {
    clearAuth();
    router.push('/login');
  };
}

export function useOwnerSignup() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: { fullName: string; email: string; password: string; companyName: string }) =>
      authApi.signup(data),
    onSuccess: ({ data }) => {
      setAuth(data.data.user, data.data.accessToken);
      router.push('/dashboard');
    },
    onError: (err) => toast.error(extractError(err)),
  });
}

export function useAcceptInvite() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: { token: string; fullName: string; password: string }) =>
      authApi.acceptInvite(data),
    onSuccess: ({ data }) => {
      setAuth(data.data.user, data.data.accessToken);
      router.push('/dashboard');
    },
    onError: (err) => toast.error(extractError(err)),
  });
}

export function useEmployeeSignup() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (data: { fullName: string; email: string; password: string; companySlug: string }) =>
      authApi.employeeSignup(data),
    onSuccess: ({ data }) => {
      setAuth(data.data.user, data.data.accessToken);
      router.push('/dashboard');
    },
    onError: (err) => toast.error(extractError(err)),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (data: { email: string }) => authApi.forgotPassword(data),
    onSuccess: ({ data }) => {
      toast.success(data.data.message || 'Password reset link sent successfully.');
    },
    onError: (err) => toast.error(extractError(err)),
  });
}

export function useResetPassword() {
  const router = useRouter();
  return useMutation({
    mutationFn: (data: { token: string; password: string }) => authApi.resetPassword(data),
    onSuccess: ({ data }) => {
      toast.success(data.data.message || 'Password reset successfully.');
      router.push('/login');
    },
    onError: (err) => toast.error(extractError(err)),
  });
}
