import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Stack,
  Box,
  Typography,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { Question, QuestionType } from '../../shared/types';
import AnswerOptionForm from './AnswerOptionForm';

interface QuestionEditorProps {
  question: Question;
  onUpdate: (question: Question) => void;
  onDelete: () => void;
}

export default function QuestionEditor({ question, onUpdate, onDelete }: QuestionEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAddOption = () => {
    const newOptionId = Math.random().toString(36).substring(7);
    const newOption = {
      id: newOptionId,
      optionId: newOptionId,
      content: '',
      isCorrect: false,
    };
    onUpdate({
      ...question,
      answerOptions: [...question.answerOptions, newOption],
    });
  };

  const handleUpdateOption = (optionId: string, content: string, isCorrect: boolean) => {
    onUpdate({
      ...question,
      answerOptions: question.answerOptions.map((opt) =>
        opt.id === optionId ? { ...opt, content, isCorrect } : opt
      ),
    });
  };

  const handleDeleteOption = (optionId: string) => {
    onUpdate({
      ...question,
      answerOptions: question.answerOptions.filter((opt) => opt.id !== optionId),
    });
  };

  const hasCorrectAnswer = question.answerOptions.some((opt) => opt.isCorrect);

  return (
    <Card sx={{ mb: 2, backgroundColor: isExpanded ? '#fafafa' : 'white' }}>
      <CardContent>
        {/* Summary View */}
        {!isExpanded && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              p: 1,
              '&:hover': { backgroundColor: '#f5f5f5' },
              borderRadius: 1,
            }}
            onClick={() => setIsExpanded(true)}
          >
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {question.content || '(No content)'}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {question.questionType} • {question.answerOptions.length} options
              </Typography>
            </Box>
            {!hasCorrectAnswer && (
              <Typography variant="caption" sx={{ color: 'warning.main', ml: 1 }}>
                ⚠️ No correct answer
              </Typography>
            )}
          </Box>
        )}

        {/* Expanded View */}
        {isExpanded && (
          <Stack spacing={2}>
            {/* Question Text */}
            <TextField
              fullWidth
              label="Question"
              value={question.content}
              onChange={(e) => onUpdate({ ...question, content: e.target.value })}
              multiline
              rows={3}
              variant="outlined"
            />

            {/* Question Type */}
            <FormControl>
              <InputLabel>Question Type</InputLabel>
              <Select
                value={question.questionType}
                onChange={(e) =>
                  onUpdate({ ...question, questionType: e.target.value as QuestionType })
                }
                label="Question Type"
              >
                <MenuItem value="SINGLE_CHOICE">Single Choice (Radio)</MenuItem>
                <MenuItem value="MULTIPLE_CHOICE">Multiple Choice (Checkbox)</MenuItem>
              </Select>
            </FormControl>

            {/* Answer Options */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Answer Options
                </Typography>
                {!hasCorrectAnswer && (
                  <Typography variant="caption" sx={{ color: 'warning.main' }}>
                    ⚠️ Mark at least 1 as correct
                  </Typography>
                )}
              </Box>

              <Stack spacing={1}>
                {question.answerOptions.map((option) => (
                  <AnswerOptionForm
                    key={option.id}
                    option={option}
                    onUpdate={(content, isCorrect) =>
                      handleUpdateOption(option.id, content, isCorrect)
                    }
                    onDelete={() => handleDeleteOption(option.id)}
                  />
                ))}
              </Stack>

              {/* Add Option Button */}
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddOption}
                fullWidth
                variant="outlined"
                sx={{ mt: 2 }}
              >
                Add Option
              </Button>
            </Box>
          </Stack>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between' }}>
        <Button onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? 'Collapse' : 'Expand'}
        </Button>
        <IconButton size="small" color="error" onClick={onDelete}>
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
}
