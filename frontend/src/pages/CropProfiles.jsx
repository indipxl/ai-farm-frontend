import { useState } from "react";
import { useCrops } from "../useCrops";
import { useBatches } from "../useBatches";
import { useSensors } from "../useSensors";
import EditCropModal from "../components/EditCropModal";
import DeleteCropModal from "../components/DeleteCropModal";

export default function CropProfilesPage() {
  const { crops: CROP_PROFILES = [], createCrop, updateCrop, deleteCrop, refetch } = useCrops();
  const { batches = [] } = useBatches();
  const { sensors = [] } = useSensors();
  console.log(sensors, "sensors")
  const [selected, setSelected] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingCrop, setEditingCrop] = useState(null);
  const [deletingCrop, setDeletingCrop] = useState(null);
  const [formData, setFormData] = useState({ name: "", alert: "", notes: "", batch_id: "", sensor_data_id: "" });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  const totalPages = Math.ceil(CROP_PROFILES.length / itemsPerPage);
  const displayedCrops = CROP_PROFILES.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const profile = selected ? CROP_PROFILES.find(p => p.id === selected) : null;

  const handleOpenCreateModal = () => {
    const latestSensorId = sensors.length > 0 ? sensors[0].id : "";
    setFormData({
      name: "",
      alert: "",
      notes: "",
      batch_id: "",
      sensor_data_id: latestSensorId
    });
    setIsCreating(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await createCrop(formData);
    setIsCreating(false);
    setFormData({ name: "", alert: "", notes: "", batch_id: "", sensor_data_id: "" });
    refetch();
  };

  const handleUpdate = async (id, updatedData) => {
    await updateCrop(id, updatedData);
    refetch();
  };

  const handleDelete = async (id) => {
    await deleteCrop(id);
    refetch();
  };

  const isValid = formData.name.trim() && formData.batch_id.trim();

  return (
    <>
      <div className="fs-page-header">
        <div>
          <div className="fs-page-eyebrow">Custom Crop Configuration</div>
          <h1 className="fs-page-title">Crop <em>Profiles</em></h1>
          <p className="fs-page-sub">Manage your crop lifecycle and alert thresholds</p>
        </div>
      </div>

      <div className="fs-stat-strip">
        <div className="fs-stat-card fs-stat-card--gold"><div className="fs-stat-card__label">Active Profiles</div><div className="fs-stat-card__val">{CROP_PROFILES.length}</div><div className="fs-stat-card__meta">Custom Profile</div><span className="fs-stat-tag fs-stat-tag--good">All active</span></div>
        <div className="fs-stat-card fs-stat-card--green"><div className="fs-stat-card__label">Batches Covered</div><div className="fs-stat-card__val">{(batches || []).length}</div><div className="fs-stat-card__meta">All batches assigned</div><span className="fs-stat-tag fs-stat-tag--good">Complete</span></div>
        <div className="fs-stat-card fs-stat-card--amber"><div className="fs-stat-card__label">Custom Alerts</div><div className="fs-stat-card__val fs-stat-card__val--warn">0</div><div className="fs-stat-card__meta">Profile-based triggers</div><span className="fs-stat-tag fs-stat-tag--warn">Active</span></div>
        <div className="fs-stat-card fs-stat-card--purple"><div className="fs-stat-card__label">AI Optimisations</div><div className="fs-stat-card__val">0</div><div className="fs-stat-card__meta">Suggested adjustments</div><span className="fs-stat-tag fs-stat-tag--good">Review</span></div>
      </div>

      <div className="fs-grid-2" style={{ alignItems: "start" }}>
        <div>
          <div className="fs-section-row">
            <div className="fs-section-label">My Crop Profile</div>
            <button className="fs-btn fs-btn--gold fs-btn--sm" onClick={handleOpenCreateModal}>+ New Crop</button>
          </div>

          <div className="fs-profile-grid" style={{ gridTemplateColumns: "1fr" }}>
            {displayedCrops.map((p, i) => (
              <div
                key={p.id}
                className="fs-profile-card"
                style={{ animationDelay: `${0.05 + i * 0.07}s`, outline: selected === p.id ? "2px solid var(--gold)" : "none", outlineOffset: 2, cursor: "pointer" }}
                onClick={() => setSelected(selected === p.id ? null : p.id)}
              >
                <div className="fs-profile-card__top">
                  <div>
                    <div className="fs-profile-card__name">{p.name}</div>
                  </div>
                  <span className="fs-pill fs-pill--healthy" style={{ marginLeft: "auto" }}>{p.status}</span>
                </div>
                <div className="fs-profile-card__body">
                  <div className="fs-recipe-params">
                    <div>
                      <div className="fs-recipe-param__row">
                        <span className="fs-recipe-param__name">Soil Moisture</span>
                        <span className="fs-recipe-param__val">{p.sensor_data?.soil?.moisture ?? 0}%</span>
                      </div>
                      <div className="fs-recipe-param__bar"></div>
                    </div>
                    <div>
                      <div className="fs-recipe-param__row">
                        <span className="fs-recipe-param__name">Temperature</span>
                        <span className="fs-recipe-param__val">{p.sensor_data?.air?.temp ?? 0}°C</span>
                      </div>
                      <div className="fs-recipe-param__bar"></div>
                    </div>
                    <div>
                      <div className="fs-recipe-param__row">
                        <span className="fs-recipe-param__name">Humidity</span>
                        <span className="fs-recipe-param__val">{p.sensor_data?.air?.hum ?? 0}%</span>
                      </div>
                      <div className="fs-recipe-param__bar"></div>
                    </div>
                    <div>
                      <div className="fs-recipe-param__row">
                        <span className="fs-recipe-param__name">Soil PH</span>
                        <span className="fs-recipe-param__val">{p.sensor_data?.soil?.ph ?? 0}</span>
                      </div>
                      <div className="fs-recipe-param__bar"></div>
                    </div>
                  </div>
                </div>
                <div className="fs-profile-card__footer">
                  <div className="fs-profile-card__assigned">Assigned to <strong>{p.batch_id || 'Unassigned'}</strong> | Sensor ID: <strong>{p.sensor_data_id || ''}</strong></div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button className="fs-btn fs-btn--ghost fs-btn--sm" onClick={e => { e.stopPropagation(); setEditingCrop(p); }}>Edit</button>
                    <button className="fs-btn fs-btn--ghost fs-btn--sm" style={{ color: "var(--red)" }} onClick={e => { e.stopPropagation(); setDeletingCrop(p); }}>Delete</button>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px" }}>
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="fs-btn fs-btn--ghost fs-btn--sm">Prev</button>
                <span style={{ fontSize: "0.8rem", alignSelf: "center" }}>Page {currentPage} of {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="fs-btn fs-btn--ghost fs-btn--sm">Next</button>
              </div>
            )}

            <div className="fs-profile-card fs-profile-card--add" onClick={handleOpenCreateModal}>
              <span style={{ fontSize: "1.8rem" }}>+</span>
              <span>Create New Crop Profile</span>
            </div>
          </div>
        </div>

        <div>
          {profile ? (
            <div className="fs-recipe-editor">
              <div className="fs-recipe-editor__title">{profile.emoji} {profile.name}</div>
              <div className="fs-recipe-editor__sub">Adjust target ranges — AI alerts trigger when readings fall outside these bounds</div>
              <div className="fs-recipe-editor__grid">
                <div className="fs-range-row">
                  <label>Soil Moisture (%) <span>{profile.sensor_data?.soil?.moisture ?? 0}%</span></label>
                  <input type="range" value={profile.sensor_data?.soil?.moisture ?? 0} />
                </div>
                <div className="fs-range-row">
                  <label>Temperature (°C) <span>{profile.sensor_data?.air?.temp ?? 0}°C</span></label>
                  <input type="range" value={profile.sensor_data?.air?.temp ?? 0} />
                </div>
                <div className="fs-range-row">
                  <label>Humidity (%) <span>{profile.sensor_data?.air?.hum ?? 0}%</span></label>
                  <input type="range" value={profile.sensor_data?.air?.hum ?? 0} />
                </div>
                <div className="fs-range-row">
                  <label>Soil pH <span>{profile.sensor_data?.soil?.ph ?? 0}</span></label>
                  <input type="range" value={profile.sensor_data?.soil?.ph ?? 0} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.62rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>Alert Condition</div>
                <div style={{ background: "var(--cream2)", borderRadius: 8, padding: "10px 12px", fontSize: "0.77rem", color: "var(--dark)", border: "1px solid var(--border)", textAlign: 'left' }}>{profile.alert}</div>

              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.62rem", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>Farmer Notes / Custom Recipe</div>
                <textarea className="fs-textarea" rows={3} defaultValue={profile.notes} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button className="fs-btn fs-btn--gold" style={{ flex: 1, justifyContent: "center" }}>Edit Profile</button>
                <button className="fs-btn fs-btn--ghost" onClick={() => setSelected(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="fs-card">
              <div className="fs-card__body" style={{ textAlign: "center", padding: "48px 24px" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🌱</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "1.1rem", marginBottom: 6 }}>Select a profile to edit</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", lineHeight: 1.6 }}>Click any crop profile on the left to open the recipe editor and customise your target thresholds and alert conditions.</div>
              </div>
            </div>
          )}

          {profile && (
            <div className="fs-card" style={{ marginTop: 18 }}>
              <div className="fs-card__header">
                <div>
                  <div className="fs-card__title">AI Profile Suggestions</div>
                  <div className="fs-card__sub">Based on your current readings &amp; crop type</div>
                </div>
              </div>
              <div className="fs-card__body">
                <div className="fs-suggestion" style={{ marginBottom: 10 }}>
                  <div className="fs-suggestion__label">Optimisation</div>
                  Your moisture threshold (current: {profile.sensor_data?.soil?.moisture ?? 0}%) is slightly high for {profile.name}. Research suggests {profile.params?.[0]?.min ?? 0}–{profile.params?.[0]?.max ?? 0}% reduces fungal risk without stress.
                </div>
                <div className="fs-suggestion">
                  <div className="fs-suggestion__label">Seasonal Adjustment</div>
                  March–April is peak humidity season in Kota Kinabalu. Consider lowering your humidity alert threshold to 70% to get earlier warnings before fungal conditions develop.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* <div>
          <div className="fs-card">
            <div className="fs-card__body" style={{ textAlign: "center", padding: "48px 24px" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>🌱</div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: "1.1rem", marginBottom: 6 }}>Welcome to Crop Manager</div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-dim)", lineHeight: 1.6 }}>Quickly manage your crop profiles, sensor assignments, and alert thresholds from this dashboard.</div>
            </div>
          </div>
        </div> */}



      {/* Modals */}
      {isCreating && (
        <div className="fs-modal-overlay">
          <div className="fs-modal">
            <div style={{ padding: '24px', textAlign: 'center' }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '1.4rem' }}>New Crop Profile</h2>
            </div>
            <form onSubmit={handleCreate} style={{ padding: '0 24px 24px' }}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Crop Name</label>
                  <input type="text" className="fs-search-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Batch Assignment</label>
                  <select className="fs-search-input" value={formData.batch_id} onChange={e => setFormData({ ...formData, batch_id: e.target.value })} required>
                    <option value="">Select a Batch</option>
                    {batches.map(b => (
                      <option key={b.id} value={b.id}>{b.crop} ({b.id})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Sensor ID</label>
                  <select className="fs-search-input" value={formData.sensor_data_id} onChange={e => setFormData({ ...formData, sensor_data_id: e.target.value })} required>
                    <option value="">Select a Sensor</option>
                    {sensors.map(s => (
                      <option key={s.id} value={s.id}>{s.id} ({s.readable_time})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Alert Condition</label>
                  <input type="text" className="fs-search-input" value={formData.alert} onChange={e => setFormData({ ...formData, alert: e.target.value })} placeholder="e.g. Moisture < 50%" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '6px' }}>Farmer Notes</label>
                  <textarea rows="3" className="fs-search-input" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "right" }}>
                  <button type="button" className="fs-btn fs-btn--ghost" onClick={() => setIsCreating(false)}>Cancel</button>
                  <button type="submit" className="fs-btn fs-btn--gold" style={{
                    padding: '10px 20px', background: 'var(--gold)', color: 'var(--charcoal)',
                    opacity: (!isValid) ? 0.6 : 1,
                    cursor: (!isValid) ? 'not-allowed' : 'pointer'
                  }} disabled={!isValid}>Create Profile</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingCrop && (
        <EditCropModal
          crop={editingCrop}
          batches={batches}
          sensors={sensors}
          onClose={() => setEditingCrop(null)}
          onSubmit={handleUpdate}
        />
      )}

      {deletingCrop && (
        <DeleteCropModal
          crop={deletingCrop}
          onClose={() => setDeletingCrop(null)}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}