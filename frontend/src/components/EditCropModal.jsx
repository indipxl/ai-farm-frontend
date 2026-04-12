import { useState } from 'react';
import toast from 'react-hot-toast';

export default function EditCropModal({ crop, batches, sensors, onClose, onSubmit }) {
    const [formData, setFormData] = useState({
        name: crop?.name || '',
        batch_id: crop?.batch_id || '',
        sensor_data_id: crop?.sensor_data_id || '',
        alert: crop?.alert || '',
        notes: crop?.notes || ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onSubmit(crop.id, formData);
            toast.success('Crop updated!');
            onClose();
        } catch {
            toast.error('Update failed.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!crop) return null;

    return (
        <div className="fs-modal-overlay" onClick={onClose}>
            <div className="fs-modal" onClick={e => e.stopPropagation()}>
                <div style={{ padding: '24px', textAlign: 'center' }}>
                    <h2 style={{ margin: '0 0 8px 0', fontSize: '1.4rem' }}>Edit {crop.name}</h2>
                </div>
                <form onSubmit={handleSubmit} style={{ padding: '0 24px 24px' }}>
                    <div style={{ display: 'grid', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Crop Name</label>
                            <input name="name" value={formData.name} onChange={handleChange} className="fs-search-input" required />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Batch Assignment</label>
                            <select name="batch_id" value={formData.batch_id} onChange={handleChange} className="fs-search-input" required>
                                <option value="">Select a Batch</option>
                                {batches.map(b => (
                                    <option key={b.id} value={b.id}>{b.crop} ({b.id})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Sensor ID</label>
                            <select name="sensor_data_id" value={formData.sensor_data_id} onChange={handleChange} className="fs-search-input" required>
                                <option value="">Select a Sensor</option>
                                {sensors.map(s => (
                                    <option key={s.id} value={s.id}>{s.id} ({s.readable_time})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Alert Condition</label>
                            <input name="alert" value={formData.alert} onChange={handleChange} className="fs-search-input" placeholder="e.g. Moisture < 50%" />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Farmer Notes</label>
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
