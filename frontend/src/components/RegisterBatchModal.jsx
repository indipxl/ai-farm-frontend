import toast from 'react-hot-toast';

export default function RegisterBatchModal({ onClose, onSubmit, formData, setFormData, submitting }) {
    const handleSubmit = async (e) => {
        e.preventDefault();
        await onSubmit(formData);
        onClose();
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const isValid = formData.crop.trim() && formData.location.trim();

    return (
        <div className="fs-modal-overlay" onClick={onClose}>
            <div className="fs-modal" onClick={e => e.stopPropagation()}>
                <div style={{ padding: '24px', textAlign: 'center' }}>
                    <h2 style={{ margin: '0 0 8px 0', fontSize: '1.4rem' }}>Create Batch</h2>
                </div>
                <form onSubmit={handleSubmit} style={{ padding: '0 24px 24px' }}>
                    <div style={{ display: 'grid', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Crop Name *</label>
                            <input
                                className="fs-search-input"
                                name="crop"
                                placeholder="Tomatoes"
                                value={formData.crop}
                                onChange={handleChange}
                                disabled={submitting}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Location *</label>
                            <input
                                className="fs-search-input"
                                name="location"
                                placeholder="Block A1"
                                value={formData.location}
                                onChange={handleChange}
                                disabled={submitting}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Notes</label>
                            <textarea
                                rows="3" className="fs-search-input"
                                name="notes"
                                placeholder="Any additional notes..."
                                value={formData.notes}
                                onChange={handleChange}
                                disabled={submitting}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button
                            type="button"
                            style={{ padding: '10px 20px', border: '1px solid var(--border)', background: 'var(--cream2)' }}
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                padding: '10px 20px', background: 'var(--gold)', color: 'var(--charcoal)',
                                opacity: (!isValid || submitting) ? 0.6 : 1,
                                cursor: (!isValid || submitting) ? 'not-allowed' : 'pointer'
                            }}
                            disabled={!isValid || submitting}
                        >
                            {submitting ? 'Creating...' : 'Create Batch'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

