/**
 * ProfileTabs Component
 * Tab navigation for Bookmarks, Likes, and Watched videos
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ProfileTab } from '../types';

interface ProfileTabsProps {
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  bookmarkCount?: number;
  likeCount?: number;
  watchedCount?: number;
}

export const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  onTabChange,
  bookmarkCount = 0,
  likeCount = 0,
  watchedCount = 0,
}) => {
  const tabs: { key: ProfileTab; label: string; count: number }[] = [
    { key: 'bookmarks', label: 'Bookmarks', count: bookmarkCount },
    { key: 'likes', label: 'Likes', count: likeCount },
    { key: 'watched', label: 'Watched', count: watchedCount },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && styles.activeTab]}
          onPress={() => onTabChange(tab.key)}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabLabel, activeTab === tab.key && styles.activeTabLabel]}>
            {tab.label}
          </Text>
          {tab.count > 0 && (
            <View style={[styles.countBadge, activeTab === tab.key && styles.activeCountBadge]}>
              <Text style={[styles.countText, activeTab === tab.key && styles.activeCountText]}>
                {tab.count > 99 ? '99+' : tab.count}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FF8C42',
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666666',
  },
  activeTabLabel: {
    color: '#FF8C42',
  },
  countBadge: {
    backgroundColor: '#E8E8E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  activeCountBadge: {
    backgroundColor: '#FF8C42',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  activeCountText: {
    color: '#FFFFFF',
  },
});
