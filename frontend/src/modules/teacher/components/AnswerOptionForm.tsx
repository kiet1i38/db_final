import React from 'react';
import {
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  IconButton,
  Card,
  CardContent,
  Stack,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { AnswerOption } from '../../shared/types';

interface AnswerOptionFormProps {
  option: AnswerOption;
  onUpdate: (content: string, isCorrect: boolean) => void;
  onDelete: () => void;
}

export default function AnswerOptionForm({ option, onUpdate, onDelete }: AnswerOptionFormProps) {
  return (
    <Card sx={{ mb: 1.5 }}>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="flex-start">
          {/* Option Text */}
          <TextField
            fullWidth
            size="small"
            label="Option text"
            value={option.content}
            onChange={(e) => onUpdate(e.target.value, option.isCorrect)}
            multiline
            rows={2}
          />

          {/* Correct Checkbox */}
          <FormControlLabel
            control={
              <Checkbox
                checked={option.isCorrect}
                onChange={(e) => onUpdate(option.content, e.target.checked)}
                title="Mark as correct answer"
              />
            }
            label="✓"
            sx={{ mt: 1 }}
          />

          {/* Delete Button */}
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
