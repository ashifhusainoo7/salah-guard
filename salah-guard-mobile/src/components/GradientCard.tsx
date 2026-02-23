import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
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
        <View style={[styles.accentStrip, { backgroundColor: gradientColors[1] }]} />
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
