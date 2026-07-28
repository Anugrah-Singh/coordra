"use client";

import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authApi } from '../api';
import { queryClient } from '../lib/queryClient';
import type { User } from '../types/api';

const AUTH_QUERY_KEY = ['auth', 'me'] as const;

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (input: { email: string; password: string }) => Promise<User>;
  register: (input: {
    email: string;
    password: string;
    fullName: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const authQuery = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => (await authApi.me()).user,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ user }) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (input: {
      email: string;
      password: string;
      fullName: string;
    }) => {
      await authApi.register(input);
      const { user } = await authApi.login({
        email: input.email,
        password: input.password,
      });
      return user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear();
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
    },
  });

  const value = useMemo<AuthContextValue>(
    () => ({
      user: authQuery.data ?? null,
      isLoading: authQuery.isLoading,
      login: async (input) => (await loginMutation.mutateAsync(input)).user,
      register: registerMutation.mutateAsync,
      logout: logoutMutation.mutateAsync,
    }),
    [
      authQuery.data,
      authQuery.isLoading,
      loginMutation,
      logoutMutation.mutateAsync,
      registerMutation.mutateAsync,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};
