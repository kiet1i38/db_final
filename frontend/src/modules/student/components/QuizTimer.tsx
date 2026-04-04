import React, { useState, useEffect } from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';

interface QuizTimerProps {
  initialSeconds: number;
  onTimeExpired: () => void;
  isPaused?: boolean;
}

export default function QuizTimer({ initialSeconds, onTimeExpired, isPaused = false }: QuizTimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (isPaused) return;

    if (seconds <= 0) {
      onTimeExpired();
      return;
    }

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds, onTimeExpired, isPaused]);

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const totalSeconds = initialSeconds;
  const progress = ((totalSeconds - seconds) / totalSeconds) * 100;

  // Color logic: green → yellow at 5min → red at 1min
  const getColor = (): 'success' | 'warning' | 'error' => {
    if (seconds <= 60) return 'error';
    if (seconds <= 300) return 'warning';
    return 'success';
  };

  const getTextColor = (): string => {
    if (seconds <= 60) return '#d32f2f';
    if (seconds <= 300) return '#f57c00';
    return '#388e3c';
  };

  return (
    <Box
      sx={{
        p: 2,
        backgroundColor: '#f5f5f5',
        borderRadius: 1,
        border: `2px solid ${getTextColor()}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        {seconds <= 60 && <WarningIcon sx={{ color: '#d32f2f', fontSize: 20 }} />}
        <Typography variant="body2" sx={{ fontWeight: 600, color: getTextColor() }}>
          Time Remaining:
        </Typography>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: getTextColor(),
            fontFamily: 'monospace',
            fontSize: '1.5rem',
          }}
        >
          {String(minutes).padStart(2, '0')}:{String(remainingSeconds).padStart(2, '0')}
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={progress}
        color={getColor()}
        sx={{ height: 6, borderRadius: 1 }}
      />

      {seconds <= 60 && (
        <Typography variant="caption" sx={{ color: '#d32f2f', fontWeight: 600, display: 'block', mt: 1 }}>
          ⚠️ Less than 1 minute remaining!
        </Typography>
      )}
    </Box>
  );
}
