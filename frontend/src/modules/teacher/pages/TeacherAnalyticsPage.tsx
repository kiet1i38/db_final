import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth, Navbar, useNotification } from '../../shared';
import { analyticsService } from '../services/analyticsService';
import {
  QuizPerformance,
  AtRiskStudent,
  ScoreDistributionBucket,
  QuestionFailureRate,
} from '../../shared/types';
import { formatters } from '../../shared/utils/formatters';

export default function TeacherAnalyticsPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [performance, setPerformance] = useState<QuizPerformance[]>([]);
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [scoreDistribution, setScoreDistribution] = useState<ScoreDistributionBucket[]>([]);
  const [questionFailureRate, setQuestionFailureRate] = useState<QuestionFailureRate[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!sectionId) {
        setError('No section ID provided');
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching analytics for section:', sectionId);

        const perfData = await analyticsService.getQuizPerformance(sectionId);
        console.log('Performance data:', perfData);
        setPerformance(perfData);

        const riskData = await analyticsService.getAtRiskStudents(sectionId);
        console.log('At-risk students:', riskData);
        setAtRiskStudents(riskData);

        // Fetch score distribution and question failure rate for first quiz if available
        if (perfData.length > 0) {
          const firstQuizId = perfData[0].quizId;
          console.log('First quiz ID:', firstQuizId);

          try {
            const scoreData = await analyticsService.getScoreDistribution(sectionId, firstQuizId);
            console.log('Score distribution:', scoreData);
            setScoreDistribution(scoreData.buckets || []);
          } catch (scoreErr) {
            console.error('Failed to load score distribution:', scoreErr);
          }

          try {
            const questionData = await analyticsService.getQuestionFailureRate(
              sectionId,
              firstQuizId
            );
            console.log('Question failure rates:', questionData);
            setQuestionFailureRate(questionData);
          } catch (qErr) {
            console.error('Failed to load question failure rate:', qErr);
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to load analytics';
        console.error('Error loading analytics:', err);
        console.error('Error details:', {
          message: errorMsg,
          stack: err instanceof Error ? err.stack : 'N/A',
          sectionId,
        });
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [sectionId, showNotification]);

  if (loading) {
    return (
      <>
        <Navbar />
        <Container>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        </Container>
      </>
    );
  }

  const chartColors = ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0'];

  return (
    <>
      <Navbar />
      <Container maxWidth="lg">
        <Box sx={{ py: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
              variant="outlined"
            >
              Back
            </Button>
            <div>
              <Typography variant="h4">Analytics</Typography>
              <Typography variant="body2" color="textSecondary">
                Section performance overview
              </Typography>
            </div>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Quiz Performance */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            📊 Quiz Performance
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Quiz</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Total Attempts
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Completion Rate
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Average Score
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {performance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No quiz data yet
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  performance.map((perf) => (
                    <TableRow key={perf.quizId}>
                      <TableCell>{perf.quizTitle}</TableCell>
                      <TableCell align="right">{perf.totalAttempts}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={formatters.formatPercentage(perf.completionRate, 1)}
                          color={perf.completionRate >= 80 ? 'success' : 'warning'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {formatters.formatScore(perf.averageScore, perf.maxScore)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* At-Risk Students */}
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
            ⚠️ At-Risk Students
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 4 }}>
            <Table>
              <TableHead sx={{ backgroundColor: '#ffebee' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Student</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Risk Level
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Participation
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Avg Score
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!atRiskStudents || atRiskStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" color="textSecondary">
                        All students are doing well!
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  Array.isArray(atRiskStudents) && atRiskStudents.map((student) => (
                    <TableRow key={student.studentId}>
                      <TableCell>{student.studentName}</TableCell>
                      <TableCell align="right">
                        <Chip
                          label={student.riskLevel}
                          color={
                            student.riskLevel === 'HIGH'
                              ? 'error'
                              : student.riskLevel === 'MEDIUM'
                              ? 'warning'
                              : 'success'
                          }
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {formatters.formatPercentage(student.participationRate, 1)}
                      </TableCell>
                      <TableCell align="right">
                        {formatters.formatPercentage(student.averageScore, 1)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Charts Grid */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {/* Score Distribution Chart */}
            {scoreDistribution.length > 0 && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                      Score Distribution
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={scoreDistribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="minScore"
                          label={{ value: 'Score Range', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis label={{ value: 'Students', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#2196f3" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Question Failure Rate */}
            {questionFailureRate.length > 0 && (
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                      Question Difficulty
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={questionFailureRate}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="questionId" />
                        <YAxis label={{ value: 'Failure Rate %', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Bar dataKey="failureRate" fill="#f44336" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>

          {/* Summary Stats */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Quizzes
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {performance.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    At-Risk Students
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                    {Array.isArray(atRiskStudents) ? atRiskStudents.length : 0}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Avg Completion
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {performance.length > 0
                      ? formatters.formatPercentage(
                          performance.reduce((sum, p) => sum + p.completionRate, 0) /
                            performance.length,
                          1
                        )
                      : 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Avg Score
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {performance.length > 0
                      ? formatters.formatPercentage(
                          (performance.reduce((sum, p) => sum + (p.averageScore / p.maxScore) * 100, 0) /
                            performance.length),
                          1
                        )
                      : 'N/A'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </>
  );
}
