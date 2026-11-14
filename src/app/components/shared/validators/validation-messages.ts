export const ValidationMessages = {
  required: 'This field is required.',
  email: 'Enter a valid email address.',
  phone: 'Enter a valid 10-digit mobile number.',
  minLength: 'Please enter the minimum required characters.',
  maxLength: 'You have exceeded the maximum allowed characters.',
  pattern: 'Please enter a valid value.',
  min: 'Value must be greater than or equal to the minimum.',
  max: 'Value must be less than or equal to the maximum.',
  fileType: 'Invalid file format.',
  fileSize: 'File size exceeds the allowed limit.',
};

export function getValidationMessage(errors: any): string {
  if (!errors) return '';

  if (errors['required']) return ValidationMessages.required;
  if (errors['email']) return ValidationMessages.email;
  if (errors['minlength']) return ValidationMessages.minLength;
  if (errors['maxlength']) return ValidationMessages.maxLength;
  if (errors['pattern']) return ValidationMessages.pattern;
  if (errors['min']) return ValidationMessages.min;
  if (errors['max']) return ValidationMessages.max;

  return 'Invalid value.';
}