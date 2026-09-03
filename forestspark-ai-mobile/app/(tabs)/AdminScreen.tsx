import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {
  Users,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  PauseCircle,
  PlayCircle,
  Trash2,
  Search,
  RefreshCw,
  AlertTriangle,
  Lock,
  FileText,
  Save,
  Eye,
  RotateCcw,
  CheckSquare,
  Square,
  Check,
} from 'lucide-react-native';
import { useAuth } from '../../src/context/AuthContext';
import api from '@/src/api/axios';
import PolicyModal from '../../components/PolicyModal';

interface ManagedUser {
  _id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'user';
  isPaused: boolean;
  date?: string;
}

interface SummaryData {
  totalUsers: number;
  adminUsers: number;
  regularUsers: number;
  activeUsers: number;
  pausedUsers: number;
}

export default function AdminScreen() {
  const { user: currentUser, token } = useAuth();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [summary, setSummary] = useState<SummaryData>({
    totalUsers: 0,
    adminUsers: 0,
    regularUsers: 0,
    activeUsers: 0,
    pausedUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user' | 'paused'>('all');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // View Section: 'users' vs 'policies'
  const [adminSection, setAdminSection] = useState<'users' | 'policies'>('users');

  // Policy Editor state
  const [policyTitle, setPolicyTitle] = useState('Terms of Service & Privacy Policy');
  const [policyContent, setPolicyContent] = useState('');
  const [policyRequireAcceptance, setPolicyRequireAcceptance] = useState(true);
  const [policyLastUpdated, setPolicyLastUpdated] = useState('');
  const [policyUpdatedBy, setPolicyUpdatedBy] = useState('');
  const [policyLoading, setPolicyLoading] = useState(false);
  const [policySaving, setPolicySaving] = useState(false);
  const [showPolicyPreview, setShowPolicyPreview] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get('/admin/users');

      if (response.data) {
        setUsers(response.data.users || []);
        if (response.data.summary) {
          setSummary(response.data.summary);
        }
      }
    } catch (err: any) {
      console.error('Error fetching users:', err?.response?.data || err.message);
      Alert.alert(
        'Error Fetching Users',
        err?.response?.data?.message || 'Could not load users list.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  const fetchPolicy = useCallback(async () => {
    setPolicyLoading(true);
    try {
      const response = await api.get('/policies');
      if (response.data) {
        setPolicyTitle(response.data.title || 'Terms of Service & Privacy Policy');
        setPolicyContent(response.data.content || '');
        setPolicyRequireAcceptance(response.data.requireAcceptance ?? true);
        setPolicyLastUpdated(response.data.lastUpdated || '');
        setPolicyUpdatedBy(response.data.updatedBy || 'Admin');
      }
    } catch (err: any) {
      console.error('Error fetching policy:', err?.response?.data || err.message);
    } finally {
      setPolicyLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchUsers();
      fetchPolicy();
    } else {
      setLoading(false);
    }
  }, [currentUser, fetchUsers, fetchPolicy]);

  const onRefresh = () => {
    setRefreshing(true);
    if (adminSection === 'users') {
      fetchUsers();
    } else {
      fetchPolicy();
      setRefreshing(false);
    }
  };

  const handleSavePolicy = async () => {
    if (!policyContent.trim()) {
      Alert.alert('Validation Error', 'Policy content cannot be empty.');
      return;
    }

    setPolicySaving(true);
    try {
      const res = await api.put('/policies', {
        title: policyTitle.trim(),
        content: policyContent.trim(),
        requireAcceptance: policyRequireAcceptance,
      });

      if (res.data?.policy) {
        setPolicyLastUpdated(res.data.policy.lastUpdated);
        setPolicyUpdatedBy(res.data.policy.updatedBy);
      }
      Alert.alert(
        'Success',
        'Policies updated successfully! The new policy is immediately live on registration and Google sign-in/up screens.'
      );
    } catch (err: any) {
      Alert.alert('Save Failed', err?.response?.data?.message || 'Could not save policies.');
    } finally {
      setPolicySaving(false);
    }
  };

  const handleResetPolicyTemplate = () => {
    Alert.alert(
      'Reset Policy Template',
      'Are you sure you want to load the default policy template? You still need to tap Save to apply it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Template',
          style: 'destructive',
          onPress: () => {
            setPolicyTitle('Terms of Service & Privacy Policy');
            setPolicyContent(`Welcome to ForeSpark. By using our services, registering an account, or continuing with Google Sign-In, you agree to comply with and be bound by the following terms and policies:

1. Acceptance of Terms
By creating an account or using ForeSpark services, you acknowledge that you have read, understood, and agreed to be bound by these policies.

2. Privacy & Data Collection
We collect basic profile information (such as name and email address) and scan history to provide fire prediction, satellite analysis, and reporting services. We prioritize your privacy and do not sell your personal data to third parties.

3. Google Authentication
When signing in or registering with Google, you authorize ForeSpark to authenticate your identity using your verified Google profile information (name, email, and Google profile ID) in accordance with Google API Services User Data Policy.

4. Acceptable Use
You agree to use ForeSpark exclusively for lawful fire safety, monitoring, and educational evaluation purposes. Any attempt to abuse, reverse-engineer, or disrupt platform infrastructure is strictly prohibited.

5. AI Prediction Disclaimer
ForeSpark provides risk assessments using satellite imagery and machine learning models. These predictions are designed for situational awareness and decision support. They do not replace authoritative directives from civil defense or emergency services.

6. Account Management & Termination
Administrators reserve the right to suspend or terminate accounts that violate platform policies or compromise system security.

7. Policy Updates
These policies may be revised periodically by administrators. Continued use of ForeSpark following any updates constitutes acceptance of the modified policies.`);
            setPolicyRequireAcceptance(true);
          },
        },
      ]
    );
  };

  // Change Role Handler
  const handleToggleRole = (targetUser: ManagedUser) => {
    const isSelf = targetUser._id === currentUser?.id || targetUser.email === currentUser?.email;
    if (isSelf) {
      Alert.alert('Restricted Action', 'You cannot change your own admin role.');
      return;
    }

    const newRole: 'admin' | 'user' = targetUser.role === 'admin' ? 'user' : 'admin';
    const actionText = newRole === 'admin' ? 'promote to Administrator' : 'demote to Normal User';

    Alert.alert(
      'Change User Role',
      `Are you sure you want to ${actionText} for ${targetUser.fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: newRole === 'admin' ? 'Make Admin' : 'Demote to User',
          style: newRole === 'admin' ? 'default' : 'destructive',
          onPress: async () => {
            try {
              setActionLoadingId(targetUser._id);
              await api.patch(
                `/admin/users/${targetUser._id}/role`,
                { role: newRole }
              );

              // Update local state
              setUsers((prev) =>
                prev.map((u) => (u._id === targetUser._id ? { ...u, role: newRole } : u))
              );
              setSummary((prev) => ({
                ...prev,
                adminUsers: newRole === 'admin' ? prev.adminUsers + 1 : prev.adminUsers - 1,
                regularUsers: newRole === 'user' ? prev.regularUsers + 1 : prev.regularUsers - 1,
              }));

              Alert.alert('Success', `${targetUser.fullName} is now a ${newRole}.`);
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to update role.');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  // Pause / Resume Status Handler
  const handleTogglePause = (targetUser: ManagedUser) => {
    const isSelf = targetUser._id === currentUser?.id || targetUser.email === currentUser?.email;
    if (isSelf) {
      Alert.alert('Restricted Action', 'You cannot pause your own account.');
      return;
    }

    const willPause = !targetUser.isPaused;
    const title = willPause ? 'Pause Account' : 'Activate Account';
    const message = willPause
      ? `Are you sure you want to pause ${targetUser.fullName}'s account? They will not be able to log in.`
      : `Are you sure you want to reactivate ${targetUser.fullName}'s account?`;

    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: willPause ? 'Pause Account' : 'Activate',
        style: willPause ? 'destructive' : 'default',
        onPress: async () => {
          try {
            setActionLoadingId(targetUser._id);
            await api.patch(
              `/admin/users/${targetUser._id}/status`,
              { isPaused: willPause }
            );

            // Update local state
            setUsers((prev) =>
              prev.map((u) => (u._id === targetUser._id ? { ...u, isPaused: willPause } : u))
            );
            setSummary((prev) => ({
              ...prev,
              pausedUsers: willPause ? prev.pausedUsers + 1 : prev.pausedUsers - 1,
              activeUsers: willPause ? prev.activeUsers - 1 : prev.activeUsers + 1,
            }));

            Alert.alert(
              'Success',
              `Account for ${targetUser.fullName} has been ${willPause ? 'paused' : 'resumed'}.`
            );
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed to update account status.');
          } finally {
            setActionLoadingId(null);
          }
        },
      },
    ]);
  };

  // Delete User Handler
  const handleDeleteUser = (targetUser: ManagedUser) => {
    const isSelf = targetUser._id === currentUser?.id || targetUser.email === currentUser?.email;
    if (isSelf) {
      Alert.alert('Restricted Action', 'You cannot delete your own account.');
      return;
    }

    Alert.alert(
      'Permanently Delete User',
      `Are you sure you want to delete ${targetUser.fullName} (${targetUser.email})? This action CANNOT be undone and will delete their scan data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete User',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoadingId(targetUser._id);
              await api.delete(`/admin/users/${targetUser._id}`);

              setUsers((prev) => prev.filter((u) => u._id !== targetUser._id));
              setSummary((prev) => ({
                ...prev,
                totalUsers: Math.max(0, prev.totalUsers - 1),
                adminUsers: targetUser.role === 'admin' ? Math.max(0, prev.adminUsers - 1) : prev.adminUsers,
                regularUsers: targetUser.role !== 'admin' ? Math.max(0, prev.regularUsers - 1) : prev.regularUsers,
                activeUsers: !targetUser.isPaused ? Math.max(0, prev.activeUsers - 1) : prev.activeUsers,
                pausedUsers: targetUser.isPaused ? Math.max(0, prev.pausedUsers - 1) : prev.pausedUsers,
              }));

              Alert.alert('Deleted', `User ${targetUser.fullName} has been deleted.`);
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'Failed to delete user.');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  if (currentUser?.role !== 'admin') {
    return (
      <View style={styles.deniedContainer}>
        <Lock size={64} color="#ef4444" />
        <Text style={styles.deniedTitle}>Access Denied</Text>
        <Text style={styles.deniedSubtitle}>
          You do not have administrator permissions to view this panel.
        </Text>
      </View>
    );
  }

  // Filter users based on search and active filter
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterRole === 'admin') return u.role === 'admin';
    if (filterRole === 'user') return u.role !== 'admin';
    if (filterRole === 'paused') return u.isPaused;
    return true;
  });

  const renderUserCard = ({ item }: { item: ManagedUser }) => {
    const isSelf = item._id === currentUser?.id || item.email === currentUser?.email;
    const isItemLoading = actionLoadingId === item._id;

    return (
      <View style={[styles.userCard, item.isPaused && styles.userCardPaused]}>
        {/* User Card Top Row */}
        <View style={styles.userCardHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {item.fullName
                ? item.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()
                : 'U'}
            </Text>
          </View>

          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName} numberOfLines={1}>
                {item.fullName}
              </Text>
              {isSelf && (
                <View style={styles.selfBadge}>
                  <Text style={styles.selfBadgeText}>YOU</Text>
                </View>
              )}
            </View>
            <Text style={styles.userEmail} numberOfLines={1}>
              {item.email}
            </Text>
          </View>
        </View>

        {/* Badges Row */}
        <View style={styles.badgesRow}>
          <View
            style={[
              styles.roleBadge,
              item.role === 'admin' ? styles.adminBadge : styles.normalUserBadge,
            ]}
          >
            {item.role === 'admin' ? (
              <ShieldCheck size={13} color="#059669" />
            ) : (
              <Users size={13} color="#64748b" />
            )}
            <Text
              style={[
                styles.badgeLabel,
                { color: item.role === 'admin' ? '#059669' : '#64748b' },
              ]}
            >
              {item.role.toUpperCase()}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              item.isPaused ? styles.pausedBadge : styles.activeBadge,
            ]}
          >
            {item.isPaused ? (
              <PauseCircle size={13} color="#ef4444" />
            ) : (
              <UserCheck size={13} color="#10b981" />
            )}
            <Text
              style={[
                styles.badgeLabel,
                { color: item.isPaused ? '#ef4444' : '#10b981' },
              ]}
            >
              {item.isPaused ? 'PAUSED' : 'ACTIVE'}
            </Text>
          </View>

          {item.date && (
            <Text style={styles.joinDateText}>
              Joined {new Date(item.date).toLocaleDateString()}
            </Text>
          )}
        </View>

        {/* Action Controls */}
        <View style={styles.actionDivider} />

        {isItemLoading ? (
          <View style={styles.actionLoadingRow}>
            <ActivityIndicator size="small" color="#059669" />
            <Text style={styles.actionLoadingText}>Updating user...</Text>
          </View>
        ) : (
          <View style={styles.actionsRow}>
            {/* Toggle Role Button */}
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.roleBtn,
                isSelf && styles.disabledBtn,
              ]}
              disabled={isSelf}
              onPress={() => handleToggleRole(item)}
            >
              <Shield size={14} color={isSelf ? '#94a3b8' : '#0284c7'} />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: isSelf ? '#94a3b8' : '#0284c7' },
                ]}
              >
                {item.role === 'admin' ? 'Make User' : 'Make Admin'}
              </Text>
            </TouchableOpacity>

            {/* Pause / Resume Button */}
            <TouchableOpacity
              style={[
                styles.actionBtn,
                item.isPaused ? styles.resumeBtn : styles.pauseBtn,
                isSelf && styles.disabledBtn,
              ]}
              disabled={isSelf}
              onPress={() => handleTogglePause(item)}
            >
              {item.isPaused ? (
                <PlayCircle size={14} color={isSelf ? '#94a3b8' : '#10b981'} />
              ) : (
                <PauseCircle size={14} color={isSelf ? '#94a3b8' : '#f59e0b'} />
              )}
              <Text
                style={[
                  styles.actionBtnText,
                  {
                    color: isSelf
                      ? '#94a3b8'
                      : item.isPaused
                      ? '#10b981'
                      : '#d97706',
                  },
                ]}
              >
                {item.isPaused ? 'Resume' : 'Pause'}
              </Text>
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity
              style={[
                styles.actionBtn,
                styles.deleteBtn,
                isSelf && styles.disabledBtn,
              ]}
              disabled={isSelf}
              onPress={() => handleDeleteUser(item)}
            >
              <Trash2 size={14} color={isSelf ? '#94a3b8' : '#ef4444'} />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: isSelf ? '#94a3b8' : '#ef4444' },
                ]}
              >
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#059669" />

      {/* Decorative Background Accent */}
      <View style={styles.headerBackground} />

      <View style={styles.container}>
        {/* Screen Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>ADMINISTRATION</Text>
            <Text style={styles.headerTitle}>
              {adminSection === 'users' ? 'User Management' : 'Policies & Terms'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshIconBtn}
            onPress={onRefresh}
            disabled={loading || refreshing}
          >
            <RefreshCw
              size={18}
              color="#059669"
              style={refreshing ? styles.spinIcon : undefined}
            />
          </TouchableOpacity>
        </View>

        {/* Section Tabs Switcher */}
        <View style={styles.sectionTabs}>
          <TouchableOpacity
            style={[
              styles.sectionTab,
              adminSection === 'users' && styles.sectionTabActive,
            ]}
            onPress={() => setAdminSection('users')}
          >
            <Users
              size={15}
              color={adminSection === 'users' ? '#ffffff' : '#64748b'}
            />
            <Text
              style={[
                styles.sectionTabText,
                adminSection === 'users' && styles.sectionTabTextActive,
              ]}
            >
              Users ({users.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sectionTab,
              adminSection === 'policies' && styles.sectionTabActive,
            ]}
            onPress={() => setAdminSection('policies')}
          >
            <FileText
              size={15}
              color={adminSection === 'policies' ? '#ffffff' : '#64748b'}
            />
            <Text
              style={[
                styles.sectionTabText,
                adminSection === 'policies' && styles.sectionTabTextActive,
              ]}
            >
              Policies & Terms
            </Text>
          </TouchableOpacity>
        </View>

        {/* SECTION 1: POLICIES EDITOR */}
        {adminSection === 'policies' ? (
          <ScrollView
            style={styles.policyEditorScroll}
            contentContainerStyle={styles.policyEditorContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Notice Banner */}
            <View style={styles.policyBanner}>
              <ShieldCheck size={20} color="#059669" />
              <Text style={styles.policyBannerText}>
                Policies updated here are dynamically synchronized across the Registration screen, Google Sign-In/Up disclaimers, and Web Auth modals.
              </Text>
            </View>

            {/* Title Field */}
            <View style={styles.policyFieldGroup}>
              <Text style={styles.policyFieldLabel}>POLICY TITLE</Text>
              <TextInput
                style={styles.policyTitleInput}
                value={policyTitle}
                onChangeText={setPolicyTitle}
                placeholder="e.g. Terms of Service & Privacy Policy"
                placeholderTextColor="#94a3b8"
              />
            </View>

            {/* Require Acceptance Toggle */}
            <TouchableOpacity
              style={styles.policyToggleRow}
              onPress={() => setPolicyRequireAcceptance(!policyRequireAcceptance)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.policyCheckbox,
                  policyRequireAcceptance && styles.policyCheckboxChecked,
                ]}
              >
                {policyRequireAcceptance && (
                  <Check size={13} color="#fff" strokeWidth={3.5} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.policyToggleTitle}>
                  Require Acceptance on Registration
                </Text>
                <Text style={styles.policyToggleSubtitle}>
                  Users must explicitly check the agreement box before creating an account.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Policy Content Editor */}
            <View style={styles.policyFieldGroup}>
              <View style={styles.policyContentHeader}>
                <Text style={styles.policyFieldLabel}>
                  TERMS & PRIVACY POLICY CONTENT
                </Text>
                <TouchableOpacity onPress={handleResetPolicyTemplate}>
                  <Text style={styles.resetTemplateBtn}>Reset Template</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.policyContentInput}
                value={policyContent}
                onChangeText={setPolicyContent}
                placeholder="Write your platform policies, terms of use, privacy declarations, and disclaimers here..."
                placeholderTextColor="#94a3b8"
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Meta info */}
            {policyLastUpdated ? (
              <Text style={styles.policyMetaText}>
                Last updated on {new Date(policyLastUpdated).toLocaleString()} by {policyUpdatedBy}
              </Text>
            ) : null}

            {/* Action Buttons */}
            <View style={styles.policyActionsRow}>
              <TouchableOpacity
                style={styles.policyPreviewBtn}
                onPress={() => setShowPolicyPreview(true)}
              >
                <Eye size={16} color="#0284c7" />
                <Text style={styles.policyPreviewBtnText}>Preview Modal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.policySaveBtn, policySaving && { opacity: 0.6 }]}
                onPress={handleSavePolicy}
                disabled={policySaving}
              >
                {policySaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Save size={16} color="#fff" />
                    <Text style={styles.policySaveBtnText}>Save Policies</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          /* SECTION 2: USERS MANAGEMENT */
          <>
            {/* Statistics Cards Grid */}
            <View style={styles.statsGrid}>
              {/* Total Users */}
              <View style={[styles.statCard, styles.statCardTotal]}>
                <View style={styles.statIconBadge}>
                  <Users size={16} color="#059669" />
                </View>
                <Text style={styles.statNumber}>{summary.totalUsers}</Text>
                <Text style={styles.statCaption}>Total Users</Text>
              </View>

              {/* Admins */}
              <View style={[styles.statCard, styles.statCardAdmin]}>
                <View style={[styles.statIconBadge, { backgroundColor: '#e0f2fe' }]}>
                  <ShieldCheck size={16} color="#0284c7" />
                </View>
                <Text style={[styles.statNumber, { color: '#0284c7' }]}>
                  {summary.adminUsers}
                </Text>
                <Text style={styles.statCaption}>Admins</Text>
              </View>

              {/* Active */}
              <View style={[styles.statCard, styles.statCardActive]}>
                <View style={[styles.statIconBadge, { backgroundColor: '#dcfce7' }]}>
                  <UserCheck size={16} color="#16a34a" />
                </View>
                <Text style={[styles.statNumber, { color: '#16a34a' }]}>
                  {summary.activeUsers}
                </Text>
                <Text style={styles.statCaption}>Active</Text>
              </View>

              {/* Paused */}
              <View style={[styles.statCard, styles.statCardPaused]}>
                <View style={[styles.statIconBadge, { backgroundColor: '#fee2e2' }]}>
                  <UserX size={16} color="#dc2626" />
                </View>
                <Text style={[styles.statNumber, { color: '#dc2626' }]}>
                  {summary.pausedUsers}
                </Text>
                <Text style={styles.statCaption}>Paused</Text>
              </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Search size={18} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or email..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearchText}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Filter Pills */}
            <View style={styles.filterPillsRow}>
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  filterRole === 'all' && styles.filterPillActive,
                ]}
                onPress={() => setFilterRole('all')}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    filterRole === 'all' && styles.filterPillTextActive,
                  ]}
                >
                  All ({users.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterPill,
                  filterRole === 'admin' && styles.filterPillActive,
                ]}
                onPress={() => setFilterRole('admin')}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    filterRole === 'admin' && styles.filterPillTextActive,
                  ]}
                >
                  Admins ({summary.adminUsers})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterPill,
                  filterRole === 'user' && styles.filterPillActive,
                ]}
                onPress={() => setFilterRole('user')}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    filterRole === 'user' && styles.filterPillTextActive,
                  ]}
                >
                  Regular ({summary.regularUsers})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.filterPill,
                  filterRole === 'paused' && styles.filterPillActive,
                ]}
                onPress={() => setFilterRole('paused')}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    filterRole === 'paused' && styles.filterPillTextActive,
                  ]}
                >
                  Paused ({summary.pausedUsers})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Users List */}
            {loading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#059669" />
                <Text style={styles.loadingText}>Loading user database...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredUsers}
                keyExtractor={(item) => item._id}
                renderItem={renderUserCard}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={['#059669']}
                  />
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <AlertTriangle size={40} color="#cbd5e1" />
                    <Text style={styles.emptyTitle}>No Users Found</Text>
                    <Text style={styles.emptySubtitle}>
                      {searchQuery
                        ? `No users matching "${searchQuery}"`
                        : 'No users found matching current filter.'}
                    </Text>
                  </View>
                }
              />
            )}
          </>
        )}

        {/* Live Policy Preview Modal */}
        <PolicyModal
          visible={showPolicyPreview}
          onClose={() => setShowPolicyPreview(false)}
          policy={{
            title: policyTitle,
            content: policyContent,
            requireAcceptance: policyRequireAcceptance,
            lastUpdated: policyLastUpdated,
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    backgroundColor: 'rgba(5, 150, 105, 0.06)',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
  },
  refreshIconBtn: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  spinIcon: {
    opacity: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  statCardTotal: {
    borderBottomWidth: 3,
    borderBottomColor: '#059669',
  },
  statCardAdmin: {
    borderBottomWidth: 3,
    borderBottomColor: '#0284c7',
  },
  statCardActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#16a34a',
  },
  statCardPaused: {
    borderBottomWidth: 3,
    borderBottomColor: '#dc2626',
  },
  statIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
  },
  statCaption: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    padding: 0,
  },
  clearSearchText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterPillActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  filterPillTextActive: {
    color: '#fff',
  },
  listContent: {
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  userCardPaused: {
    backgroundColor: '#fff9f9',
    borderColor: '#fee2e2',
  },
  userCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
  },
  userInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    flexShrink: 1,
  },
  selfBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  selfBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  userEmail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  adminBadge: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  normalUserBadge: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  activeBadge: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  pausedBadge: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  joinDateText: {
    fontSize: 10,
    color: '#94a3b8',
    marginLeft: 'auto',
  },
  actionDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
    borderWidth: 1,
  },
  roleBtn: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
  },
  pauseBtn: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  resumeBtn: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  deleteBtn: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  disabledBtn: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    opacity: 0.5,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  actionLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  actionLoadingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#475569',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  deniedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
    backgroundColor: '#f8fafc',
  },
  deniedTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
  },
  deniedSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  sectionTabs: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 14,
    padding: 3,
    marginBottom: 16,
  },
  sectionTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  sectionTabActive: {
    backgroundColor: '#059669',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  sectionTabText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
  },
  sectionTabTextActive: {
    color: '#ffffff',
  },
  policyEditorScroll: {
    flex: 1,
  },
  policyEditorContent: {
    paddingBottom: 60,
  },
  policyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 16,
    padding: 14,
    gap: 10,
    marginBottom: 16,
  },
  policyBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#065f46',
    lineHeight: 18,
    fontWeight: '600',
  },
  policyFieldGroup: {
    marginBottom: 16,
  },
  policyFieldLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 6,
  },
  policyTitleInput: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  policyToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    gap: 12,
    marginBottom: 16,
  },
  policyCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  policyCheckboxChecked: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  policyToggleTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  policyToggleSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 15,
  },
  policyContentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  resetTemplateBtn: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ef4444',
  },
  policyContentInput: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    fontSize: 13,
    color: '#1e293b',
    lineHeight: 20,
    minHeight: 220,
  },
  policyMetaText: {
    fontSize: 11,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  policyActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  policyPreviewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 6,
  },
  policyPreviewBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284c7',
  },
  policySaveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 6,
    elevation: 3,
    shadowColor: '#059669',
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  policySaveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});
