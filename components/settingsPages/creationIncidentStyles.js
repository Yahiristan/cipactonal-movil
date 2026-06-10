import { StyleSheet, Platform } from 'react-native';

const baseStyles = {
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        backgroundColor: '#2563eb',
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
    modalBody: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
        backgroundColor: '#ffffff',
    },
    sectionContainer: {
        backgroundColor: '#f9fafb',
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 28,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: 1.2,
        marginLeft: 12,
        marginBottom: 8,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        justifyContent: 'space-between',
    },
    divider: {
        height: 1,
        backgroundColor: '#f3f4f6',
        marginLeft: 16,
        marginRight: 16,
    },
    settingItemLeft: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    settingItemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
        letterSpacing: -0.2,
    },
    settingItemValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#64748b',
        marginRight: 4,
    },
    tipoIconSmall: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        paddingHorizontal: 16,
    },
    dateCompact: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 16,
        paddingVertical: 12,
        gap: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    dateCompactActive: {
        borderColor: '#3b82f6',
        borderWidth: 2,
    },
    dateCompactInfo: {
        alignItems: 'center',
    },
    dateCompactLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 2,
    },
    dateCompactValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1f2937',
    },
    dateArrow: {
        paddingHorizontal: 10,
    },
    datePickerInline: {
        alignItems: 'center',
        marginVertical: 10,
    },
    durationSummary: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eff6ff',
        padding: 12,
        borderRadius: 12,
        marginHorizontal: 16,
        marginBottom: 16,
        gap: 8,
    },
    durationText: {
        fontSize: 13,
        color: '#1f2937',
        fontWeight: '600',
    },
    durationValue: {
        fontSize: 14,
        fontWeight: '800',
        color: '#2563eb',
    },
    motivoCard: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        padding: 4,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    motivoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 4,
        gap: 8,
    },
    motivoPlaceholder: {
        fontSize: 13,
        color: '#9ca3af',
        fontWeight: '500',
    },
    motivoInput: {
        padding: 16,
        paddingTop: 8,
        fontSize: 15,
        color: '#1f2937',
        minHeight: 120,
        textAlignVertical: 'top',
        backgroundColor: 'transparent',
    },
    modalFooter: {
        flexDirection: 'row',
        gap: 12,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    cancelButtonModal: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
    },
    cancelButtonModalText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#475569',
    },
    createButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        backgroundColor: '#2563eb',
        alignItems: 'center',
    },
    createButtonDisabled: {
        opacity: 0.5,
    },
    createButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#ffffff',
    },
    headerPlaceholder: {
        width: 40,
    },
    tipoListBody: {
        padding: 20,
        backgroundColor: '#ffffff',
    },
    tipoOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#f9fafb',
        borderRadius: 16,
        marginBottom: 12,
    },
    tipoOptionActive: {
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#3b82f6',
    },
    tipoOptionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    tipoOptionLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1f2937',
    },
};

export const creationIncidentStyles = StyleSheet.create(baseStyles);

export const creationIncidentStylesDark = StyleSheet.create({
    ...baseStyles,
    container: {
        ...baseStyles.container,
        backgroundColor: '#0f172a',
    },
    header: {
        ...baseStyles.header,
        backgroundColor: '#1e40af',
    },
    headerTitle: {
        ...baseStyles.headerTitle,
        color: '#f1f5f9',
    },
    modalBody: {
        ...baseStyles.modalBody,
        backgroundColor: '#0f172a',
    },
    sectionContainer: {
        ...baseStyles.sectionContainer,
        backgroundColor: '#1e293b',
    },
    sectionLabel: {
        ...baseStyles.sectionLabel,
        color: '#64748b',
    },
    divider: {
        ...baseStyles.divider,
        backgroundColor: '#334155',
    },
    settingItemTitle: {
        ...baseStyles.settingItemTitle,
        color: '#f1f5f9',
    },
    settingItemValue: {
        ...baseStyles.settingItemValue,
        color: '#94a3b8',
    },
    dateCompact: {
        ...baseStyles.dateCompact,
        backgroundColor: '#1e293b',
        borderColor: '#334155',
    },
    dateCompactActive: {
        ...baseStyles.dateCompactActive,
        borderColor: '#60a5fa',
    },
    dateCompactLabel: {
        ...baseStyles.dateCompactLabel,
        color: '#94a3b8',
    },
    dateCompactValue: {
        ...baseStyles.dateCompactValue,
        color: '#f1f5f9',
    },
    durationSummary: {
        ...baseStyles.durationSummary,
        backgroundColor: '#172554',
    },
    durationText: {
        ...baseStyles.durationText,
        color: '#f1f5f9',
    },
    durationValue: {
        ...baseStyles.durationValue,
        color: '#60a5fa',
    },
    motivoCard: {
        ...baseStyles.motivoCard,
        backgroundColor: '#1e293b',
        borderColor: '#334155',
    },
    motivoInput: {
        ...baseStyles.motivoInput,
        color: '#f1f5f9',
    },
    modalFooter: {
        ...baseStyles.modalFooter,
        backgroundColor: '#0f172a',
        borderTopColor: '#334155',
    },
    cancelButtonModal: {
        ...baseStyles.cancelButtonModal,
        backgroundColor: '#1e293b',
    },
    cancelButtonModalText: {
        ...baseStyles.cancelButtonModalText,
        color: '#94a3b8',
    },
    tipoListBody: {
        ...baseStyles.tipoListBody,
        backgroundColor: '#0f172a',
    },
    tipoOption: {
        ...baseStyles.tipoOption,
        backgroundColor: '#1e293b',
    },
    tipoOptionActive: {
        ...baseStyles.tipoOptionActive,
        backgroundColor: '#172554',
        borderColor: '#3b82f6',
    },
    tipoOptionLabel: {
        ...baseStyles.tipoOptionLabel,
        color: '#f1f5f9',
    },
});
