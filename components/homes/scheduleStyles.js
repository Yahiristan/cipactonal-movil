import { StyleSheet, Platform } from 'react-native';

const baseStyles = {
  mainContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 10
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500'
  },
  headerWrapper: {
    backgroundColor: '#2563eb'
  },
  header: {
    backgroundColor: '#2563eb',
    paddingTop: Platform.OS === 'android' ? 16 : 50,
    paddingBottom: 22,
    paddingHorizontal: 20
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
    marginBottom: 4
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#bfdbfe',
    fontWeight: '500'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 80
  },
  errorCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28
  },
  errorIcon: {
    marginRight: 10
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#b91c1c',
    fontWeight: '500'
  },

  // TODAY CARD
  todayCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    padding: 20,
    marginBottom: 28
  },
  todayHeader: {
    marginBottom: 16
  },
  todayBadge: {
    backgroundColor: '#ef4444',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8
  },
  todayBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  todayDate: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1f2937',
    textTransform: 'capitalize'
  },
  currentShiftContainer: {
    marginBottom: 14
  },
  shiftTimeRow: {
    marginBottom: 10
  },
  shiftTimeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 14
  },
  shiftTimeInfo: {
    marginLeft: 12,
    flex: 1
  },
  shiftLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 3
  },
  shiftTime: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f2937',
    letterSpacing: -0.3
  },
  moreTurnsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 10,
    gap: 6
  },
  moreTurnsText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600'
  },
  finishedText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    paddingVertical: 16,
    fontWeight: '500'
  },

  // DAY OFF CARD
  dayOffCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 28
  },
  dayOffIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14
  },
  dayOffTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f2937',
    marginBottom: 6
  },
  dayOffText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500'
  },

  // COMMON SETTINGS STYLE (SECTIONS)
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
    marginLeft: 12,
    textTransform: 'uppercase',
    letterSpacing: 1.2
  },
  sectionContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    paddingVertical: 8,
    marginBottom: 28
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  settingIcon: {
    marginRight: 14
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    letterSpacing: -0.2
  },
  settingTitleSecondary: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 80
  },
  settingValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937',
    marginRight: 4
  },
  settingValueInactive: {
    color: '#94a3b8',
    fontWeight: '500'
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginLeft: 16,
    marginRight: 16
  },

  // SPECIFIC SCHEDULE ITEM STYLES
  dayIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  dayIconActive: {
    backgroundColor: '#dbeafe'
  },
  dayIconInactive: {
    backgroundColor: '#ffffff'
  },
  dayInitialText: {
    fontSize: 14,
    fontWeight: '700'
  },
  dayInitialActive: {
    color: '#2563eb'
  },
  dayInitialInactive: {
    color: '#94a3b8'
  },
  scheduleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10
  },
  scheduleInfo: {
    flex: 1,
    paddingRight: 6
  },
  scheduleTopRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  scheduleDay: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1f2937'
  },
  scheduleDayInactive: {
    color: '#94a3b8'
  },
  scheduleRight: {
    alignItems: 'flex-end',
    minWidth: 95,
    maxWidth: 115
  },
  scheduleTime: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'right'
  },
  scheduleTimeInactive: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8'
  },
  todayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginLeft: 8
  },
  multipleTurnsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    alignSelf: 'flex-start',
    gap: 4
  },
  multipleTurnsText: {
    fontSize: 11,
    color: '#1d4ed8',
    fontWeight: '600'
  },
  scheduleItemToday: {
    backgroundColor: '#eff6ff'
  },
  scheduleItemInactive: {
    opacity: 0.6
  },

  // MODAL STYLES (Keep mostly the same but adjust colors)
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.45)'
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937'
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500'
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalScroll: {
    flexGrow: 0
  },
  modalScrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 18,
    paddingBottom: 24
  },
  modalTurnoBlock: {
    marginBottom: 12,
  },
  modalTurnoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTurnoNumber: {
    display: 'none',
  },
  modalTurnoNumberText: {
    display: 'none',
  },
  modalTurnoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginLeft: 12,
  },
  modalTurnoDetails: {
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalTurnoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  modalTurnoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    letterSpacing: -0.2,
    marginLeft: 12,
    flex: 1,
  },
  modalTurnoTime: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748b',
    marginRight: 4,
  },
  modalTurnoDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 4
  },
  modalEmptyState: {
    alignItems: 'center',
    paddingVertical: 36
  },
  modalEmptyText: {
    fontSize: 15,
    color: '#94a3b8',
    marginTop: 12,
    fontWeight: '500'
  },
  modalFooter: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6'
  },
  modalFooterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8
  },
  modalFooterText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500'
  }
};

export const scheduleStyles = StyleSheet.create(baseStyles);

