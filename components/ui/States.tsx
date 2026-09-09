import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Button, Spinner, Text } from 'heroui-native';

import { cn } from '@/lib/utils';

export function LoadingState({ label = 'Loading' }: { label?: string }) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      className="items-center justify-center gap-3 py-16"
    >
      <Spinner />
      <Text.Paragraph type="body-sm" color="muted">
        {label}
      </Text.Paragraph>
    </View>
  );
}

export interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, message, icon, action, className }: EmptyStateProps) {
  return (
    <View className={cn('items-center justify-center gap-2 px-6 py-14', className)}>
      {icon ? (
        <View className="bg-surface-secondary mb-1 h-14 w-14 items-center justify-center rounded-full">
          {icon}
        </View>
      ) : null}
      <Text.Heading type="h5" className="text-foreground text-center">
        {title}
      </Text.Heading>
      {message ? (
        <Text.Paragraph type="body-sm" color="muted" className="text-center">
          {message}
        </Text.Paragraph>
      ) : null}
      {action ? <View className="mt-3">{action}</View> : null}
    </View>
  );
}

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <View className="items-center justify-center gap-3 px-6 py-14">
      <Text.Heading type="h5" className="text-foreground text-center">
        Something went wrong
      </Text.Heading>
      <Text.Paragraph type="body-sm" color="muted" className="text-center">
        {message ?? 'We could not load this just now. Please try again.'}
      </Text.Paragraph>
      {onRetry ? (
        <Button variant="secondary" size="sm" onPress={onRetry}>
          <Button.Label>Try again</Button.Label>
        </Button>
      ) : null}
    </View>
  );
}
