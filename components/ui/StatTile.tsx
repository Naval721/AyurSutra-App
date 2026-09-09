import { Text } from 'heroui-native';

import { Surface } from '@/components/ui/Surface';
import { cn } from '@/lib/utils';

export interface StatTileProps {
  label: string;
  value: string | number;
  caption?: string;
  className?: string;
}

export function StatTile({ label, value, caption, className }: StatTileProps) {
  return (
    <Surface className={cn('flex-1', className)}>
      <Text.Paragraph type="body-xs" color="muted">
        {label}
      </Text.Paragraph>
      <Text.Heading type="h3" className="text-foreground mt-1">
        {value}
      </Text.Heading>
      {caption ? (
        <Text.Paragraph type="body-xs" color="muted" className="mt-0.5">
          {caption}
        </Text.Paragraph>
      ) : null}
    </Surface>
  );
}
