import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../../../theme';
import { JobLog } from '../types/admin.types';

interface Props {
  logs: JobLog[];
  maxHeight?: number;
}

const LOG_STATUS_COLORS: Record<string, string> = {
  success: '#2E7D32',
  failed: '#C62828',
  info: '#1565C0',
  warning: '#E65100',
};

export const LogsViewer: React.FC<Props> = ({ logs, maxHeight = 300 }) => {
  if (!logs.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No logs yet</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { maxHeight }]}>
      <Text style={styles.heading}>Pipeline Logs</Text>
      <ScrollView nestedScrollEnabled>
        {logs.map((log) => (
          <View key={log.id} style={styles.entry}>
            <View style={styles.entryHeader}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: LOG_STATUS_COLORS[log.status] || '#999' },
                ]}
              />
              <Text style={styles.stepName}>{formatStep(log.step_name)}</Text>
              <Text style={styles.time}>{formatTime(log.created_at)}</Text>
            </View>
            <Text style={styles.message}>{log.message}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

function formatStep(step: string): string {
  return step.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString();
  } catch {
    return iso;
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: spacing.md,
    overflow: 'hidden',
  },
  heading: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: '#EBEBF5',
    marginBottom: spacing.sm,
  },
  entry: {
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  stepName: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: '#EBEBF5',
    flex: 1,
  },
  time: {
    fontSize: 10,
    color: '#8E8E93',
  },
  message: {
    fontSize: typography.fontSize.xs,
    color: '#AEAEB2',
    marginLeft: 14,
  },
  empty: {
    padding: spacing.md,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.text.tertiary,
    fontSize: typography.fontSize.sm,
  },
});
