import { StyleSheet, Platform } from 'react-native';

const baseStyles = {
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        backgroundColor: '#2563eb',
        paddingTop: Platform.OS === 'android' ? 16 : 50,
        paddingBottom: 20,
        paddingHorizontal: 16,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
    },
    headerPlaceholder: {
        width: 40,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Filtros
    viewToggle: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 12,
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        padding: 4,
    },
    viewButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        gap: 6,
    },
    viewButtonActive: {
        backgroundColor: '#ffffff',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    viewButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748b',
    },
    viewButtonTextActive: {
        color: '#1f2937',
    },
    filtrosContainer: {
        flexDirection: 'row',
        marginHorizontal: 16,
        marginBottom: 20,
        gap: 8,
    },
    filtroChip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        gap: 6,
    },
    filtroChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
        flex: 1,
    },
    filtroChipBadge: {
        backgroundColor: '#e2e8f0',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        minWidth: 20,
        alignItems: 'center',
    },
    filtroChipBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#475569',
    },

    // Calendario (opcional en vista)
    calendarSection: {
        backgroundColor: '#f9fafb',
        marginHorizontal: 16,
        marginBottom: 20,
        borderRadius: 24,
        padding: 16,
    },
    monthSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    monthButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
    },
    monthButtonText: {
        color: '#1f2937',
    },
    monthText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1f2937',
    },
    calendar: {},
    weekDays: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    weekDay: {
        flex: 1,
        alignItems: 'center',
    },
    weekDayText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
    },
    daysGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    dayCell: {
        width: '14.28%',
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayContent: {
        width: '80%',
        height: '80%',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    dayContentSelected: {
        backgroundColor: '#2563eb',
    },
    dayContentToday: {
        borderWidth: 2,
        borderColor: '#2563eb',
    },
    dayText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#1f2937',
    },
    dayTextSelected: {
        color: '#fff',
        fontWeight: '700',
    },
    dayTextToday: {
        color: '#2563eb',
        fontWeight: '700',
    },
    dayContentInRange: {
        backgroundColor: '#dbeafe',
    },
    dayTextInRange: {
        color: '#1d4ed8',
        fontWeight: '600',
    },
    dayIndicators: {
        flexDirection: 'row',
        gap: 2,
        marginTop: 2,
        justifyContent: 'center',
    },
    dayIndicator: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: '#3b82f6',
    },

    // Headers de Sección tipo settings
    sectionDayHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 8,
        marginTop: 12,
    },
    sectionDayTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    sectionDayCount: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '500',
    },
    
    // Header principal de incidencias
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 12,
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: 1.1,
    },
    sectionCount: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '500',
    },

    // Contenedor principal de lista (igual a sectionContainer)
    incidenciasList: {
        paddingHorizontal: 16,
    },
    sectionContainer: {
        backgroundColor: '#f9fafb',
        borderRadius: 24,
        marginBottom: 28,
        overflow: 'hidden',
    },
    incidenciaCard: {
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    incidenciaCardBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    tipoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    tipoIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tipoIconSmall: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tipoInfo: {
        flex: 1,
    },
    tipoText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        letterSpacing: -0.2,
        marginBottom: 2,
    },
    fechaText: {
        fontSize: 13,
        color: '#64748b',
    },
    estadoBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    expandedContent: {
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    motivoText: {
        fontSize: 14,
        color: '#475569',
        lineHeight: 20,
        marginBottom: 12,
    },
    diasBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: '#ffffff',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
    },
    diasText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#64748b',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 13,
        fontWeight: '500',
        color: '#64748b',
        flex: 1,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1f2937',
        flex: 2,
        textAlign: 'right',
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#fef2f2',
        gap: 6,
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ef4444',
    },

    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1f2937',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
    },
    modalOverlayBottomSheet: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
    },
    modalSheetContent: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        maxHeight: '70%',
    },
    modalSheetHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#e2e8f0',
        borderRadius: 2,
        alignSelf: 'center',
        marginTop: 12,
        marginBottom: 8,
    },
    modalListHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    modalListTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1f2937',
    },
    modalListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    modalListItemActive: {
        backgroundColor: '#f9fafb',
    },
    modalListItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    modalListItemText: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1f2937',
    },
    modalListItemTextActive: {
        color: '#2563eb',
        fontWeight: '600',
    },
    modalListItemBadge: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        minWidth: 28,
        alignItems: 'center',
    },
};

export const incidenciasStyles = StyleSheet.create(baseStyles);

