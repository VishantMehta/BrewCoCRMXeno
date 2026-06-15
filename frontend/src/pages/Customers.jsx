import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers(1);
  }, []);

  const fetchCustomers = async (page) => {
    setLoading(true);
    try {
      const res = await apiClient.getCustomers(page);
      setCustomers(res.data);
      setMeta(res.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
      <h1>Customers</h1>
      <p style={{ marginBottom: '2rem' }}>Browse your BrewCo customer database.</p>

      <div className="table-container glass">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>City</th>
              <th>Total Spend (₹)</th>
              <th>Orders</th>
              <th>Tags</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>Loading...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>No customers found.</td></tr>
            ) : (
              customers.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 500 }}>{c.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.email}</td>
                  <td>{c.city}</td>
                  <td>₹{c.total_spend.toLocaleString()}</td>
                  <td>{c.order_count}</td>
                  <td>
                    {c.tags && c.tags.split(',').map(tag => (
                      <span key={tag} className={`tag ${tag.trim() === 'VIP' ? 'vip' : ''}`} style={{ marginRight: '4px' }}>
                        {tag.trim()}
                      </span>
                    ))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination (Simplified) */}
      {meta && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            Showing {((meta.page - 1) * meta.limit) + 1} - {Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
          </span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn-secondary" 
              disabled={meta.page === 1}
              onClick={() => fetchCustomers(meta.page - 1)}
            >
              Previous
            </button>
            <button 
              className="btn-secondary" 
              disabled={meta.page === meta.totalPages}
              onClick={() => fetchCustomers(meta.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;
