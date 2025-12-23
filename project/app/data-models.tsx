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
  Database,
  BarChart3,
  TrendingUp,
  Target,
  Zap,
  Settings,
  Filter,
  Search,
  Download,
  Share,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Info
} from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

interface DataModel {
  id: string;
  name: string;
  description: string;
  type: 'prediction' | 'analysis' | 'simulation';
  accuracy: number;
  lastUpdated: string;
  parameters: {
    name: string;
    value: string;
    type: 'number' | 'text' | 'boolean' | 'select';
    options?: string[];
  }[];
  expanded?: boolean;
}

export default function DataModelsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState('prediction');
  const [searchQuery, setSearchQuery] = useState('');
  const [models, setModels] = useState<DataModel[]>([
    {
      id: '1',
      name: 'Match Outcome Predictor',
      description: 'Predicts match outcomes based on historical data, team form, and player statistics',
      type: 'prediction',
      accuracy: 78.5,
      lastUpdated: '2 hours ago',
      parameters: [
        { name: 'Home Team', value: 'Arsenal', type: 'text' },
        { name: 'Away Team', value: 'Manchester City', type: 'text' },
        { name: 'Include Weather', value: 'true', type: 'boolean' },
        { name: 'Form Weight', value: '0.7', type: 'number' }
      ],
      expanded: true
    },
    {
      id: '2',
      name: 'Player Performance Analyzer',
      description: 'Analyzes player performance metrics and predicts future performance',
      type: 'analysis',
      accuracy: 82.3,
      lastUpdated: '1 day ago',
      parameters: [
        { name: 'Player', value: 'Erling Haaland', type: 'text' },
        { name: 'Time Period', value: '3 months', type: 'select', options: ['1 month', '3 months', '6 months', '1 year'] },
        { name: 'Include Injuries', value: 'true', type: 'boolean' },
        { name: 'Metric Focus', value: 'Goals', type: 'select', options: ['Goals', 'Assists', 'Overall'] }
      ],
      expanded: false
    },
    {
      id: '3',
      name: 'Season Simulator',
      description: 'Simulates remaining season matches and predicts final standings',
      type: 'simulation',
      accuracy: 75.8,
      lastUpdated: '3 days ago',
      parameters: [
        { name: 'League', value: 'Premier League', type: 'text' },
        { name: 'Season', value: '2023/2024', type: 'text' },
        { name: 'Simulation Runs', value: '10000', type: 'number' },
        { name: 'Include Injuries', value: 'true', type: 'boolean' }
      ],
      expanded: false
    }
  ]);

  const tabs = [
    { id: 'prediction', label: 'Prediction Models', icon: Target },
    { id: 'analysis', label: 'Analysis Models', icon: BarChart3 },
    { id: 'simulation', label: 'Simulation Models', icon: Zap }
  ];

  const toggleModelExpansion = (modelId: string) => {
    setModels(models.map(model => 
      model.id === modelId 
        ? { ...model, expanded: !model.expanded } 
        : model
    ));
  };

  const updateModelParameter = (modelId: string, paramName: string, value: string) => {
    setModels(models.map(model => 
      model.id === modelId 
        ? {
            ...model,
            parameters: model.parameters.map(param => 
              param.name === paramName 
                ? { ...param, value } 
                : param
            )
          } 
        : model
    ));
  };

  const runModel = (modelId: string) => {
    const model = models.find(m => m.id === modelId);
    if (!model) return;
    
    Alert.alert(
      'Run Model',
      `Running ${model.name} with the specified parameters. This may take a moment.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Run', 
          onPress: () => {
            // Simulate model running
            setTimeout(() => {
              Alert.alert('Model Results', 'Model execution completed successfully. View results in the Results tab.');
            }, 1500);
          }
        }
      ]
    );
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
      <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Data Models</Text>
      <TouchableOpacity style={styles.settingsButton} activeOpacity={0.7}>
        <Settings size={24} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderTabs = () => (
    <View style={[styles.tabContainer, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && { borderBottomColor: theme.colors.primary }
            ]}
            onPress={() => setActiveTab(tab.id)}
            activeOpacity={0.7}
          >
            <tab.icon 
              size={18} 
              color={activeTab === tab.id ? theme.colors.primary : theme.colors.textSecondary} 
            />
            <Text
              style={[
                styles.tabText,
                { color: theme.colors.textSecondary },
                activeTab === tab.id && { color: theme.colors.primary }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <View style={[styles.searchBar, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Search size={20} color={theme.colors.textSecondary} />
        <TextInput
          style={[
            styles.searchInput,
            { 
              color: theme.colors.text,
              ...Platform.select({ web: { outlineStyle: 'none' } })
            }
          ]}
          placeholder="Search models..."
          placeholderTextColor={theme.colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      
      <TouchableOpacity 
        style={[styles.filterButton, { backgroundColor: theme.colors.backgroundSecondary }]}
        activeOpacity={0.7}
      >
        <Filter size={20} color={theme.colors.text} />
      </TouchableOpacity>
    </View>
  );

  const renderModelCard = (model: DataModel) => {
    const filteredModels = models.filter(m => m.type === activeTab);
    const isModelVisible = model.type === activeTab;
    
    if (!isModelVisible) return null;
    
    return (
      <View
        key={model.id}
        style={[styles.modelCard, { backgroundColor: theme.colors.backgroundSecondary }]}
      >
        <TouchableOpacity
          style={styles.modelHeader}
          onPress={() => toggleModelExpansion(model.id)}
          activeOpacity={0.7}
        >
          <View style={styles.modelTitleContainer}>
            <Database size={20} color={theme.colors.primary} />
            <Text style={[styles.modelTitle, { color: theme.colors.text }]}>
              {model.name}
            </Text>
          </View>
          
          <View style={styles.modelActions}>
            <View style={styles.accuracyBadge}>
              <Text style={styles.accuracyText}>
                {model.accuracy.toFixed(1)}% Accuracy
              </Text>
            </View>
            {model.expanded ? (
              <ChevronUp size={20} color={theme.colors.text} />
            ) : (
              <ChevronDown size={20} color={theme.colors.text} />
            )}
          </View>
        </TouchableOpacity>
        
        <Text style={[styles.modelDescription, { color: theme.colors.textSecondary }]}>
          {model.description}
        </Text>
        
        {model.expanded && (
          <View style={styles.modelContent}>
            <Text style={[styles.parametersTitle, { color: theme.colors.text }]}>
              Model Parameters
            </Text>
            
            {model.parameters.map((param, index) => (
              <View key={index} style={styles.parameterRow}>
                <Text style={[styles.parameterName, { color: theme.colors.text }]}>
                  {param.name}:
                </Text>
                
                {param.type === 'boolean' ? (
                  <View style={styles.booleanSelector}>
                    <TouchableOpacity
                      style={[
                        styles.booleanOption,
                        {
                          backgroundColor: param.value === 'true' ? theme.colors.primary : theme.colors.background,
                        }
                      ]}
                      onPress={() => updateModelParameter(model.id, param.name, 'true')}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.booleanOptionText,
                          {
                            color: param.value === 'true' ? '#FFFFFF' : theme.colors.text,
                          }
                        ]}
                      >
                        Yes
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.booleanOption,
                        {
                          backgroundColor: param.value === 'false' ? theme.colors.primary : theme.colors.background,
                        }
                      ]}
                      onPress={() => updateModelParameter(model.id, param.name, 'false')}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.booleanOptionText,
                          {
                            color: param.value === 'false' ? '#FFFFFF' : theme.colors.text,
                          }
                        ]}
                      >
                        No
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : param.type === 'select' && param.options ? (
                  <View style={styles.selectContainer}>
                    <TouchableOpacity
                      style={[styles.selectButton, { backgroundColor: theme.colors.background }]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.selectButtonText, { color: theme.colors.text }]}>
                        {param.value}
                      </Text>
                      <ChevronDown size={16} color={theme.colors.text} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TextInput
                    style={[
                      styles.parameterInput,
                      { 
                        backgroundColor: theme.colors.background,
                        color: theme.colors.text,
                        borderColor: theme.colors.border,
                        ...Platform.select({ web: { outlineStyle: 'none' } })
                      }
                    ]}
                    value={param.value}
                    onChangeText={(value) => updateModelParameter(model.id, param.name, value)}
                    keyboardType={param.type === 'number' ? 'numeric' : 'default'}
                  />
                )}
              </View>
            ))}
            
            <View style={styles.modelControls}>
              <TouchableOpacity
                style={[styles.runButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => runModel(model.id)}
                activeOpacity={0.8}
              >
                <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.runButtonText}>Run Model</Text>
              </TouchableOpacity>
              
              <View style={styles.secondaryControls}>
                <TouchableOpacity
                  style={[styles.secondaryButton, { backgroundColor: theme.colors.background }]}
                  activeOpacity={0.7}
                >
                  <Download size={16} color={theme.colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryButton, { backgroundColor: theme.colors.background }]}
                  activeOpacity={0.7}
                >
                  <Share size={16} color={theme.colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.secondaryButton, { backgroundColor: theme.colors.background }]}
                  activeOpacity={0.7}
                >
                  <Info size={16} color={theme.colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        
        <View style={styles.modelFooter}>
          <Text style={[styles.lastUpdated, { color: theme.colors.textSecondary }]}>
            Last updated: {model.lastUpdated}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => {
    const filteredModels = models.filter(model => model.type === activeTab);
    
    if (filteredModels.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Database size={64} color={theme.colors.textSecondary} />
          <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
            No {activeTab} models available
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
            Check back later for new models
          </Text>
        </View>
      );
    }
    
    return null;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {renderHeader()}
      {renderTabs()}
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderSearchBar()}
        
        <View style={styles.modelsContainer}>
          {renderEmptyState()}
          {models.map(renderModelCard)}
        </View>
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
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  tabScrollContent: {
    paddingHorizontal: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modelsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  modelCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modelHeader: {
    padding: 16,
  },
  modelTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  modelTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  modelActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accuracyBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  accuracyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
  modelDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  modelContent: {
    padding: 16,
    paddingTop: 0,
  },
  parametersTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 12,
  },
  parameterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  parameterName: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    width: 120,
  },
  parameterInput: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    borderWidth: 1,
  },
  booleanSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  booleanOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  booleanOptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  selectContainer: {
    flex: 1,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  selectButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  modelControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  runButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  runButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  secondaryControls: {
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modelFooter: {
    padding: 16,
    paddingTop: 0,
  },
  lastUpdated: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});