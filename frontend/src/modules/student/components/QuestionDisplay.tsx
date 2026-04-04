import React from 'react';
import {
  Box,
  Typography,
  FormControlLabel,
  Radio,
  Checkbox,
  RadioGroup,
  FormGroup,
  Paper,
} from '@mui/material';
import { Question, AnswerOption } from '../../shared/types';

interface QuestionDisplayProps {
  questionNumber: number;
  totalQuestions: number;
  question: Question;
  selectedAnswers: string[];
  onChange: (optionIds: string[]) => void;
}

export default function QuestionDisplay({
  questionNumber,
  totalQuestions,
  question,
  selectedAnswers,
  onChange,
}: QuestionDisplayProps) {
  const handleSingleChoice = (optionId: string) => {
    onChange([optionId]);
  };

  const handleMultipleChoice = (optionId: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedAnswers, optionId]);
    } else {
      onChange(selectedAnswers.filter((id) => id !== optionId));
    }
  };

  const isSingleChoice = question.questionType === 'SINGLE_CHOICE';

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      {/* Question Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" sx={{ color: 'textSecondary', fontWeight: 600 }}>
          Question {questionNumber} of {totalQuestions}
        </Typography>
        <Typography variant="h5" sx={{ mt: 1, fontWeight: 600 }}>
          {question.content}
        </Typography>
      </Box>

      {/* Options */}
      <Box sx={{ mt: 3 }}>
        {isSingleChoice ? (
          // Single Choice - Radio Buttons
          <RadioGroup
            value={selectedAnswers[0] || ''}
            onChange={(e) => handleSingleChoice(e.target.value)}
          >
            {question.answerOptions.map((option: AnswerOption) => (
              <FormControlLabel
                key={option.id}
                value={option.id}
                control={<Radio />}
                label={
                  <Typography sx={{ ml: 1 }}>
                    {option.content}
                  </Typography>
                }
                sx={{
                  p: 1.5,
                  mb: 1,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  },
                  backgroundColor: selectedAnswers[0] === option.id ? '#f0f7ff' : 'transparent',
                  transition: 'background-color 0.2s',
                }}
              />
            ))}
          </RadioGroup>
        ) : (
          // Multiple Choice - Checkboxes
          <FormGroup>
            {question.answerOptions.map((option: AnswerOption) => (
              <FormControlLabel
                key={option.id}
                control={
                  <Checkbox
                    checked={selectedAnswers.includes(option.id)}
                    onChange={(e) => handleMultipleChoice(option.id, e.target.checked)}
                  />
                }
                label={
                  <Typography sx={{ ml: 1 }}>
                    {option.content}
                  </Typography>
                }
                sx={{
                  p: 1.5,
                  mb: 1,
                  border: '1px solid #e0e0e0',
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                  },
                  backgroundColor: selectedAnswers.includes(option.id)
                    ? '#f0f7ff'
                    : 'transparent',
                  transition: 'background-color 0.2s',
                }}
              />
            ))}
          </FormGroup>
        )}
      </Box>

      {/* Hint */}
      {!isSingleChoice && (
        <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'info.main' }}>
          ℹ️ Select all that apply
        </Typography>
      )}
    </Paper>
  );
}
