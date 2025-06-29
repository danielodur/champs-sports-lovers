import React, { useState, useRef, Fragment, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Modal,
  Dimensions 
} from 'react-native';
import { Calendar, X } from 'lucide-react-native';
import { useTheme } from '@/hooks/useTheme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface DateSelectorProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  activeFilter: string;
}

export default function DateSelector({ selectedDate, onSelectDate, activeFilter }: DateSelectorProps) {
  const theme = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const scrollViewRef = useRef<ScrollView>(null);

  // Generate date options based on the active filter
  const generateDates = () => {
    const today = new Date();
    const dates = [];
    
    switch (activeFilter) {
      case 'fixture':
        // Show today + next 6 days for fixtures (7 days total)
        for (let i = 0; i <= 6; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          dates.push(date);
        }
        break;
        
      case 'finished':
        // Show last 7 days for finished matches (going backwards)
        for (let i = 6; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          dates.push(date);
        }
        break;
        
      case 'all':
      default:
        // Show today + next 6 days for all matches (7 days total)
        for (let i = 0; i <= 6; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          dates.push(date);
        }
        break;
    }
    
    return dates;
  };

  const formatDate = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}/${day}`;
  };

  const formatDayName = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const dateStr = date.toDateString();
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();
    const tomorrowStr = tomorrow.toDateString();
    
    if (dateStr === todayStr) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';
    if (dateStr === tomorrowStr) return 'Tomorrow';
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  const formatDateForApi = (date: Date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  const dates = generateDates();
  const today = new Date();

  // ✅ FORCE TODAY VISIBLE: When finished or fixture filter is pressed, immediately make Today button visible and selected
  useEffect(() => {
    if ((activeFilter === 'finished' || activeFilter === 'fixture') && scrollViewRef.current) {
      console.log(`🏁 ${activeFilter.toUpperCase()} FILTER ACTIVATED: Making Today button visible FIRST`);
      
      if (activeFilter === 'finished') {
        // For finished matches, Today is at the rightmost position, so scroll to the end immediately
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
          console.log(`✅ AUTO-SCROLLED: Today button is now visible at the front when Finished is pressed`);
        }, 50); // Reduced delay for faster response
      } else if (activeFilter === 'fixture') {
        // For fixtures, Today is at the leftmost position (after calendar icon), so scroll to show first date
        setTimeout(() => {
          // Scroll past the calendar icon to show the first date (Today for fixtures)
          scrollViewRef.current?.scrollTo({ x: 50, animated: true }); // 50px to account for calendar icon width
          console.log(`✅ AUTO-SCROLLED: Today button is now visible after calendar icon when Fixture is pressed`);
        }, 50); // Reduced delay for faster response
      }
    }
  }, [activeFilter]);
  
  // ✅ KEEP TODAY VISIBLE: When Today is selected, ensure it stays visible
  useEffect(() => {
    if (selectedDate && scrollViewRef.current) {
      const todayStr = new Date().toISOString().split('T')[0];
      if (selectedDate === todayStr) {
        if (activeFilter === 'finished') {
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: false });
          }, 100);
        } else if (activeFilter === 'fixture') {
          setTimeout(() => {
            // Scroll past the calendar icon to show Today button for fixtures
            scrollViewRef.current?.scrollTo({ x: 50, animated: false }); // 50px to account for calendar icon width
          }, 100);
        }
      }
    }
  }, [selectedDate, activeFilter]);

  // Don't show date selector for Live and All tabs as they show all matches regardless of date
  if (activeFilter === 'live' || activeFilter === 'all') {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.backgroundSecondary }]}>
      <ScrollView 
        ref={scrollViewRef}
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Calendar icon at the beginning (left side) */}
        <TouchableOpacity
          style={styles.calendarButton}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.7}
          delayPressIn={0}
        >
          <Calendar size={18} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        {/* Date tabs */}
        {dates.map((date, index) => {
          const dateStr = formatDateForApi(date);
          const isSelected = selectedDate === dateStr;
          const isToday = date.toDateString() === today.toDateString();
          const dayName = formatDayName(date);
          
                      return (
              <Fragment key={index}>
              {/* Date tab */}
              <TouchableOpacity
                style={[
                  styles.dateTab,
                  { backgroundColor: theme.colors.backgroundSecondary },
                  isSelected && [styles.selectedDateTab, { 
                    backgroundColor: theme.colors.primary + '20',
                    borderColor: theme.colors.primary 
                  }]
                ]}
                onPress={() => {
                  console.log(`⚡ INSTANT DATE SELECT: ${dateStr}`);
                  // Immediate UI feedback
                  onSelectDate(dateStr);
                }}
                activeOpacity={0.7}
                delayPressIn={0}
              >
                {isToday ? (
                  <Text 
                    style={[
                      styles.todayOnlyText,
                      { color: theme.colors.textSecondary },
                      isSelected && { color: theme.colors.primary },
                      !isSelected && { color: '#888' }
                    ]}
                  >
                    Today
                  </Text>
                ) : (
                  <>
                    <Text 
                      style={[
                        styles.dateText,
                        { color: theme.colors.textSecondary },
                        isSelected && { color: theme.colors.primary }
                      ]}
                    >
                      {formatDate(date)}
                    </Text>
                    <Text 
                      style={[
                        styles.dayText,
                        { color: theme.colors.textSecondary },
                        isSelected && { color: theme.colors.primary }
                      ]}
                    >
                      {dayName}
                    </Text>
                  </>
                )}
                              </TouchableOpacity>
                            </Fragment>
            );
                    })}
        
        </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Select Date
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowDatePicker(false)}
              >
                <X size={24} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarContainer}>
              {renderCalendar()}
            </View>

            {/* Footer Buttons */}
            <View style={[styles.modalFooter, { borderTopColor: theme.colors.border }]}>
              <TouchableOpacity 
                style={[styles.footerButton, styles.cancelButton, { borderColor: theme.colors.border }]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.footerButton, styles.confirmButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.confirmButtonText}>
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  // Calendar rendering function with month navigation
  function renderCalendar() {
    const currentDate = new Date();
    const currentMonth = calendarDate.getMonth();
    const currentYear = calendarDate.getFullYear();
    
    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Generate calendar days
    const calendarDays = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(day);
    }

    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Month navigation functions
    const goToPreviousMonth = () => {
      const newDate = new Date(calendarDate);
      newDate.setMonth(currentMonth - 1);
      setCalendarDate(newDate);
    };
    
    const goToNextMonth = () => {
      const newDate = new Date(calendarDate);
      newDate.setMonth(currentMonth + 1);
      setCalendarDate(newDate);
    };

    return (
      <View>
        {/* Month/Year Header with Navigation */}
        <View style={styles.monthHeader}>
          <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthNavButton}>
            <Text style={[styles.monthNavText, { color: theme.colors.primary }]}>‹</Text>
          </TouchableOpacity>
          <Text style={[styles.monthYearText, { color: theme.colors.text }]}>
            {months[currentMonth]} {currentYear}
          </Text>
          <TouchableOpacity onPress={goToNextMonth} style={styles.monthNavButton}>
            <Text style={[styles.monthNavText, { color: theme.colors.primary }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Week day headers */}
        <View style={styles.weekHeader}>
          {weekDays.map((day, index) => (
            <Text key={index} style={[styles.weekDayText, { color: theme.colors.textSecondary }]}>
              {day}
            </Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <View key={index} style={styles.emptyDay} />;
            }

            const dayDate = new Date(currentYear, currentMonth, day);
            const dayDateStr = dayDate.toISOString().split('T')[0];
            const isSelected = selectedDate === dayDateStr;
            const isToday = dayDate.toDateString() === currentDate.toDateString();

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.calendarDay,
                  isSelected && [styles.selectedCalendarDay, { backgroundColor: theme.colors.primary }],
                  isToday && !isSelected && [styles.todayCalendarDay, { borderColor: theme.colors.primary }]
                ]}
                onPress={() => {
                  onSelectDate(dayDateStr);
                  setShowDatePicker(false);
                }}
              >
                <Text 
                  style={[
                    styles.calendarDayText,
                    { color: theme.colors.text },
                    isSelected && { color: '#fff' },
                    isToday && !isSelected && { color: theme.colors.primary }
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 3,
  },
  scrollContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  dateTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    alignItems: 'center',
    minWidth: 48,
    borderRadius: 6,
  },
  selectedDateTab: {
    borderRadius: 6,
    borderWidth: 1.5,
  },
  dateText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    marginBottom: 1,
  },
  dayText: {
    fontFamily: 'Inter-Regular',
    fontSize: 9,
  },
  todayOnlyText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    textAlign: 'center',
  },
  calendarButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth * 0.9,
    maxHeight: screenHeight * 0.7,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
  closeButton: {
    padding: 4,
  },
  calendarContainer: {
    padding: 20,
  },
  monthYearText: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    textAlign: 'center',
    marginBottom: 20,
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weekDayText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    width: 40,
    textAlign: 'center',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyDay: {
    width: `${100/7}%`,
    height: 40,
  },
  calendarDay: {
    width: `${100/7}%`,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginVertical: 2,
  },
  selectedCalendarDay: {
    backgroundColor: '#007AFF',
  },
  todayCalendarDay: {
    borderWidth: 2,
  },
  calendarDayText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
  },
  footerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF',
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  monthNavButton: {
    padding: 10,
    minWidth: 40,
    alignItems: 'center',
  },
  monthNavText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
}); 