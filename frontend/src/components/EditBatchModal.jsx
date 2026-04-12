import { useState } from 'react';
import toast from 'react-hot-toast';

export default function EditBatchModal({ batch, onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        crop: batch?.crop || '',
        location: batch?.location || '',
        planted: batch?.planted?.split(' ')[0] || '',
        notes: batch?.notes || ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onSubmit(batch.id, formData);
            toast.success('Batch updated!');
            onClose();
        } catch {
            toast.error('Update failed.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!batch) return null;

    return (
        <div className="fs-modal-overlay" onClick={onClose}>
            <div className="fs-modal" onClick={e => e.stopPropagation()}>
                <div style={{ padding: '24px', textAlign: 'center' }}>
                    <h2 style={{ margin: '0 0 8px 0', fontSize: '1.4rem' }}>Edit {batch.id}</h2>
                </div>
                <form onSubmit={handleSubmit} style={{ padding: '0 24px 24px' }}>
                    <div style={{ display: 'grid', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Crop</label>
                            <input name="crop" value={formData.crop} onChange={handleChange} className="fs-search-input" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Location</label>
                            <input name="location" value={formData.location} onChange={handleChange} className="fs-search-input" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Planted</label>
                            <input type="date" name="planted" value={formData.planted} onChange={handleChange} className="fs-search-input" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Notes</label>
                            <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" className="fs-search-input" />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button type="button" onClick={onClose} style={{ padding: '10px 20px', border: '1px solid var(--border)', background: 'var(--cream2)' }}>
                            Cancel
                        </button>
                        <button type="submit" style={{ padding: '10px 20px', background: 'var(--gold)', color: 'var(--charcoal)' }} disabled={submitting}>
                            {submitting ? 'Saving...' : 'Update'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

