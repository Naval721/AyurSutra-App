import { View } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { cn } from '@/lib/utils';
import { BRAND_HEX } from '@/lib/theme';

export interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 48, className }: LogoProps) {
  return (
    <View className={cn('items-center justify-center', className)}>
      <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <Defs>
          <LinearGradient id="emeraldGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor={BRAND_HEX.emerald} />
            <Stop offset="100%" stopColor={BRAND_HEX.emeraldDark} />
          </LinearGradient>
          <LinearGradient id="saffronGrad" x1="0" y1="100" x2="100" y2="0" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor={BRAND_HEX.saffron} />
            <Stop offset="100%" stopColor={BRAND_HEX.turmeric} />
          </LinearGradient>
        </Defs>

        {/* Minimal geometric lotus/leaf design */}
        {/* Left Leaf */}
        <Path 
          d="M 50 15 C 20 15 10 45 10 65 C 10 75 25 80 50 85 C 50 85 45 50 50 15 Z" 
          fill="url(#emeraldGrad)" 
          opacity="0.9"
        />
        {/* Right Leaf */}
        <Path 
          d="M 50 15 C 80 15 90 45 90 65 C 90 75 75 80 50 85 C 50 85 55 50 50 15 Z" 
          fill="url(#emeraldGrad)"
          opacity="0.7"
        />
        {/* Center Petal/Drop */}
        <Path
          d="M 50 35 C 35 60 40 85 50 90 C 60 85 65 60 50 35 Z"
          fill="url(#saffronGrad)"
        />
        
        {/* Center dot symbolizing Bindu (source of creation/focus) */}
        <Circle cx="50" cy="70" r="4" fill="#ffffff" />
      </Svg>
    </View>
  );
}
