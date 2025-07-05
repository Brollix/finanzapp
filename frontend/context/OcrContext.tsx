import React, { createContext, useState, useContext, ReactNode } from 'react';

interface OcrResult {
  text: string;
}

interface OcrContextType {
  isLoading: boolean;
  ocrResult: OcrResult | null;
  ocrError: Error | null;
  startOcr: () => void;
  setOcrSuccess: (result: OcrResult) => void;
  setOcrError: (error: Error) => void;
  clearOcrState: () => void;
}

const OcrContext = createContext<OcrContextType | undefined>(undefined);

export const OcrProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [ocrError, setOcrErrorState] = useState<Error | null>(null);

  const startOcr = () => {
    setIsLoading(true);
    setOcrResult(null);
    setOcrErrorState(null);
  };

  const setOcrSuccess = (result: OcrResult) => {
    setIsLoading(false);
    setOcrResult(result);
  };

  const setOcrError = (error: Error) => {
    setIsLoading(false);
    setOcrErrorState(error);
  };

  const clearOcrState = () => {
    setOcrResult(null);
    setOcrErrorState(null);
  };

  return (
    <OcrContext.Provider value={{ isLoading, ocrResult, ocrError, startOcr, setOcrSuccess, setOcrError, clearOcrState }}>
      {children}
    </OcrContext.Provider>
  );
};

export const useOcr = () => {
  const context = useContext(OcrContext);
  if (context === undefined) {
    throw new Error('useOcr must be used within an OcrProvider');
  }
  return context;
};
