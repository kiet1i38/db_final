import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
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
  Fab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useAuth, Navbar } from '../../shared';
import { academicService } from '../../student/services/academicService';
import { Section } from '../../shared/types';

export default function TeacherDashboard() {
  const { state } = useAuth();
  const navigate = useNavigate();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        setLoading(true);
        const data = await academicService.getTeachingSections();
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
      <>
        <Navbar />
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ mb: 1 }}>
              Welcome, {state.user?.fullName || state.user?.email}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Teacher Dashboard
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Your Teaching Sections ({sections.length})
            </Typography>

            {sections.length === 0 ? (
              <Alert severity="info">You are not teaching any sections yet.</Alert>
            ) : (
              <Grid container spacing={3}>
                {sections.map((section) => (
                  <Grid item xs={12} sm={6} md={4} key={section.sectionId}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" component="div">
                          {section.sectionName}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                          {section.courseName} / {section.facultyName}
                        </Typography>
                        <Chip
                          label={section.term && section.academicYear ? `${section.term} ${section.academicYear}` : 'N/A'}
                          size="small"
                          sx={{ mt: 1 }}
                          variant="outlined"
                        />
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          onClick={() => navigate(`/teacher/sections/${section.sectionId}`)}
                        >
                          Manage Quizzes
                        </Button>
                        <Button
                          size="small"
                          onClick={() => navigate(`/teacher/sections/${section.sectionId}/analytics`)}
                        >
                          Analytics
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>

          <Fab
            color="primary"
            aria-label="create quiz"
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
            }}
            title="Create New Quiz"
          >
            <AddIcon />
          </Fab>
        </Box>
      </Container>
    </>
  );
}
