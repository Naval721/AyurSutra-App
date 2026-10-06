import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { PressableFeedback, Text, useThemeColor } from 'heroui-native';
import type { Href } from 'expo-router';

import { goBackOrReplace } from '@/lib/navigation';
import { cn } from '@/lib/utils';

export interface ScreenProps {
  title?: string;
  subtitle?: string;
  /** Rendered on the right of the header row. */
  headerRight?: ReactNode;
  /** Shows a back control. Pass backFallback for routes that can open directly. */
  back?: boolean;
  backFallback?: Href;
  /** Wraps children in a ScrollView. Turn off for FlatList screens. */
  scroll?: boolean;
  /** Adds horizontal padding to the content area. */
  padded?: boolean;
  /** Pinned above the bottom edge, outside the scroll area. */
  footer?: ReactNode;
  /** Lifts content above the keyboard. Use on any screen with inputs. */
  keyboardAware?: boolean;
  /** Adds pull-to-refresh to a scrolling screen. Ignored when scroll is false. */
  onRefresh?: () => void;
  refreshing?: boolean;
  contentClassName?: string;
  children: ReactNode;
}

export function Screen({
  title,
  subtitle,
  headerRight,
  back = false,
  backFallback,
  scroll = false,
  padded = true,
  footer,
  keyboardAware = false,
  onRefresh,
  refreshing = false,
  contentClassName,
  children,
}: ScreenProps) {
  const [foreground, accent] = useThemeColor(['foreground', 'accent']);
  const showHeader = Boolean(title) || back || Boolean(headerRight);

  const content = scroll ? (
    <ScrollView
      className="flex-1"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />
        ) : undefined
      }
    >
      <View className={cn(padded && 'px-5', 'pb-10', contentClassName)}>{children}</View>
    </ScrollView>
  ) : (
    <View className={cn('flex-1', padded && 'px-5', contentClassName)}>{children}</View>
  );

  const body = (
    <View className="flex-1">
      {showHeader ? (
        <View className="pt-safe-offset-2 px-5 pb-3">
          {back ? (
            <PressableFeedback
              accessibilityRole="button"
              accessibilityLabel="Go back"
              // 44pt minimum touch target, pulled left so the glyph still lines
              // up with the title below it.
              className="mb-1 -ml-3 h-11 w-11 items-center justify-center rounded-full"
              onPress={() => goBackOrReplace(backFallback ?? '/')}
            >
              <ChevronLeft color={foreground} size={24} />
            </PressableFeedback>
          ) : null}
          <View className="flex-row items-end justify-between gap-3">
            <View className="flex-1">
              {title ? (
                <Text.Heading type="h3" className="text-foreground">
                  {title}
                </Text.Heading>
              ) : null}
              {subtitle ? (
                <Text.Paragraph type="body-sm" color="muted" className="mt-0.5">
                  {subtitle}
                </Text.Paragraph>
              ) : null}
            </View>
            {headerRight}
          </View>
        </View>
      ) : null}
      {content}
      {footer ? (
        <View className="border-border bg-surface pb-safe-offset-3 border-t px-5 py-3">
          {footer}
        </View>
      ) : null}
    </View>
  );

  return (
    <View className={cn('bg-background flex-1', !showHeader && 'pt-safe')}>
      {keyboardAware ? (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {body}
        </KeyboardAvoidingView>
      ) : (
        body
      )}
    </View>
  );
}
