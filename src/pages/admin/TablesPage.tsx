import { useEffect, useState } from 'react';
import { Row, Col, Typography, Button, Space, Spin, Empty, message } from 'antd';
import { RefreshCw, Plus } from 'lucide-react';
import { api } from '../../services/api';
import type { Table, TableWithQR } from '../../types';
import TableCard from '../../components/admin/TableCard';
import AddTableModal from '../../components/admin/AddTableModal';
import QRModal from '../../components/admin/QRModal';
import styles from './TablesPage.module.css';

const { Title, Text } = Typography;

export function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState<TableWithQR | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const data = await api.tables.getAll();
      setTables(data.sort((a, b) => a.table_number - b.table_number));
    } catch (error) {
      console.error('Failed to fetch tables:', error);
      message.error('Failed to fetch tables');
    } finally {
      setLoading(false);
    }
  };

  const getNextTableNumber = () => {
    if (tables.length === 0) return 1;
    return Math.max(...tables.map(t => t.table_number)) + 1;
  };

  const handleCreateTable = async (tableNumber: number) => {
    setCreating(true);
    try {
      await api.tables.create({ table_number: tableNumber });
      setShowAddModal(false);
      message.success('Table created successfully');
      fetchTables();
    } catch (error) {
      console.error('Failed to create table:', error);
      message.error('Failed to create table. It may already exist.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTable = async (id: string) => {
    try {
      await api.tables.delete(id);
      message.success('Table deleted successfully');
      fetchTables();
    } catch (error) {
      console.error('Failed to delete table:', error);
      message.error('Failed to delete table');
    }
  };

  const handleViewQR = async (table: Table) => {
    try {
      const data = await api.tables.getWithQR(table.id);
      setShowQRModal(data);
    } catch (error) {
      console.error('Failed to fetch QR code:', error);
      message.error('Failed to fetch QR code');
    }
  };

  const downloadQR = (table: TableWithQR) => {
    const getQRDataUrl = (base64Data: string) => {
      if (base64Data.startsWith('data:')) return base64Data;
      return `data:image/png;base64,${base64Data}`;
    };

    const dataUrl = getQRDataUrl(table.qr_code_url);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `table-${table.table_number}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Row justify="space-between" align="middle" className={styles.header}>
        <Col xs={24} sm={16}>
          <Title level={2} className={styles.headerTitle}>Tables</Title>
          <Text className={styles.headerSubtitle}>Manage restaurant tables and QR codes</Text>
        </Col>
        <Col xs={24} sm={8} className={styles.actionButtons}>
          <Space>
            <Button
              icon={<RefreshCw size={18} />}
              onClick={fetchTables}
              size="large"
            />
            <Button
              type="primary"
              icon={<Plus size={18} />}
              onClick={() => setShowAddModal(true)}
              size="large"
              className={styles.primaryBtn}
            >
              Add Table
            </Button>
          </Space>
        </Col>
      </Row>

      {tables.length > 0 ? (
        <Row gutter={[16, 16]}>
          {tables.map(table => (
            <Col key={table.id} xs={12} sm={8} md={6} lg={4} xl={4}>
              <TableCard
                table={table}
                onViewQR={handleViewQR}
                onDelete={handleDeleteTable}
              />
            </Col>
          ))}
        </Row>
      ) : (
        <Empty
          description="No tables yet. Add your first table to get started."
          className={styles.emptyState}
        />
      )}

      <AddTableModal
        visible={showAddModal}
        loading={creating}
        onCancel={() => setShowAddModal(false)}
        onConfirm={handleCreateTable}
        suggestedTableNumber={getNextTableNumber()}
      />

      <QRModal
        visible={!!showQRModal}
        table={showQRModal}
        onClose={() => setShowQRModal(null)}
        onDownload={downloadQR}
      />
    </div>
  );
}
