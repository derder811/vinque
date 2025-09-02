import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../../../Compo/Header/Header';
import Sidebar from '../../../Compo/Sidebar/Sidebar';
import styles from './SellerOrderManagement.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

export default function SellerOrderManagement() {
  const { id: sellerId } = useParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [updating, setUpdating] = useState(false);

  const statusOptions = ['All', 'Pending', 'Complete'];

  useEffect(() => {
    fetchOrders();
  }, [sellerId]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3000/api/seller-orders/${sellerId}`);
      const result = await response.json();
      
      if (result.status === 'success') {
        setOrders(result.orders);
      } else {
        setError(result.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdating(true);
      const response = await fetch(`http://localhost:3000/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          sellerId: sellerId
        })
      });

      const result = await response.json();
      
      if (result.status === 'success') {
        // Update the local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.order_id === orderId 
              ? { ...order, status: newStatus }
              : order
          )
        );
        
        // Close modal if open
        if (showModal) {
          setShowModal(false);
          setSelectedOrder(null);
        }
        
        alert('Order status updated successfully!');
      } else {
        alert(result.message || 'Failed to update order status');
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const filteredOrders = orders.filter(order => 
    statusFilter === 'All' || order.status === statusFilter
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price) => {
    return `₱${parseFloat(price).toLocaleString()}`;
  };

  if (loading) {
    return (
      <>
        <Header showSearchBar={false} showItems={false} isSeller={true} />
        <div className={styles.container}>
          <Sidebar />
          <main className={styles.content}>
            <div className="container-fluid py-3 text-center">Loading orders...</div>
          </main>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header showSearchBar={false} showItems={false} isSeller={true} />
        <div className={styles.container}>
          <Sidebar />
          <main className={styles.content}>
            <div className="container-fluid py-3 text-center text-danger">{error}</div>
          </main>
        </div>
      </>
    );
  }

  return (
    <>
      <Header showSearchBar={false} showItems={false} isSeller={true} />
      <div className={styles.container}>
        <Sidebar />
        <main className={styles.content}>
          <div className="container-fluid py-3">
            <h2 className="text-center mb-4">Order Management</h2>
            <p className="text-muted text-center mb-4">Manage your customer orders and update their status</p>

            {/* Status Filter */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card">
                  <div className="card-body">
                    <h5 className="card-title">Filter by Status</h5>
                    <div className="btn-group" role="group">
                      {statusOptions.map(status => (
                        <button
                          key={status}
                          type="button"
                          className={`btn ${
                            statusFilter === status ? 'btn-primary' : 'btn-outline-primary'
                          }`}
                          onClick={() => setStatusFilter(status)}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Orders Summary */}
            <div className="row mb-4">
              <div className="col-md-4">
                <div className="card text-center">
                  <div className="card-body">
                    <h5 className="card-title text-primary">
                      <i className="bi bi-list-check me-2"></i>Total Orders
                    </h5>
                    <p className="fs-3 fw-bold">{orders.length}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card text-center">
                  <div className="card-body">
                    <h5 className="card-title text-warning">
                      <i className="bi bi-clock me-2"></i>Pending Orders
                    </h5>
                    <p className="fs-3 fw-bold">{orders.filter(o => o.status === 'Pending').length}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card text-center">
                  <div className="card-body">
                    <h5 className="card-title text-success">
                      <i className="bi bi-check-circle me-2"></i>Completed Orders
                    </h5>
                    <p className="fs-3 fw-bold">{orders.filter(o => o.status === 'Complete').length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="row">
              <div className="col-12">
                <div className="card">
                  <div className="card-header">
                    <h5 className="mb-0">Orders ({filteredOrders.length})</h5>
                  </div>
                  <div className="card-body">
                    {filteredOrders.length === 0 ? (
                      <div className="text-center py-4">
                        <i className="bi bi-inbox display-1 text-muted"></i>
                        <p className="text-muted mt-3">No orders found for the selected filter.</p>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead className="table-dark">
                            <tr>
                              <th>Order ID</th>
                              <th>Product</th>
                              <th>Customer</th>
                              <th>Price</th>
                              <th>Status</th>
                              <th>Order Date</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredOrders.map(order => (
                              <tr key={order.order_id}>
                                <td>#{order.order_id}</td>
                                <td>
                                  <div className="d-flex align-items-center">
                                    {order.image_path && (
                                      <img
                                        src={order.image_path}
                                        alt={order.product_name}
                                        className="me-2"
                                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
                                      />
                                    )}
                                    <span>{order.product_name}</span>
                                  </div>
                                </td>
                                <td>
                                  {order.payer_name || `${order.customer.first_name} ${order.customer.last_name}`.trim() || 'N/A'}
                                </td>
                                <td>{formatPrice(order.price)}</td>
                                <td>
                                  <span className={`badge ${
                                    order.status === 'Pending' ? 'bg-warning' : 'bg-success'
                                  }`}>
                                    {order.status}
                                  </span>
                                </td>
                                <td>{formatDate(order.order_date)}</td>
                                <td>
                                  <div className="btn-group btn-group-sm">
                                    <button
                                      className="btn btn-outline-primary"
                                      onClick={() => handleViewDetails(order)}
                                    >
                                      <i className="bi bi-eye"></i>
                                    </button>
                                    {order.status === 'Pending' && (
                                      <button
                                        className="btn btn-outline-success"
                                        onClick={() => handleStatusUpdate(order.order_id, 'Complete')}
                                        disabled={updating}
                                      >
                                        <i className="bi bi-check"></i>
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Order Details - #{selectedOrder.order_id}</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6>Product Information</h6>
                    <div className="mb-3">
                      {selectedOrder.image_path && (
                        <img
                          src={selectedOrder.image_path}
                          alt={selectedOrder.product_name}
                          className="img-fluid mb-2"
                          style={{ maxHeight: '200px', objectFit: 'cover' }}
                        />
                      )}
                      <p><strong>Product:</strong> {selectedOrder.product_name}</p>
                      <p><strong>Price:</strong> {formatPrice(selectedOrder.price)}</p>
                      <p><strong>Down Payment:</strong> {formatPrice(selectedOrder.down_payment)}</p>
                      <p><strong>Remaining:</strong> {formatPrice(selectedOrder.remaining_payment)}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <h6>Customer Information</h6>
                    <p><strong>Name:</strong> {selectedOrder.payer_name || `${selectedOrder.customer.first_name} ${selectedOrder.customer.last_name}`.trim() || 'N/A'}</p>
                    <p><strong>Email:</strong> {selectedOrder.customer.email}</p>
                    <p><strong>Phone:</strong> {selectedOrder.customer.phone}</p>
                    <p><strong>Address:</strong> {selectedOrder.customer.address}</p>
                    
                    <h6 className="mt-3">Order Information</h6>
                    <p><strong>Order Date:</strong> {formatDate(selectedOrder.order_date)}</p>
                    <p><strong>PayPal Transaction:</strong> {selectedOrder.paypal_transaction_id}</p>
                    <p><strong>Payer Name:</strong> {selectedOrder.payer_name}</p>
                    <p><strong>Status:</strong> 
                      <span className={`badge ms-2 ${
                        selectedOrder.status === 'Pending' ? 'bg-warning' : 'bg-success'
                      }`}>
                        {selectedOrder.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                {selectedOrder.status === 'Pending' && (
                  <button
                    type="button"
                    className="btn btn-success"
                    onClick={() => handleStatusUpdate(selectedOrder.order_id, 'Complete')}
                    disabled={updating}
                  >
                    {updating ? 'Updating...' : 'Mark as Complete'}
                  </button>
                )}
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}