import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useAuth, useNotification, USER_ROLES } from '../../shared';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, state } = useAuth();
  const { showNotification } = useNotification();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Watch for successful login and redirect
  useEffect(() => {
    if (state.user && state.token) {
      const user = state.user;
      if (user.role === USER_ROLES.STUDENT) {
        navigate('/student/dashboard');
      } else if (user.role === USER_ROLES.TEACHER) {
        navigate('/teacher/dashboard');
      } else if (user.role === USER_ROLES.ADMIN) {
        navigate('/admin/dashboard');
      }
    }
  }, [state.user, state.token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      showNotification('Please enter email and password', 'error');
      return;
    }

    try {
      await login(email, password);
      showNotification('Login successful', 'success');
      // Navigation will happen automatically via useEffect above
    } catch (error) {
      showNotification(state.error || 'Login failed', 'error');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
            E-Learning LMS
          </Typography>
          <Typography variant="h6" component="h2" gutterBottom sx={{ mb: 2, color: 'gray' }}>
            Login
          </Typography>

          {state.error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {state.error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={state.loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={state.loading}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={state.loading}
            >
              {state.loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>

            <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="caption" display="block" sx={{ mb: 1, fontWeight: 'bold' }}>
                Demo Accounts:
              </Typography>
              <Typography variant="caption" display="block">
                • Admin: admin@school.edu.vn / Admin@123
              </Typography>
              <Typography variant="caption" display="block">
                • Teacher: nguyen.van.an@school.edu.vn / Teacher@123
              </Typography>
              <Typography variant="caption" display="block">
                • Student: pham.quoc.bao@school.edu.vn / Student@123
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
