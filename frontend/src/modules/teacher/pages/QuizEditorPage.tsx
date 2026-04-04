import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Stack,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import PublishIcon from '@mui/icons-material/Publish';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useAuth, Navbar, useNotification } from '../../shared';
import { quizService } from '../services/quizService';
import { Quiz, CreateQuizRequest, AddQuestionRequest } from '../../shared/types';
import QuestionEditor from '../components/QuestionEditor';

export default function QuizEditorPage() {
  const { quizId } = useParams<{ quizId: string }>();
  const [searchParams] = useSearchParams();
  const sectionId = searchParams.get('sectionId');
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  // State
  const [loading, setLoading] = useState(!!quizId);
  const [saving, setSaving] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [maxScore, setMaxScore] = useState(100);
  const [deadlineAt, setDeadlineAt] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  const [isDirty, setIsDirty] = useState(false);
  const [publishDialog, setPublishDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [hideDialog, setHideDialog] = useState(false);

  // Load quiz if editing, or initialize empty quiz if creating
  useEffect(() => {
    if (quizId) {
      // Edit mode - load existing quiz
      const loadQuiz = async () => {
        try {
          setLoading(true);
          const data = await quizService.getQuiz(quizId);
          console.log('Quiz loaded:', data);
          console.log('Questions:', data.questions);
          data.questions.forEach((q, idx) => {
            console.log(`Question ${idx}:`, {
              questionId: q.questionId,
              content: q.content,
              questionType: q.questionType,
              answerOptions: q.answerOptions
            });
          });
          // Mark all questions from backend and store original data
          const quizWithFlags = {
            ...data,
            questions: data.questions.map(q => ({
              ...q,
              fromBackend: true,
              __original: JSON.stringify({
                content: q.content,
                questionType: q.questionType,
                answerOptions: q.answerOptions.map(o => ({
                  content: o.content,
                  isCorrect: o.isCorrect,
                }))
              })
            }))
          };
          setQuiz(quizWithFlags);
          setTitle(data.title);
          setDescription(data.description);
          setTimeLimitMinutes(data.timeLimitMinutes);
          setMaxAttempts(data.maxAttempts);
          setMaxScore(data.maxScore);
          setDeadlineAt(new Date(data.deadlineAt).toISOString().split('T')[0]);
        } catch (err) {
          showNotification(
            err instanceof Error ? err.message : 'Failed to load quiz',
            'error'
          );
          navigate(-1);
        } finally {
          setLoading(false);
        }
      };
      loadQuiz();
    } else if (!quiz && !sectionId) {
      // Create mode but no sectionId
      showNotification('Section ID is required to create a quiz', 'error');
      navigate(-1);
    } else if (!quiz) {
      // Create mode - initialize empty quiz
      setQuiz({
        id: '',
        quizId: '',
        teacherId: '',
        sectionId: sectionId || '',
        title: '',
        description: '',
        timeLimitMinutes: 30,
        deadlineAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxAttempts: 3,
        maxScore: 100,
        status: 'DRAFT',
        questions: [
          {
            id: '1',
            questionId: '1',
            content: 'Sample Question',
            questionType: 'MULTIPLE_CHOICE' as const,
            answerOptions: [
              { id: '1', optionId: '1', content: 'Option 1', isCorrect: true },
              { id: '2', optionId: '2', content: 'Option 2', isCorrect: false },
            ],
            fromBackend: false,  // Mark as new
          },
        ],
      });
      setLoading(false);
    }
  }, [quizId, sectionId, navigate, showNotification]);

  const handleAddQuestion = () => {
    if (!quiz) return;

    const newQuestionId = Math.random().toString(36).substring(7);
    const newQuestion = {
      id: newQuestionId,
      questionId: newQuestionId,
      content: '',
      questionType: 'MULTIPLE_CHOICE' as const,
      answerOptions: [
        { id: '1', optionId: '1', content: 'Option 1', isCorrect: true },
        { id: '2', optionId: '2', content: 'Option 2', isCorrect: false },
      ],
      fromBackend: false,  // Mark as new, not from backend
    };

    setQuiz({
      ...quiz,
      questions: [...quiz.questions, newQuestion],
    });
    setIsDirty(true);
  };

  const handleUpdateQuestion = (index: number, updatedQuestion: any) => {
    if (!quiz) return;

    const newQuestions = [...quiz.questions];
    newQuestions[index] = updatedQuestion;
    setQuiz({ ...quiz, questions: newQuestions });
    setIsDirty(true);
  };

  const handleDeleteQuestion = (index: number) => {
    if (!quiz) return;

    const newQuestions = quiz.questions.filter((_, i) => i !== index);
    setQuiz({ ...quiz, questions: newQuestions });
    setIsDirty(true);
  };

  // Helper: check if a question has been modified from its original backend version
  const isQuestionModified = (question: any): boolean => {
    if (!question.__original) return false;
    try {
      const original = JSON.parse(question.__original);
      const current = {
        content: question.content,
        questionType: question.questionType,
        answerOptions: question.answerOptions.map((o: any) => ({
          content: o.content,
          isCorrect: o.isCorrect,
        })),
      };
      return JSON.stringify(original) !== JSON.stringify(current);
    } catch {
      return false;
    }
  };

  const validateQuiz = (): boolean => {
    if (!title.trim()) {
      showNotification('Quiz title is required', 'error');
      return false;
    }

    if (!quiz || quiz.questions.length === 0) {
      showNotification('Quiz must have at least 1 question', 'error');
      return false;
    }

    // Validate each question
    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i];

      if (!q.content.trim()) {
        showNotification(`Question ${i + 1} content is required`, 'error');
        return false;
      }

      if (q.answerOptions.length < 2) {
        showNotification(`Question ${i + 1} must have at least 2 options`, 'error');
        return false;
      }

      if (!q.answerOptions.some((opt) => opt.isCorrect)) {
        showNotification(`Question ${i + 1} must have at least 1 correct answer`, 'error');
        return false;
      }

      for (const opt of q.answerOptions) {
        if (!opt.content.trim()) {
          showNotification(`Question ${i + 1} has an empty option`, 'error');
          return false;
        }
      }
    }

    return true;
  };

  const handleSaveDraft = async () => {
    if (!validateQuiz()) return;

    try {
      setSaving(true);

      if (quizId) {
        // Update existing quiz
        await quizService.updateQuiz(quizId, {
          title,
          description,
          timeLimitMinutes,
          maxAttempts,
          maxScore,
          deadlineAt: deadlineAt + 'T23:59:59Z',
        });

        // Update questions
        for (const question of quiz!.questions) {
          if (question.fromBackend) {
            // Check if question was modified
            if (isQuestionModified(question)) {
              console.log('Question modified, deleting and re-adding:', question.content);
              // Delete the old question
              await quizService.deleteQuestion(quizId, question.questionId);
              // Re-add it with new data
              await quizService.addQuestion(quizId, {
                content: question.content,
                questionType: question.questionType,
                answerOptions: question.answerOptions.map(opt => ({
                  content: opt.content,
                  isCorrect: opt.isCorrect,
                })),
              });
            }
            // If not modified, skip (already saved)
            continue;
          }

          // Add new question
          console.log('Adding new question:', question.content);
          await quizService.addQuestion(quizId, {
            content: question.content,
            questionType: question.questionType,
            answerOptions: question.answerOptions.map(opt => ({
              content: opt.content,
              isCorrect: opt.isCorrect,
            })),
          });
        }
      } else {
        // Create new quiz
        try {
          const newQuiz = await quizService.createQuiz(sectionId!, {
            title,
            description,
            timeLimitMinutes,
            maxAttempts,
            maxScore,
            deadlineAt: deadlineAt + 'T23:59:59Z',
          });

          console.log('Quiz created with ID:', newQuiz.quizId || newQuiz.id);

          // Add questions
          for (const question of quiz!.questions) {
            try {
              console.log('=== Adding question ===');
              console.log('Question content:', question.content);
              console.log('Question type:', question.questionType);
              console.log('Answer options COUNT:', question.answerOptions.length);
              console.log('Answer options:', question.answerOptions);
              question.answerOptions.forEach((opt, idx) => {
                console.log(`  Option ${idx}:`, { content: opt.content, isCorrect: opt.isCorrect, id: opt.id, optionId: opt.optionId });
              });

              const requestData = {
                content: question.content,
                questionType: question.questionType,
                answerOptions: question.answerOptions.map(opt => ({
                  content: opt.content,
                  isCorrect: opt.isCorrect,
                })),
              };
              console.log('REQUEST DATA:', requestData);

              await quizService.addQuestion(newQuiz.quizId || newQuiz.id || '', requestData);
            } catch (qErr) {
              console.error('Error adding question:', qErr);
              console.error('Question data:', question);
              const errorData = (qErr as any)?.response?.data;
              console.error('Backend error response:', errorData);
              throw qErr;
            }
          }
        } catch (createErr) {
          console.error('Error creating quiz:', createErr);
          console.error('SectionId:', sectionId);
          console.error('Quiz data:', { title, description, timeLimitMinutes, maxAttempts, maxScore });
          const errorData = (createErr as any)?.response?.data;
          console.error('Backend error response:', errorData);
          throw createErr;
        }
      }

      showNotification('Quiz saved successfully!', 'success');
      setIsDirty(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save quiz';
      console.error('Full error object:', err);
      showNotification(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!quizId) {
      showNotification('Save quiz first before publishing', 'error');
      return;
    }

    try {
      setSaving(true);
      await quizService.publishQuiz(quizId);
      showNotification('Quiz published successfully!', 'success');
      setPublishDialog(false);
      // Reload quiz to update status
      const updated = await quizService.getQuiz(quizId);
      setQuiz(updated);
    } catch (err) {
      showNotification(
        err instanceof Error ? err.message : 'Failed to publish quiz',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleHide = async () => {
    if (!quizId) return;

    try {
      setSaving(true);
      await quizService.hideQuiz(quizId);
      showNotification('Quiz hidden successfully!', 'success');
      setHideDialog(false);
      // Reload quiz to update status
      const updated = await quizService.getQuiz(quizId);
      setQuiz(updated);
    } catch (err) {
      showNotification(
        err instanceof Error ? err.message : 'Failed to hide quiz',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!quizId) return;

    try {
      setSaving(true);
      await quizService.deleteQuiz(quizId);
      showNotification('Quiz deleted successfully!', 'success');
      setDeleteDialog(false);
      setTimeout(() => navigate(-1), 500);
    } catch (err) {
      showNotification(
        err instanceof Error ? err.message : 'Failed to delete quiz',
        'error'
      );
    } finally {
      setSaving(false);
    }
  };

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

  if (!quiz && !quizId) {
    // Initialize new quiz
    if (!quiz) {
      setQuiz({
        id: '',
        quizId: '',
        teacherId: '',
        sectionId: sectionId || '',
        title: '',
        description: '',
        timeLimitMinutes: 30,
        deadlineAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxAttempts: 3,
        maxScore: 100,
        status: 'DRAFT',
        questions: [
          {
            id: '1',
            questionId: '1',
            content: 'Sample Question',
            questionType: 'SINGLE_CHOICE',
            answerOptions: [
              { id: '1', optionId: '1', content: 'Option 1', isCorrect: true },
              { id: '2', optionId: '2', content: 'Option 2', isCorrect: false },
            ],
          },
        ],
      });
    }
  }

  return (
    <>
      <Navbar />
      <Container maxWidth="lg">
        <Box sx={{ py: 3 }}>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <IconButton onClick={() => navigate(-1)}>
              <ArrowBackIcon />
            </IconButton>
            <div>
              <Typography variant="h4">
                {quizId ? 'Edit Quiz' : 'Create New Quiz'}
              </Typography>
            </div>
            {isDirty && (
              <Typography variant="caption" sx={{ ml: 'auto', color: 'warning.main' }}>
                ⚠️ Unsaved changes
              </Typography>
            )}
          </Box>

          {/* Quiz Metadata Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Stack spacing={2}>
                {/* Title */}
                <TextField
                  fullWidth
                  label="Quiz Title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setIsDirty(true);
                  }}
                />

                {/* Description */}
                <TextField
                  fullWidth
                  label="Description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setIsDirty(true);
                  }}
                  multiline
                  rows={2}
                />

                {/* Settings Row 1 */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    label="Time Limit (minutes)"
                    type="number"
                    value={timeLimitMinutes}
                    onChange={(e) => {
                      setTimeLimitMinutes(parseInt(e.target.value) || 30);
                      setIsDirty(true);
                    }}
                    inputProps={{ min: 1, max: 480 }}
                  />

                  <TextField
                    label="Max Attempts"
                    type="number"
                    value={maxAttempts}
                    onChange={(e) => {
                      setMaxAttempts(parseInt(e.target.value) || 1);
                      setIsDirty(true);
                    }}
                    inputProps={{ min: 1, max: 10 }}
                  />

                  <TextField
                    label="Max Score"
                    type="number"
                    value={maxScore}
                    onChange={(e) => {
                      setMaxScore(parseInt(e.target.value) || 100);
                      setIsDirty(true);
                    }}
                    inputProps={{ min: 1 }}
                  />
                </Stack>

                {/* Deadline */}
                <TextField
                  label="Deadline Date"
                  type="date"
                  value={deadlineAt}
                  onChange={(e) => {
                    setDeadlineAt(e.target.value);
                    setIsDirty(true);
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Questions Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Questions ({quiz?.questions.length || 0})
            </Typography>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddQuestion}
              variant="outlined"
            >
              Add Question
            </Button>
          </Box>

          {/* Questions List */}
          {quiz && quiz.questions.length === 0 ? (
            <Alert severity="info">No questions yet. Add one to get started!</Alert>
          ) : (
            <Stack spacing={2}>
              {quiz?.questions.map((question, index) => (
                <QuestionEditor
                  key={question.id}
                  question={question}
                  onUpdate={(updated) => handleUpdateQuestion(index, updated)}
                  onDelete={() => handleDeleteQuestion(index)}
                />
              ))}
            </Stack>
          )}

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'space-between', flexWrap: 'wrap' }}>
            {/* Left side - Cancel */}
            <Button variant="outlined" onClick={() => navigate(-1)}>
              Cancel
            </Button>

            {/* Right side - Save, Delete, Publish, etc */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                startIcon={<SaveIcon />}
                variant="contained"
                onClick={handleSaveDraft}
                disabled={saving || !isDirty}
              >
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>

              {/* Show action buttons only if quiz exists and has an ID */}
              {quizId && quiz && (
                <>
                  {/* Delete Quiz button - for DRAFT, HIDDEN, or undefined status */}
                  {(!quiz.status || quiz.status === 'Draft' || quiz.status === 'DRAFT' || quiz.status === 'Hidden' || quiz.status === 'HIDDEN') && (
                    <Button
                      startIcon={<DeleteIcon />}
                      variant="outlined"
                      color="error"
                      onClick={() => setDeleteDialog(true)}
                      disabled={saving}
                    >
                      Delete Quiz
                    </Button>
                  )}

                  {/* Publish button - for DRAFT or undefined status */}
                  {(!quiz.status || quiz.status === 'Draft' || quiz.status === 'DRAFT') && (
                    <Button
                      startIcon={<PublishIcon />}
                      variant="contained"
                      color="success"
                      onClick={() => setPublishDialog(true)}
                      disabled={saving}
                    >
                      Publish
                    </Button>
                  )}

                  {/* Hide Quiz button - for PUBLISHED status */}
                  {(quiz.status === 'Published' || quiz.status === 'PUBLISHED') && (
                    <Button
                      startIcon={<VisibilityOffIcon />}
                      variant="outlined"
                      color="warning"
                      onClick={() => setHideDialog(true)}
                      disabled={saving}
                    >
                      Hide Quiz
                    </Button>
                  )}

                  {/* Publish Again button - for HIDDEN status */}
                  {(quiz.status === 'Hidden' || quiz.status === 'HIDDEN') && (
                    <Button
                      startIcon={<PublishIcon />}
                      variant="contained"
                      color="success"
                      onClick={() => setPublishDialog(true)}
                      disabled={saving}
                    >
                      Publish Again
                    </Button>
                  )}
                </>
              )}
            </Box>
          </Box>

          {/* Publish Dialog */}
          <Dialog open={publishDialog} onClose={() => setPublishDialog(false)}>
            <DialogTitle>Publish Quiz?</DialogTitle>
            <DialogContent>
              <Typography>
                Once published, students will be able to see and take this quiz. Make sure all
                questions and options are correct before publishing.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPublishDialog(false)}>Cancel</Button>
              <Button
                onClick={handlePublish}
                variant="contained"
                color="success"
                disabled={saving}
              >
                {saving ? 'Publishing...' : 'Publish'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Hide Dialog */}
          <Dialog open={hideDialog} onClose={() => setHideDialog(false)}>
            <DialogTitle>Hide Quiz?</DialogTitle>
            <DialogContent>
              <Typography>
                Students will not be able to see this quiz anymore. Existing attempts will still be graded.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setHideDialog(false)}>Cancel</Button>
              <Button
                onClick={handleHide}
                variant="contained"
                color="warning"
                disabled={saving}
              >
                {saving ? 'Hiding...' : 'Hide'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Delete Dialog */}
          <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
            <DialogTitle>Delete Quiz?</DialogTitle>
            <DialogContent>
              <Typography>
                This action cannot be undone. All questions and responses will be permanently deleted.
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
              <Button
                onClick={handleDelete}
                variant="contained"
                color="error"
                disabled={saving}
              >
                {saving ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Container>
    </>
  );
}
