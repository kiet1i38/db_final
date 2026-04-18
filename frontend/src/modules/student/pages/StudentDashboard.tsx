import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Alert,
  Stack,
} from '@mui/material';
import { useAuth } from '../../shared';
import PageShell from '../../shared/components/PageShell';
import { academicService } from '../services/academicService';
import { Section } from '../../shared/types';

export default function StudentDashboard() {
  const { state } = useAuth();
  const navigate = useNavigate();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        setLoading(true);
        const data = await academicService.getEnrolledSections();
        setSections(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load sections');
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, []);

  if (loading) {
    return (
      <PageShell title="Student Dashboard" subtitle={`Welcome, ${state.user?.fullName || state.user?.email || 'student'}`}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </PageShell>
    );
  }

  return (
    <PageShell title="Student Dashboard" subtitle="Track your courses, quizzes, and analytics">
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          mb: 3,
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 5,
          background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
          color: '#fff',
          boxShadow: '0 16px 40px rgba(15, 118, 110, 0.28)',
        }}
      >
        <Stack spacing={1}>
          <Chip label="Student overview" size="small" sx={{ width: 'fit-content', bgcolor: 'rgba(255,255,255,0.18)', color: '#fff' }} />
          <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
            Welcome back, {state.user?.fullName || state.user?.email}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.92, maxWidth: 720 }}>
            You are enrolled in {sections.length} section{sections.length === 1 ? '' : 's'}. Open a section to start quizzes or review your progress.
          </Typography>
        </Stack>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2, mb: 2 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            Your Enrolled Sections
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose a section to view quizzes and analytics.
          </Typography>
        </Box>
        <Chip label={`${sections.length} sections`} variant="outlined" />
      </Box>

      {sections.length === 0 ? (
        <Alert severity="info">You are not enrolled in any sections yet.</Alert>
      ) : (
        <Grid container spacing={3}>
          {sections.map((section) => (
            <Grid item xs={12} sm={6} md={4} key={section.sectionId}>
              <Card
                sx={{
                  borderRadius: 5,
                  boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)',
                  border: '1px solid rgba(148, 163, 184, 0.14)',
                  transition: 'transform 180ms ease, box-shadow 180ms ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)',
                  },
                }}
              >
                <CardContent>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                      <Chip label={section.term && section.academicYear ? `${section.term} ${section.academicYear}` : 'Current'} size="small" color="primary" variant="outlined" />
                      <Chip label="Enrolled" size="small" color="success" variant="outlined" />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.2 }}>
                      {section.sectionName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ minHeight: 42 }}>
                      {section.courseName} / {section.facultyName}
                    </Typography>
                  </Stack>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
                  <Button fullWidth variant="contained" onClick={() => navigate(`/student/sections/${section.sectionId}`)} sx={{ minHeight: 42 }}>
                    View Quizzes
                  </Button>
                  <Button fullWidth variant="outlined" onClick={() => navigate(`/student/sections/${section.sectionId}/analytics`)} sx={{ minHeight: 42 }}>
                    Analytics
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </PageShell>
  );
}