export const scheduleStylesDark = StyleSheet.create({
  ...baseStyles,
  mainContainer: {
    ...baseStyles.mainContainer,
    backgroundColor: '#0f172a'
  },
  loadingContainer: {
    ...baseStyles.loadingContainer,
    backgroundColor: '#0f172a'
  },
  headerWrapper: {
    ...baseStyles.headerWrapper,
    backgroundColor: '#1e40af'
  },
  header: {
    ...baseStyles.header,
    backgroundColor: '#1e40af'
  },
  headerSubtitle: {
    ...baseStyles.headerSubtitle,
    color: '#93c5fd'
  },
  errorCard: {
    ...baseStyles.errorCard,
    backgroundColor: '#451a1a',
    borderColor: '#7f1d1d'
  },
  todayCard: {
    ...baseStyles.todayCard,
    backgroundColor: '#1e293b'
  },
  todayDate: {
    ...baseStyles.todayDate,
    color: '#f1f5f9'
  },
  shiftTime: {
    ...baseStyles.shiftTime,
    color: '#f1f5f9'
  },
  shiftLabel: {
    ...baseStyles.shiftLabel,
    color: '#94a3b8'
  },
  shiftTimeBlock: {
    ...baseStyles.shiftTimeBlock,
    backgroundColor: '#0f172a'
  },
  finishedText: {
    ...baseStyles.finishedText,
    color: '#94a3b8'
  },
  moreTurnsButton: {
    ...baseStyles.moreTurnsButton,
    backgroundColor: '#0f172a'
  },
  moreTurnsText: {
    ...baseStyles.moreTurnsText,
    color: '#60a5fa'
  },
  dayOffCard: {
    ...baseStyles.dayOffCard,
    backgroundColor: '#1e293b'
  },
  dayOffIcon: {
    ...baseStyles.dayOffIcon,
    backgroundColor: '#0f172a'
  },
  dayOffTitle: {
    ...baseStyles.dayOffTitle,
    color: '#f1f5f9'
  },
  dayOffText: {
    ...baseStyles.dayOffText,
    color: '#64748b'
  },
  sectionContainer: {
    ...baseStyles.sectionContainer,
    backgroundColor: '#1e293b'
  },
  sectionLabel: {
    ...baseStyles.sectionLabel,
    color: '#64748b'
  },
  settingTitle: {
    ...baseStyles.settingTitle,
    color: '#f1f5f9'
  },
  settingTitleSecondary: {
    ...baseStyles.settingTitleSecondary,
    color: '#94a3b8'
  },
  settingValue: {
    ...baseStyles.settingValue,
    color: '#f1f5f9'
  },
  settingValueInactive: {
    ...baseStyles.settingValueInactive,
    color: '#475569'
  },
  divider: {
    ...baseStyles.divider,
    backgroundColor: '#334155'
  },
  scheduleItemToday: {
    ...baseStyles.scheduleItemToday,
    backgroundColor: '#172554'
  },
  dayIconActive: {
    ...baseStyles.dayIconActive,
    backgroundColor: '#1e3a8a'
  },
  dayIconInactive: {
    ...baseStyles.dayIconInactive,
    backgroundColor: '#0f172a'
  },
  dayInitialActive: {
    ...baseStyles.dayInitialActive,
    color: '#60a5fa'
  },
  scheduleDay: {
    ...baseStyles.scheduleDay,
    color: '#f1f5f9'
  },
  scheduleTime: {
    ...baseStyles.scheduleTime,
    color: '#f1f5f9'
  },
  scheduleTimeInactive: {
    ...baseStyles.scheduleTimeInactive,
    color: '#64748b'
  },
  todayDot: {
    ...baseStyles.todayDot,
    backgroundColor: '#60a5fa'
  },
  multipleTurnsBadge: {
    ...baseStyles.multipleTurnsBadge,
    backgroundColor: '#1e3a8a'
  },
  multipleTurnsText: {
    ...baseStyles.multipleTurnsText,
    color: '#60a5fa'
  },
  modalContent: {
    ...baseStyles.modalContent,
    backgroundColor: '#0f172a'
  },
  modalHeader: {
    ...baseStyles.modalHeader,
    borderBottomColor: '#334155'
  },
  modalTitle: {
    ...baseStyles.modalTitle,
    color: '#f1f5f9'
  },
  modalSubtitle: {
    ...baseStyles.modalSubtitle,
    color: '#64748b'
  },
  modalCloseButton: {
    ...baseStyles.modalCloseButton,
    backgroundColor: '#1e293b'
  },
  modalTurnoBlock: {
    ...baseStyles.modalTurnoBlock,
  },
  modalTurnoDetails: {
    ...baseStyles.modalTurnoDetails,
    backgroundColor: '#0f172a'
  },
  modalTurnoTitle: {
    ...baseStyles.modalTurnoTitle,
    color: '#f1f5f9'
  },
  modalTurnoTime: {
    ...baseStyles.modalTurnoTime,
    color: '#f1f5f9'
  },
  modalTurnoNumber: {
    ...baseStyles.modalTurnoNumber,
    backgroundColor: '#1d4ed8'
  },
  modalFooter: {
    ...baseStyles.modalFooter,
    borderTopColor: '#334155'
  }
});