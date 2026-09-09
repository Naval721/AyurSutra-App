import type { ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from 'heroui-native';

import { cn } from '@/lib/utils';

export interface SectionHeaderProps {
  title: string;
  caption?: string;
  action?: ReactNode;
  className?: string;
}

export function SectionHeader({ title, caption, action, className }: SectionHeaderProps) {
  return (
    <View className={cn('mb-3 flex-row items-center justify-between gap-3', className)}>
      <View className="flex-1">
        <Text.Heading type="h5" className="text-foreground">
          {title}
        </Text.Heading>
        {caption ? (
          <Text.Paragraph type="body-xs" color="muted" className="mt-0.5">
            {caption}
          </Text.Paragraph>
        ) : null}
      </View>
      {action}
    </View>
  );
}
