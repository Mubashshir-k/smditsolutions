export function getUserFriendlyError(error: any): string {
  const message = error?.message?.toLowerCase() || '';

  if (message.includes('duplicate key') || message.includes('unique constraint')) {
    return 'This item already exists. Please use a different value.';
  }
  if (message.includes('foreign key constraint')) {
    return 'Cannot complete: this item is being used elsewhere.';
  }
  if (message.includes('check constraint') || message.includes('violates check')) {
    return 'Invalid value provided. Please check your input.';
  }
  if (message.includes('permission denied') || message.includes('policy')) {
    return 'You do not have permission to perform this action.';
  }
  if (message.includes('not found')) {
    return 'The requested item was not found.';
  }

  return 'An error occurred. Please try again or contact support if the problem persists.';
}
