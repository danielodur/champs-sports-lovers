import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PieChartProps {
  homeValue: number;
  awayValue: number;
  label: string;
  size?: number;
  homeColor?: string;
  awayColor?: string;
}

const PieChart: React.FC<PieChartProps> = ({
  homeValue,
  awayValue,
  label,
  size = 100,
  homeColor = '#FFA500',
  awayColor = '#888888'
}) => {
  const total = homeValue + awayValue;
  const homePercentage = total > 0 ? (homeValue / total) * 100 : 50;
  
  return (
    <View style={styles.pieChartContainer}>
      <Text style={styles.pieChartLabel}>{label}</Text>
      <View style={[styles.pieChartWrapper, { width: size, height: size }]}>
        {/* Base grey ring */}
        <View style={[
          styles.baseRing,
          { 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            borderWidth: 8,
            borderColor: awayColor,
          }
        ]} />
        
        {/* Home team progress ring */}
        <View style={[
          styles.progressRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 8,
            borderColor: 'transparent',
            borderTopColor: homeColor,
            borderRightColor: homePercentage > 25 ? homeColor : 'transparent',
            borderBottomColor: homePercentage > 50 ? homeColor : 'transparent',
            borderLeftColor: homePercentage > 75 ? homeColor : 'transparent',
            transform: [{ rotate: '-90deg' }],
          }
        ]} />
        
        {/* Center content with values */}
        <View style={[styles.centerContent, { 
          width: size - 16, 
          height: size - 16,
          borderRadius: (size - 16) / 2,
        }]}>
          <View style={styles.valuesRow}>
            <Text style={[styles.valueText, { color: homeColor }]}>
              {homeValue}
            </Text>
            <View style={styles.valueDivider} />
            <Text style={[styles.valueText, { color: awayColor }]}>
              {awayValue}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pieChartContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  pieChartLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 8,
    textAlign: 'center',
  },
  pieChartWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  baseRing: {
    position: 'absolute',
  },
  progressRing: {
    position: 'absolute',
  },
  centerContent: {
    position: 'absolute',
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  valuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  valueDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#333333',
  },
  valueText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PieChart; 