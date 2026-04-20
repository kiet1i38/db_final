import React from 'react';
import {
  TextField,
  FormControlLabel,
  Checkbox,
  Radio,
  IconButton,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { AnswerOption, QuestionType } from '../../shared/types';

interface AnswerOptionFormProps {
  option: AnswerOption;
  questionType: QuestionType;
  onUpdate: (content: string, isCorrect: boolean) => void;
  onDelete: () => void;
}

export default function AnswerOptionForm({ option, questionType, onUpdate, onDelete }: AnswerOptionFormProps) {
  const CorrectControl = questionType === 'SINGLE_CHOICE' ? Radio : Checkbox;

  return (
    <Card sx={{ mb: 1.5 }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          <TextField
            fullWidth
            size="small"
            label="Option text"
            value={option.content}
            onChange={(e) => onUpdate(e.target.value, option.isCorrect)}
            multiline
            rows={2}
          />

          <FormControlLabel
            control={
              <CorrectControl
                checked={option.isCorrect}
                onChange={(e) => onUpdate(option.content, e.target.checked)}
                title="Mark as correct answer"
              />
            }
            label="✓"
            sx={{ mt: 1 }}
          />

          <IconButton
            size="small"
            color="error"
            onClick={onDelete}
            title="Delete option"
            sx={{ mt: 1 }}
          >
            <DeleteIcon />
          </IconButton>
        </Stack>
      </CardContent>
    </Card>
  );
}
