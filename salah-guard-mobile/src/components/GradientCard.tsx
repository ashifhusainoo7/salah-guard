import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { colors, radius, shadows } from '../theme';

interface GradientCardProps {
  gradientColors?: [string, string];
  children: React.ReactNode;
  style?: ViewStyle;
  accentSide?: boolean;
}

const GradientCard: React.FC<GradientCardProps> = ({
  gradientColors,
  children,
  style,
  accentSide = false,
}) => {
  return (
    <View style={[styles.card, style]}>
      {accentSide && gradientColors && (
        <View style={styles.accentStrip}>
          <Svg width={4} height="100%">
            <Defs>
              <LinearGradient id="accent" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={gradientColors[0]} />
                <Stop offset="1" stopColor={gradientColors[1]} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="4" height="100%" fill="url(#accent)" rx={2} />
          </Svg>
        </View>
      )}
      <View style={[styles.content, accentSide && styles.contentWithAccent]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.card,
    borderWidth: 0,
    borderRadius: radius.lg,
    flexDirection: 'row',
    overflow: 'hidden',
    ...shadows.card,
  },
  accentStrip: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  contentWithAccent: {
    paddingLeft: 12,
  },
});

export default React.memo(GradientCard);
