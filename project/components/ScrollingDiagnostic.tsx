import React from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../hooks/useTheme';

const { height } = Dimensions.get('window');

interface ScrollingDiagnosticProps {
  testType?: 'scrollview' | 'flatlist';
}

const ScrollingDiagnostic: React.FC<ScrollingDiagnosticProps> = ({
  testType = 'flatlist',
}) => {
  const theme = useTheme();

  // Generate test data - enough items to require scrolling
  const testData = Array.from({ length: 30 }, (_, index) => ({
    id: index,
    title: `Test Item ${index + 1}`,
    description: `This is test content for item ${index + 1}. It should be scrollable.`,
    status: index % 3 === 0 ? 'LIVE' : index % 3 === 1 ? 'FT' : 'NS',
  }));

  console.log('🧪 SCROLLING DIAGNOSTIC LOADED');
  console.log('📱 Screen height:', height);
  console.log('📊 Test data count:', testData.length);
  console.log('🔧 Test type:', testType);

  const renderTestItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.testItem, { backgroundColor: theme.colors.backgroundSecondary }]}
      onPress={() => console.log('📱 Item pressed:', item.title)}
    >
      <View style={styles.itemHeader}>
        <Text style={[styles.itemTitle, { color: theme.colors.text }]}>
          {item.title}
        </Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                item.status === 'LIVE'
                  ? '#4CAF50'
                  : item.status === 'FT'
                  ? '#2196F3'
                  : '#FF9800',
            },
          ]}
        >
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={[styles.itemDescription, { color: theme.colors.textSecondary }]}>
        {item.description}
      </Text>
      <Text style={[styles.itemId, { color: theme.colors.textSecondary }]}>
        ID: {item.id} | Index in list
      </Text>
    </TouchableOpacity>
  );

  const renderScrollViewItems = () =>
    testData.map((item) => (
      <TouchableOpacity
        key={item.id}
        style={[styles.testItem, { backgroundColor: theme.colors.backgroundSecondary }]}
        onPress={() => console.log('📱 ScrollView item pressed:', item.title)}
      >
        <View style={styles.itemHeader}>
          <Text style={[styles.itemTitle, { color: theme.colors.text }]}>
            {item.title}
          </Text>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor:
                  item.status === 'LIVE'
                    ? '#4CAF50'
                    : item.status === 'FT'
                    ? '#2196F3'
                    : '#FF9800',
              },
            ]}
          >
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        <Text style={[styles.itemDescription, { color: theme.colors.textSecondary }]}>
          {item.description}
        </Text>
        <Text style={[styles.itemId, { color: theme.colors.textSecondary }]}>
          ID: {item.id} | ScrollView item
        </Text>
      </TouchableOpacity>
    ));

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Scrolling Diagnostic Test
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          Testing {testType.toUpperCase()} with {testData.length} items
        </Text>
      </View>

      {/* Test Content */}
      {testType === 'flatlist' ? (
        <FlatList
          data={testData}
          renderItem={renderTestItem}
          keyExtractor={(item) => `test-${item.id}`}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
          bounces={true}
          scrollEnabled={true}
          onScroll={() => console.log('📱 FlatList scroll detected')}
          onScrollBeginDrag={() => console.log('📱 FlatList drag started')}
          onScrollEndDrag={() => console.log('📱 FlatList drag ended')}
          onLayout={(event) => {
            const { height } = event.nativeEvent.layout;
            console.log('📱 FlatList layout height:', height);
          }}
          onContentSizeChange={(width, height) => {
            console.log('📱 FlatList content size:', { width, height });
          }}
          ListHeaderComponent={() => (
            <Text style={[styles.listHeader, { color: theme.colors.primary }]}>
              📱 FlatList Header - Start scrolling below
            </Text>
          )}
          ListFooterComponent={() => (
            <Text style={[styles.listFooter, { color: theme.colors.primary }]}>
              📱 FlatList Footer - End of list reached
            </Text>
          )}
        />
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          bounces={true}
          scrollEnabled={true}
          onScroll={() => console.log('📱 ScrollView scroll detected')}
          onScrollBeginDrag={() => console.log('📱 ScrollView drag started')}
          onScrollEndDrag={() => console.log('📱 ScrollView drag ended')}
          onLayout={(event) => {
            const { height } = event.nativeEvent.layout;
            console.log('📱 ScrollView layout height:', height);
          }}
          onContentSizeChange={(width, height) => {
            console.log('📱 ScrollView content size:', { width, height });
          }}
        >
          <Text style={[styles.listHeader, { color: theme.colors.primary }]}>
            📱 ScrollView Header - Start scrolling below
          </Text>
          {renderScrollViewItems()}
          <Text style={[styles.listFooter, { color: theme.colors.primary }]}>
            📱 ScrollView Footer - End of content
          </Text>
        </ScrollView>
      )}

      {/* Debug Info */}
      <View style={[styles.debugPanel, { backgroundColor: theme.colors.backgroundSecondary }]}>
        <Text style={[styles.debugText, { color: theme.colors.textSecondary }]}>
          Debug: {testData.length} items | {testType} | Screen: {height}px
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginTop: 4,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  listHeader: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    paddingVertical: 20,
  },
  listFooter: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    paddingVertical: 20,
  },
  testItem: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 100,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-Bold',
  },
  itemDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 8,
  },
  itemId: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
  },
  debugPanel: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});

export default ScrollingDiagnostic;
