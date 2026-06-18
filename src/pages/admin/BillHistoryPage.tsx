import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { Bill, BillWithOrders } from '../../types';
import {
    History,
    Search,
    Download,
    Eye,
    X,
    RefreshCw,
    TrendingUp,
    CreditCard,
    Receipt,
    Trash2
} from 'lucide-react';
import {
    Table,
    Card,
    Statistic,
    Row,
    Col,
    Input,
    Button,
    Tag,
    Modal,
    Typography,
    Space,
    Tooltip,
    Empty,
    message
} from 'antd';
import { BillView } from '../../components/admin/BillView';
import styles from './BillHistoryPage.module.css';

const { Title, Text } = Typography;

const BillHistoryPage: React.FC = () => {
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchingDetails, setFetchingDetails] = useState(false);
    const [selectedBill, setSelectedBill] = useState<BillWithOrders | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchBills = async () => {
        setLoading(true);
        try {
            const data = await api.bills.getAll();
            setBills(data);
        } catch (error) {
            console.error('Failed to fetch bills:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBills();
    }, []);

    const handleViewDetails = async (billId: string) => {
        setFetchingDetails(true);
        try {
            const details = await api.bills.getDetails(billId);
            setSelectedBill(details);
            setShowModal(true);
        } catch (error) {
            console.error('Failed to fetch bill details:', error);
        } finally {
            setFetchingDetails(false);
        }
    };

    const handleDownloadPDF = async (billId: string) => {
        try {
            await api.bills.downloadPDF(billId);
        } catch (error) {
            console.error('Failed to download PDF:', error);
        }
    };

    const handleDeleteBill = async (billId: string) => {
        try {
            await api.bills.delete(billId);
            setBills(prev => prev.filter(b => b.id !== billId));
            message.success('Bill deleted successfully');
        } catch (error) {
            console.error('Failed to delete bill:', error);
            message.error('Failed to delete bill');
        }
    };

    const filteredBills = bills.filter(bill =>
        bill.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.session_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalRevenue = bills
        .filter(b => b.payments?.some(p => p.status === 'completed'))
        .reduce((sum, b) => sum + b.final_total, 0);

    const formatShortId = (id: string) => id.slice(0, 8).toUpperCase();

    const formatDate = (dateStr: string) => {
        const dStr = dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`;
        return new Date(dStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const columns = [
        {
            title: 'Bill ID',
            dataIndex: 'id',
            key: 'id',
            render: (id: string) => <Text code className={styles.billId}>{formatShortId(id)}</Text>,
        },
        {
            title: 'Table',
            dataIndex: 'table_number',
            key: 'table_number',
            render: (table_number: number) => <Text strong>{table_number ? `Table ${table_number}` : 'N/A'}</Text>,
        },
        {
            title: 'Date & Time',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => formatDate(date),
        },
        {
            title: 'Amount',
            dataIndex: 'final_total',
            key: 'final_total',
            render: (amount: number) => <Text strong>₹{amount.toFixed(2)}</Text>,
        },
        {
            title: 'Status',
            key: 'status',
            render: (_: any, record: Bill) => {
                const totalPaid = (record.payments || [])
                    .filter(p => p.status === 'completed')
                    .reduce((sum, p) => sum + p.amount, 0);
                const isPaid = totalPaid >= record.final_total;
                const hasPayments = (record.payments || []).length > 0;

                let statusText = 'UNPAID';
                let color: string = 'warning';

                if (isPaid) {
                    statusText = 'PAID';
                    color = 'success';
                } else if (hasPayments) {
                    statusText = 'PARTIAL';
                    color = 'processing';
                }

                return (
                    <Tag color={color} className={styles.statusTag}>
                        {statusText}
                    </Tag>
                );
            },
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: Bill) => (
                <Space size="middle">
                    <Tooltip title="View Details">
                        <Button
                            type="text"
                            icon={<Eye size={18} />}
                            onClick={() => handleViewDetails(record.id)}
                            loading={fetchingDetails && selectedBill?.id === record.id}
                        />
                    </Tooltip>
                    <Tooltip title="Download PDF">
                        <Button
                            type="text"
                            icon={<Download size={18} />}
                            onClick={() => handleDownloadPDF(record.id)}
                            className={styles.downloadBtn}
                        />
                    </Tooltip>
                    <Tooltip title="Delete Bill">
                        <Button
                            type="text"
                            danger
                            icon={<Trash2 size={18} />}
                            onClick={() => {
                                Modal.confirm({
                                    title: 'Delete Bill',
                                    content: 'Are you sure you want to delete this bill? This action cannot be undone.',
                                    okText: 'Delete',
                                    okButtonProps: { danger: true },
                                    onOk: () => handleDeleteBill(record.id),
                                });
                            }}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    return (
        <div className={styles.historyContainer}>
            <div className={styles.header}>
                <Space size="middle">
                    <div className={styles.iconWrapper}>
                        <History size={28} color="white" />
                    </div>
                    <Title level={2} style={{ margin: 0 }}>Bill History</Title>
                </Space>
                <Button
                    icon={<RefreshCw size={18} />}
                    onClick={fetchBills}
                    loading={loading}
                    type="text"
                    className={styles.refreshBtn}
                />
            </div>

            <Row gutter={[16, 16]} className={styles.statsGrid}>
                <Col xs={24} sm={8}>
                    <Card bordered={false} className={styles.statCard}>
                        <Statistic
                            title={<Text type="secondary">Total Bills</Text>}
                            value={bills.length}
                            prefix={<Receipt size={20} className={styles.statIcon} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} className={styles.statCard}>
                        <Statistic
                            title={<Text type="secondary">Total Revenue</Text>}
                            value={totalRevenue}
                            precision={2}
                            prefix={<TrendingUp size={20} className={styles.statIcon} />}
                            suffix="₹"
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} className={styles.statCard}>
                        <Statistic
                            title={<Text type="secondary">Paid Bills</Text>}
                            value={bills.filter(b => b.payments?.some(p => p.status === 'completed')).length}
                            prefix={<CreditCard size={20} className={styles.statIcon} />}
                        />
                    </Card>
                </Col>
            </Row>

            <div className={styles.searchBar}>
                <Input
                    placeholder="Search by Bill ID or Session ID..."
                    prefix={<Search size={18} />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="large"
                    allowClear
                    className={styles.searchInput}
                />
            </div>

            <Card bordered={false} className={styles.tableCard}>
                <Table
                    columns={columns}
                    dataSource={filteredBills}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: <Empty description="No bills found" /> }}
                    className={styles.antdTable}
                />
            </Card>

            <Modal
                open={showModal}
                onCancel={() => setShowModal(false)}
                footer={null}
                width={500}
                centered
                closable={false}
                className={styles.detailModal}
                bodyStyle={{ padding: 0, backgroundColor: 'transparent' }}
                destroyOnClose
            >
                {selectedBill && (
                    <div style={{ padding: '20px', background: 'var(--bg-primary)', borderRadius: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <Title level={4} style={{ margin: 0, color: 'var(--text-primary)' }}>Bill Details</Title>
                            <Space>
                                <Button
                                    type="primary"
                                    icon={<Download size={16} />}
                                    onClick={() => handleDownloadPDF(selectedBill.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        background: 'var(--brand-primary)',
                                        borderColor: 'var(--brand-primary)',
                                        color: '#ffffff',
                                    }}
                                >
                                    Download
                                </Button>
                                <Button
                                    type="text"
                                    icon={<X size={20} />}
                                    onClick={() => setShowModal(false)}
                                    style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                />
                            </Space>
                        </div>
                        <BillView
                            selectedSession={{
                                id: selectedBill.session_id || selectedBill.id,
                                table_id: '',
                                table_number: (selectedBill as any).session?.table?.table_number || (selectedBill as any).table_number || (selectedBill.orders && selectedBill.orders[0]?.table_number) || 0,
                                session_status: 'closed',
                                started_at: selectedBill.created_at,
                                orders: selectedBill.orders || []
                            } as any}
                            bill={selectedBill}
                            discount={selectedBill.discount_amount}
                            taxRate={0}
                            setDiscount={() => { }}
                            processing={false}
                            onGenerateBill={() => { }}
                            onPayment={() => { }}
                            onDownloadPDF={() => handleDownloadPDF(selectedBill.id)}
                            isMobile={false}
                            hideActions={true}
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default BillHistoryPage;
