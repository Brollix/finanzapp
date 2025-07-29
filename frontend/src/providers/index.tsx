import React from 'react';
import { AuthProvider } from '@/features/auth/context/AuthContext';
import { OcrProvider } from '@/context/OcrContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <OcrProvider>
        {children}
      </OcrProvider>
    </AuthProvider>
  );
}
