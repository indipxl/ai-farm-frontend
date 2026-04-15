import { useState } from 'react';
import toast from 'react-hot-toast';

export default function DeleteBatchModal({ batchId, onClose, onDelete }) {
    const [confirming, setConfirming] = useState(false);

    const handleDelete = async () => {
        setConfirming(true);
        try {
            await onDelete(batchId);
            toast.success('Batch deleted!');
            onClose();
        } catch {
            toast.error('Delete failed.');
        } finally {
            setConfirming(false);
        }
    };

    if (!batchId) return null;

    return (
        <div className="fs-modal-overlay" onClick={onClose}>
            <div className="fs-modal" onClick={e => e.stopPropagation()}>
                <div style={{ padding: '32px 24px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px', color: 'var(--red)' }}>🗑️</div>
                    <h2 style={{ fontSize: '1.4rem' }}>Delete Batch</h2>
                    <p>Are you sure you want to remove this batch profile? This action cannot be undone.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', padding: '0 24px 24px' }}>
                    <button type="button" onClick={onClose} style={{ padding: '10px 20px', flex: 1, border: '1px solid var(--border)', background: 'var(--cream2)' }}>
                        Cancel
                    </button>
                    <button onClick={handleDelete} style={{ padding: '10px 20px', background: 'var(--red)', color: 'white', flex: 1 }} disabled={confirming}>
                        {confirming ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
}