export const incidenciasStylesDark = StyleSheet.create({
    ...baseStyles,
    container: {
        ...baseStyles.container,
        backgroundColor: '#0f172a',
    },
    header: {
        ...baseStyles.header,
        backgroundColor: '#1e40af',
    },
    viewToggle: {
        ...baseStyles.viewToggle,
        backgroundColor: '#1e293b',
    },
    viewButtonActive: {
        ...baseStyles.viewButtonActive,
        backgroundColor: '#0f172a',
        shadowOpacity: 0.2,
    },
    viewButtonText: {
        ...baseStyles.viewButtonText,
        color: '#94a3b8',
    },
    viewButtonTextActive: {
        ...baseStyles.viewButtonTextActive,
        color: '#f1f5f9',
    },
    filtroChip: {
        ...baseStyles.filtroChip,
        backgroundColor: '#1e293b',
    },
    filtroChipText: {
        ...baseStyles.filtroChipText,
        color: '#cbd5e1',
    },
    filtroChipBadge: {
        ...baseStyles.filtroChipBadge,
        backgroundColor: '#334155',
    },
    filtroChipBadgeText: {
        ...baseStyles.filtroChipBadgeText,
        color: '#cbd5e1',
    },
    calendarSection: {
        ...baseStyles.calendarSection,
        backgroundColor: '#1e293b',
    },
    monthButton: {
        ...baseStyles.monthButton,
        backgroundColor: '#0f172a',
    },
    monthButtonText: {
        ...baseStyles.monthButtonText,
        color: '#f1f5f9',
    },
    monthText: {
        ...baseStyles.monthText,
        color: '#f1f5f9',
    },
    weekDayText: {
        ...baseStyles.weekDayText,
        color: '#94a3b8',
    },
    dayText: {
        ...baseStyles.dayText,
        color: '#f1f5f9',
    },
    sectionDayTitle: {
        ...baseStyles.sectionDayTitle,
        color: '#94a3b8',
    },
    sectionTitle: {
        ...baseStyles.sectionTitle,
        color: '#94a3b8',
    },
    sectionCount: {
        ...baseStyles.sectionCount,
        color: '#64748b',
    },
    sectionContainer: {
        ...baseStyles.sectionContainer,
        backgroundColor: '#1e293b',
    },
    incidenciaCardBorder: {
        ...baseStyles.incidenciaCardBorder,
        borderBottomColor: '#334155',
    },
    tipoText: {
        ...baseStyles.tipoText,
        color: '#f1f5f9',
    },
    fechaText: {
        ...baseStyles.fechaText,
        color: '#94a3b8',
    },
    estadoBadge: {
        ...baseStyles.estadoBadge,
        backgroundColor: '#0f172a',
    },
    expandedContent: {
        ...baseStyles.expandedContent,
        borderTopColor: '#334155',
    },
    motivoText: {
        ...baseStyles.motivoText,
        color: '#cbd5e1',
    },
    diasBadge: {
        ...baseStyles.diasBadge,
        backgroundColor: '#0f172a',
    },
    diasText: {
        ...baseStyles.diasText,
        color: '#94a3b8',
    },
    detailLabel: {
        ...baseStyles.detailLabel,
        color: '#94a3b8',
    },
    detailValue: {
        ...baseStyles.detailValue,
        color: '#f1f5f9',
    },
    cancelButton: {
        ...baseStyles.cancelButton,
        backgroundColor: '#450a0a',
    },
    cancelButtonText: {
        ...baseStyles.cancelButtonText,
        color: '#fca5a5',
    },
    emptyTitle: {
        ...baseStyles.emptyTitle,
        color: '#f1f5f9',
    },
    modalSheetContent: {
        ...baseStyles.modalSheetContent,
        backgroundColor: '#0f172a',
    },
    modalSheetHandle: {
        ...baseStyles.modalSheetHandle,
        backgroundColor: '#334155',
    },
    modalListHeader: {
        ...baseStyles.modalListHeader,
        borderBottomColor: '#334155',
    },
    modalListTitle: {
        ...baseStyles.modalListTitle,
        color: '#f1f5f9',
    },
    modalListItem: {
        ...baseStyles.modalListItem,
        borderBottomColor: '#334155',
    },
    modalListItemActive: {
        ...baseStyles.modalListItemActive,
        backgroundColor: '#1e293b',
    },
    modalListItemText: {
        ...baseStyles.modalListItemText,
        color: '#f1f5f9',
    },
    modalListItemBadge: {
        ...baseStyles.modalListItemBadge,
        backgroundColor: '#1e293b',
    },
});
