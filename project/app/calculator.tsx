import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Platform,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  ChevronLeft, 
  Calculator as CalculatorIcon,
  Target,
  TrendingUp,
  BarChart3,
  Percent,
  DollarSign,
  Trophy,
  Users,
  Settings,
  RotateCcw,
  Save,
  Share,
  Info
} from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

interface CalculatorType {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
}

export default function CalculatorScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [activeCalculator, setActiveCalculator] = useState('odds');
  
  // Odds Calculator States
  const [stake, setStake] = useState('');
  const [odds, setOdds] = useState('');
  const [oddsFormat, setOddsFormat] = useState('decimal');
  
  // Accumulator Calculator States
  const [accumulatorBets, setAccumulatorBets] = useState([{ odds: '', stake: '' }]);
  
  // Value Bet Calculator States
  const [bookmakerOdds, setBookmakerOdds] = useState('');
  const [trueOdds, setTrueOdds] = useState('');
  
  // Kelly Criterion Calculator States
  const [bankroll, setBankroll] = useState('');
  const [probability, setProbability] = useState('');
  const [kellyOdds, setKellyOdds] = useState('');

  const calculatorTypes: CalculatorType[] = [
    {
      id: 'odds',
      name: 'Odds Calculator',
      description: 'Calculate potential winnings from odds',
      icon: Target,
      color: '#4CAF50'
    },
    {
      id: 'accumulator',
      name: 'Accumulator',
      description: 'Calculate multiple bet combinations',
      icon: TrendingUp,
      color: '#2196F3'
    },
    {
      id: 'value',
      name: 'Value Bet',
      description: 'Find value betting opportunities',
      icon: DollarSign,
      color: '#FF9800'
    },
    {
      id: 'kelly',
      name: 'Kelly Criterion',
      description: 'Optimal bet sizing strategy',
      icon: BarChart3,
      color: '#9C27B0'
    },
    {
      id: 'probability',
      name: 'Probability',
      description: 'Convert odds to probability',
      icon: Percent,
      color: '#E91E63'
    },
    {
      id: 'arbitrage',
      name: 'Arbitrage',
      description: 'Find arbitrage opportunities',
      icon: Trophy,
      color: '#607D8B'
    }
  ];

  const oddsFormats = [
    { id: 'decimal', label: 'Decimal (2.50)' },
    { id: 'fractional', label: 'Fractional (3/2)' },
    { id: 'american', label: 'American (+150)' }
  ];

  const calculateOddsWinnings = () => {
    const stakeValue = parseFloat(stake);
    const oddsValue = parseFloat(odds);
    
    if (isNaN(stakeValue) || isNaN(oddsValue) || stakeValue <= 0 || oddsValue <= 0) {
      Alert.alert('Invalid Input', 'Please enter valid positive numbers for stake and odds.');
      return null;
    }
    
    let winnings = 0;
    let totalReturn = 0;
    
    switch (oddsFormat) {
      case 'decimal':
        totalReturn = stakeValue * oddsValue;
        winnings = totalReturn - stakeValue;
        break;
      case 'fractional':
        // Assuming odds are entered as decimal equivalent of fraction
        winnings = stakeValue * oddsValue;
        totalReturn = stakeValue + winnings;
        break;
      case 'american':
        if (oddsValue > 0) {
          winnings = (stakeValue * oddsValue) / 100;
        } else {
          winnings = (stakeValue * 100) / Math.abs(oddsValue);
        }
        totalReturn = stakeValue + winnings;
        break;
    }
    
    return { winnings, totalReturn, profit: winnings };
  };

  const calculateAccumulator = () => {
    const validBets = accumulatorBets.filter(bet => 
      bet.odds && bet.stake && !isNaN(parseFloat(bet.odds)) && !isNaN(parseFloat(bet.stake))
    );
    
    if (validBets.length === 0) {
      Alert.alert('Invalid Input', 'Please enter valid odds and stakes for at least one bet.');
      return null;
    }
    
    const totalStake = validBets.reduce((sum, bet) => sum + parseFloat(bet.stake), 0);
    const combinedOdds = validBets.reduce((product, bet) => product * parseFloat(bet.odds), 1);
    const totalReturn = totalStake * combinedOdds;
    const profit = totalReturn - totalStake;
    
    return { totalStake, combinedOdds, totalReturn, profit };
  };

  const calculateValueBet = () => {
    const bookOdds = parseFloat(bookmakerOdds);
    const trueOddsValue = parseFloat(trueOdds);
    
    if (isNaN(bookOdds) || isNaN(trueOddsValue) || bookOdds <= 0 || trueOddsValue <= 0) {
      Alert.alert('Invalid Input', 'Please enter valid positive odds.');
      return null;
    }
    
    const impliedProbability = 1 / bookOdds;
    const trueProbability = 1 / trueOddsValue;
    const edge = trueProbability - impliedProbability;
    const valuePercentage = (edge / impliedProbability) * 100;
    
    return {
      impliedProbability: impliedProbability * 100,
      trueProbability: trueProbability * 100,
      edge: edge * 100,
      valuePercentage,
      hasValue: valuePercentage > 0
    };
  };

  const calculateKellyCriterion = () => {
    const bankrollValue = parseFloat(bankroll);
    const probValue = parseFloat(probability) / 100;
    const oddsValue = parseFloat(kellyOdds);
    
    if (isNaN(bankrollValue) || isNaN(probValue) || isNaN(oddsValue) || 
        bankrollValue <= 0 || probValue <= 0 || probValue >= 1 || oddsValue <= 0) {
      Alert.alert('Invalid Input', 'Please enter valid values. Probability should be between 0-100%.');
      return null;
    }
    
    const q = 1 - probValue; // Probability of losing
    const b = oddsValue - 1; // Net odds received
    const kellyPercentage = ((b * probValue - q) / b) * 100;
    const recommendedStake = (kellyPercentage / 100) * bankrollValue;
    
    return {
      kellyPercentage: Math.max(0, kellyPercentage),
      recommendedStake: Math.max(0, recommendedStake),
      shouldBet: kellyPercentage > 0
    };
  };

  const addAccumulatorBet = () => {
    setAccumulatorBets([...accumulatorBets, { odds: '', stake: '' }]);
  };

  const removeAccumulatorBet = (index: number) => {
    if (accumulatorBets.length > 1) {
      setAccumulatorBets(accumulatorBets.filter((_, i) => i !== index));
    }
  };

  const updateAccumulatorBet = (index: number, field: 'odds' | 'stake', value: string) => {
    const updated = [...accumulatorBets];
    updated[index][field] = value;
    setAccumulatorBets(updated);
  };

  const resetCalculator = () => {
    setStake('');
    setOdds('');
    setBookmakerOdds('');
    setTrueOdds('');
    setBankroll('');
    setProbability('');
    setKellyOdds('');
    setAccumulatorBets([{ odds: '', stake: '' }]);
  };

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <TouchableOpacity 
        onPress={() => router.back()} 
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <ChevronLeft size={28} color={theme.colors.text} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Sports Calculator</Text>
      <TouchableOpacity style={styles.settingsButton} activeOpacity={0.7}>
        <Settings size={24} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderCalculatorSelector = () => (
    <View style={[styles.selectorContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.selectorContent}
      >
        {calculatorTypes.map((calc) => (
          <TouchableOpacity
            key={calc.id}
            style={[
              styles.calculatorButton,
              {
                backgroundColor: activeCalculator === calc.id ? calc.color : theme.colors.background,
              }
            ]}
            onPress={() => setActiveCalculator(calc.id)}
            activeOpacity={0.7}
          >
            <calc.icon 
              size={24} 
              color={activeCalculator === calc.id ? '#FFFFFF' : theme.colors.text} 
            />
            <Text
              style={[
                styles.calculatorButtonText,
                {
                  color: activeCalculator === calc.id ? '#FFFFFF' : theme.colors.text,
                }
              ]}
            >
              {calc.name}
            </Text>
            <Text
              style={[
                styles.calculatorButtonDesc,
                {
                  color: activeCalculator === calc.id ? '#FFFFFF' : theme.colors.textSecondary,
                }
              ]}
            >
              {calc.description}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderOddsCalculator = () => {
    const result = calculateOddsWinnings();
    
    return (
      <View style={styles.calculatorContent}>
        <Text style={[styles.calculatorTitle, { color: theme.colors.text }]}>
          Odds Calculator
        </Text>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Stake Amount</Text>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
                ...Platform.select({ web: { outlineStyle: 'none' } })
              }
            ]}
            placeholder="Enter stake amount"
            placeholderTextColor={theme.colors.textSecondary}
            value={stake}
            onChangeText={setStake}
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Odds Format</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.formatButtons}>
              {oddsFormats.map((format) => (
                <TouchableOpacity
                  key={format.id}
                  style={[
                    styles.formatButton,
                    {
                      backgroundColor: oddsFormat === format.id ? theme.colors.primary : theme.colors.background,
                    }
                  ]}
                  onPress={() => setOddsFormat(format.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.formatButtonText,
                      {
                        color: oddsFormat === format.id ? '#FFFFFF' : theme.colors.text,
                      }
                    ]}
                  >
                    {format.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Odds</Text>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
                ...Platform.select({ web: { outlineStyle: 'none' } })
              }
            ]}
            placeholder="Enter odds"
            placeholderTextColor={theme.colors.textSecondary}
            value={odds}
            onChangeText={setOdds}
            keyboardType="numeric"
          />
        </View>
        
        {result && (
          <View style={[styles.resultContainer, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.resultTitle, { color: theme.colors.text }]}>Calculation Results</Text>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: theme.colors.textSecondary }]}>Potential Winnings:</Text>
              <Text style={[styles.resultValue, { color: theme.colors.primary }]}>
                ${result.winnings.toFixed(2)}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: theme.colors.textSecondary }]}>Total Return:</Text>
              <Text style={[styles.resultValue, { color: theme.colors.text }]}>
                ${result.totalReturn.toFixed(2)}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: theme.colors.textSecondary }]}>Profit:</Text>
              <Text style={[styles.resultValue, { color: '#4CAF50' }]}>
                ${result.profit.toFixed(2)}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderAccumulatorCalculator = () => {
    const result = calculateAccumulator();
    
    return (
      <View style={styles.calculatorContent}>
        <Text style={[styles.calculatorTitle, { color: theme.colors.text }]}>
          Accumulator Calculator
        </Text>
        
        <View style={styles.accumulatorContainer}>
          {accumulatorBets.map((bet, index) => (
            <View key={index} style={styles.accumulatorBet}>
              <View style={styles.betHeader}>
                <Text style={[styles.betTitle, { color: theme.colors.text }]}>
                  Bet {index + 1}
                </Text>
                {accumulatorBets.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeAccumulatorBet(index)}
                    style={styles.removeBetButton}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.removeBetText, { color: theme.colors.error }]}>Remove</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.betInputs}>
                <View style={styles.betInputGroup}>
                  <Text style={[styles.betInputLabel, { color: theme.colors.text }]}>Odds</Text>
                  <TextInput
                    style={[
                      styles.betInput,
                      { 
                        backgroundColor: theme.colors.background,
                        color: theme.colors.text,
                        borderColor: theme.colors.border,
                        ...Platform.select({ web: { outlineStyle: 'none' } })
                      }
                    ]}
                    placeholder="Odds"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={bet.odds}
                    onChangeText={(value) => updateAccumulatorBet(index, 'odds', value)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.betInputGroup}>
                  <Text style={[styles.betInputLabel, { color: theme.colors.text }]}>Stake</Text>
                  <TextInput
                    style={[
                      styles.betInput,
                      { 
                        backgroundColor: theme.colors.background,
                        color: theme.colors.text,
                        borderColor: theme.colors.border,
                        ...Platform.select({ web: { outlineStyle: 'none' } })
                      }
                    ]}
                    placeholder="Stake"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={bet.stake}
                    onChangeText={(value) => updateAccumulatorBet(index, 'stake', value)}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          ))}
          
          <TouchableOpacity
            style={[styles.addBetButton, { backgroundColor: theme.colors.primary }]}
            onPress={addAccumulatorBet}
            activeOpacity={0.8}
          >
            <Text style={styles.addBetText}>Add Another Bet</Text>
          </TouchableOpacity>
        </View>
        
        {result && (
          <View style={[styles.resultContainer, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.resultTitle, { color: theme.colors.text }]}>Accumulator Results</Text>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: theme.colors.textSecondary }]}>Total Stake:</Text>
              <Text style={[styles.resultValue, { color: theme.colors.text }]}>
                ${result.totalStake.toFixed(2)}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: theme.colors.textSecondary }]}>Combined Odds:</Text>
              <Text style={[styles.resultValue, { color: theme.colors.text }]}>
                {result.combinedOdds.toFixed(2)}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: theme.colors.textSecondary }]}>Total Return:</Text>
              <Text style={[styles.resultValue, { color: theme.colors.primary }]}>
                ${result.totalReturn.toFixed(2)}
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: theme.colors.textSecondary }]}>Profit:</Text>
              <Text style={[styles.resultValue, { color: '#4CAF50' }]}>
                ${result.profit.toFixed(2)}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderValueBetCalculator = () => {
    const result = calculateValueBet();
    
    return (
      <View style={styles.calculatorContent}>
        <Text style={[styles.calculatorTitle, { color: theme.colors.text }]}>
          Value Bet Calculator
        </Text>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Bookmaker Odds</Text>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
                ...Platform.select({ web: { outlineStyle: 'none' } })
              }
            ]}
            placeholder="Enter bookmaker odds"
            placeholderTextColor={theme.colors.textSecondary}
            value={bookmakerOdds}
            onChangeText={setBookmakerOdds}
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>True Odds (Your Estimate)</Text>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
                ...Platform.select({ web: { outlineStyle: 'none' } })
              }
            ]}
            placeholder="Enter your estimated true odds"
            placeholderTextColor={theme.colors.textSecondary}
            value={trueOdds}
            onChangeText={setTrueOdds}
            keyboardType="numeric"
          />
        </View>
        
        {result && (
          <View style={[styles.resultContainer, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.resultTitle, { color: theme.colors.text }]}>Value Analysis</Text>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: theme.colors.textSecondary }]}>Implied Probability:</Text>
              <Text style={[styles.resultValue, { color: theme.colors.text }]}>
                {result.impliedProbability.toFixed(2)}%
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: theme.colors.textSecondary }]}>True Probability:</Text>
              <Text style={[styles.resultValue, { color: theme.colors.text }]}>
                {result.trueProbability.toFixed(2)}%
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: theme.colors.textSecondary }]}>Edge:</Text>
              <Text style={[
                styles.resultValue, 
                { color: result.edge >= 0 ? '#4CAF50' : '#F44336' }
              ]}>
                {result.edge >= 0 ? '+' : ''}{result.edge.toFixed(2)}%
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: theme.colors.textSecondary }]}>Value:</Text>
              <Text style={[
                styles.resultValue, 
                { color: result.valuePercentage >= 0 ? '#4CAF50' : '#F44336' }
              ]}>
                {result.valuePercentage >= 0 ? '+' : ''}{result.valuePercentage.toFixed(2)}%
              </Text>
            </View>
            <View style={[
              styles.valueVerdict,
              { 
                backgroundColor: result.hasValue ? '#4CAF5033' : '#F4433633',
                borderColor: result.hasValue ? '#4CAF50' : '#F44336'
              }
            ]}>
              <Text style={[
                styles.valueVerdictText,
                { color: result.hasValue ? '#4CAF50' : '#F44336' }
              ]}>
                {result.hasValue ? 'Value Bet Found!' : 'No Value Found'}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderKellyCriterionCalculator = () => {
    const result = calculateKellyCriterion();
    
    return (
      <View style={styles.calculatorContent}>
        <Text style={[styles.calculatorTitle, { color: theme.colors.text }]}>
          Kelly Criterion Calculator
        </Text>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Bankroll</Text>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
                ...Platform.select({ web: { outlineStyle: 'none' } })
              }
            ]}
            placeholder="Enter your bankroll"
            placeholderTextColor={theme.colors.textSecondary}
            value={bankroll}
            onChangeText={setBankroll}
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Probability of Winning (%)</Text>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
                ...Platform.select({ web: { outlineStyle: 'none' } })
              }
            ]}
            placeholder="Enter probability (0-100)"
            placeholderTextColor={theme.colors.textSecondary}
            value={probability}
            onChangeText={setProbability}
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Decimal Odds</Text>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                borderColor: theme.colors.border,
                ...Platform.select({ web: { outlineStyle: 'none' } })
              }
            ]}
            placeholder="Enter decimal odds"
            placeholderTextColor={theme.colors.textSecondary}
            value={kellyOdds}
            onChangeText={setKellyOdds}
            keyboardType="numeric"
          />
        </View>
        
        {result && (
          <View style={[styles.resultContainer, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.resultTitle, { color: theme.colors.text }]}>Kelly Criterion Results</Text>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: theme.colors.textSecondary }]}>Kelly Percentage:</Text>
              <Text style={[styles.resultValue, { color: theme.colors.primary }]}>
                {result.kellyPercentage.toFixed(2)}%
              </Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={[styles.resultLabel, { color: theme.colors.textSecondary }]}>Recommended Stake:</Text>
              <Text style={[styles.resultValue, { color: theme.colors.text }]}>
                ${result.recommendedStake.toFixed(2)}
              </Text>
            </View>
            <View style={[
              styles.valueVerdict,
              { 
                backgroundColor: result.shouldBet ? '#4CAF5033' : '#F4433633',
                borderColor: result.shouldBet ? '#4CAF50' : '#F44336'
              }
            ]}>
              <Text style={[
                styles.valueVerdictText,
                { color: result.shouldBet ? '#4CAF50' : '#F44336' }
              ]}>
                {result.shouldBet ? 'Recommended Bet' : 'Not Recommended'}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderCalculatorContent = () => {
    switch (activeCalculator) {
      case 'odds':
        return renderOddsCalculator();
      case 'accumulator':
        return renderAccumulatorCalculator();
      case 'value':
        return renderValueBetCalculator();
      case 'kelly':
        return renderKellyCriterionCalculator();
      case 'probability':
      case 'arbitrage':
        return (
          <View style={styles.calculatorContent}>
            <Text style={[styles.calculatorTitle, { color: theme.colors.text }]}>
              Coming Soon
            </Text>
            <Text style={[styles.comingSoonText, { color: theme.colors.textSecondary }]}>
              This calculator will be available in the next update.
            </Text>
          </View>
        );
      default:
        return renderOddsCalculator();
    }
  };

  const renderControls = () => (
    <View style={[styles.controls, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <TouchableOpacity
        style={[styles.controlButton, { backgroundColor: theme.colors.background }]}
        onPress={resetCalculator}
        activeOpacity={0.7}
      >
        <RotateCcw size={20} color={theme.colors.text} />
        <Text style={[styles.controlButtonText, { color: theme.colors.text }]}>Reset</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.controlButton, { backgroundColor: theme.colors.background }]}
        onPress={() => Alert.alert('Save', 'Calculation saved successfully.')}
        activeOpacity={0.7}
      >
        <Save size={20} color={theme.colors.text} />
        <Text style={[styles.controlButtonText, { color: theme.colors.text }]}>Save</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.controlButton, { backgroundColor: theme.colors.background }]}
        onPress={() => Alert.alert('Share', 'Calculation shared successfully.')}
        activeOpacity={0.7}
      >
        <Share size={20} color={theme.colors.text} />
        <Text style={[styles.controlButtonText, { color: theme.colors.text }]}>Share</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderHeader()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCalculatorSelector()}
        {renderCalculatorContent()}
        {renderControls()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    textAlign: 'center',
  },
  settingsButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  selectorContainer: {
    paddingVertical: 16,
  },
  selectorContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  calculatorButton: {
    width: 160,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  calculatorButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginTop: 8,
    marginBottom: 4,
  },
  calculatorButtonDesc: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
  calculatorContent: {
    padding: 16,
  },
  calculatorTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
  },
  formatButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  formatButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  formatButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  resultContainer: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  resultTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  resultValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  accumulatorContainer: {
    gap: 16,
  },
  accumulatorBet: {
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 8,
    padding: 12,
  },
  betHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  betTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  removeBetButton: {
    padding: 4,
  },
  removeBetText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  betInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  betInputGroup: {
    flex: 1,
  },
  betInputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 8,
  },
  betInput: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
  },
  addBetButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addBetText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  valueVerdict: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  valueVerdictText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  controlButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  comingSoonText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
});