import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  FileOutput,
  MapPin,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';

import { useAuth } from '../../src/context/AuthContext';
import api from '@/src/api/axios';

interface ScanRecord {
  _id: string;
  coordinates: {
    lat: number;
    lng: number;
    regionName: string;
  };
  prediction: {
    riskLevel: string;
    accuracy: number;
    timestamp: string;
    modelId?: string;
  };
  userFeedback?: {
    isCorrect: boolean | null;
    notes?: string;
  };
  userId?: {
    fullName: string;
    email: string;
  };
}

export default function HistoryScreen() {
  const { user, token } = useAuth();
  const router = useRouter();

  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    const endpoint =
      user?.role === 'admin'
        ? 'admin/master-history'
        : 'scans/my-history';

    try {
      const response = await api.get(endpoint);

      const data = response.data;
      setScans(user?.role === 'admin' ? data.data : data);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
  };

  const renderScanItem = ({ item }: { item: ScanRecord }) => {
    const isHighRisk = item.prediction.riskLevel
      .toLowerCase()
      .includes('high');

    const hasFeedback = item.userFeedback?.isCorrect !== null;

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.regionContainer}>
            <MapPin size={14} color="#64748b" />
            <Text style={styles.regionText}>
              {item.coordinates.regionName}
            </Text>
          </View>

          <Text style={styles.dateText}>
            {new Date(item.prediction.timestamp).toLocaleDateString()}
          </Text>
        </View>

        {/* User Info (Admin only) */}
        {user?.role === 'admin' && (
          <View style={styles.userSection}>
            <Text style={styles.userName}>
              {item.userId?.fullName}
            </Text>
            <Text style={styles.userEmail}>
              {item.userId?.email}
            </Text>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View>
            <Text style={styles.statLabel}>RISK LEVEL</Text>
            <View
              style={[
                styles.badge,
                isHighRisk ? styles.badgeRed : styles.badgeGreen,
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  { color: isHighRisk ? '#ef4444' : '#10b981' },
                ]}
              >
                {item.prediction.riskLevel.toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.statLabel}>ACCURACY</Text>
            <Text style={styles.accuracyValue}>
              {(item.prediction.accuracy * 100).toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Feedback (Admin only) */}
        {user?.role === 'admin' && (
          <View style={styles.feedbackFooter}>
            {hasFeedback ? (
              <View style={styles.feedbackStatus}>
                {item.userFeedback?.isCorrect ? (
                  <CheckCircle2 size={14} color="#10b981" />
                ) : (
                  <XCircle size={14} color="#ef4444" />
                )}

                <Text
                  style={[
                    styles.feedbackText,
                    {
                      color: item.userFeedback?.isCorrect
                        ? '#10b981'
                        : '#ef4444',
                    },
                  ]}
                >
                  {item.userFeedback?.isCorrect
                    ? 'VALIDATED'
                    : 'FAULTY REPORT'}
                </Text>
              </View>
            ) : (
              <Text style={styles.unverified}>UNVERIFIED</Text>
            )}

            {item.userFeedback?.notes && (
              <Text style={styles.noteText}>
                "{item.userFeedback.notes}"
              </Text>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={styles.skewBackground} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <ArrowLeft size={20} color="#64748b" />
          <Text style={styles.backText}>BACK</Text>
        </TouchableOpacity>

        <View style={styles.titleRow}>
          <Text style={styles.title}>
            {user?.role === 'admin' ? 'Global Logs' : 'My History'}
          </Text>

          <View style={styles.countBadge}>
            <Text style={styles.countText}>{scans.length}</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <ActivityIndicator
          size="large"
          color="#059669"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={scans}
          renderItem={renderScanItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#059669']}
              tintColor="#059669"
            />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
              <FileOutput size={48} color="#cbd5e1" />
              <Text style={{ marginTop: 14, fontSize: 16, fontWeight: '700', color: '#64748b' }}>
                No Scan History
              </Text>
              <Text style={{ marginTop: 6, fontSize: 13, color: '#94a3b8', textAlign: 'center', paddingHorizontal: 32 }}>
                Pull down from the top to refresh, or run a new risk scan on the map to record fire predictions.
              </Text>
            </View>
          }
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  skewBackground: {
    position: 'absolute',
    top: 0,
    width: '100%',
    height: 300,
    backgroundColor: 'rgba(5, 150, 105, 0.05)',
    transform: [{ skewY: '-5deg' }],
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  backText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748b',
    letterSpacing: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0f172a',
  },
  countBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  countText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#059669',
  },
  listContent: {
    padding: 24,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  regionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  regionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  userSection: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  userEmail: {
    fontSize: 10,
    color: '#94a3b8',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 8,
    fontWeight: '900',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeRed: {
    backgroundColor: '#fef2f2',
    borderColor: '#fee2e2',
  },
  badgeGreen: {
    backgroundColor: '#ecfdf5',
    borderColor: '#d1fae5',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  accuracyValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#334155',
  },
  feedbackFooter: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  feedbackStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  feedbackText: {
    fontSize: 10,
    fontWeight: '900',
  },
  unverified: {
    fontSize: 9,
    fontWeight: '800',
    color: '#cbd5e1',
    fontStyle: 'italic',
  },
  noteText: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#059669',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
});
