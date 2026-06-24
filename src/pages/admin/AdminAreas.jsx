import { useContext, useEffect, useMemo, useState } from 'react';
import { AdminTitleContext } from '../../components/AdminLayout';
import { AdminDialog, getAdminErrorMessage, useAdminDialog, useAdminToast } from '../../components/admin/AdminFeedback';
import {
    getAreas, createArea, updateArea, deleteArea,
    getAreaServices, addAreaService, updateAreaService, removeAreaService,
    getAreaSchedules, updateAreaSchedules,
    getAreaOverrides, upsertAreaOverride, deleteAreaOverride,
    getShippingFees, addShippingFee, updateShippingFee, deleteShippingFee,
} from '../../api/areas';
import { getAdminServiceList } from '../../api/admin';
import LocationPicker from '../../components/LocationPicker';
import '../../styles/AdminDashboard.css';

const emptyArea = { name: '', wardCode: '', districtCode: '', provinceCode: '', pickupLatitude: '', pickupLongitude: '', pickupAddress: '', pickupPhone: '', pickupInstructions: '', shortSlots: 10, longSlots: 3 };
const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

export default function AdminAreas() {
    const setPageTitle = useContext(AdminTitleContext);
    useEffect(() => { setPageTitle('Quản lý khu vực'); }, []);

    const [areas, setAreas] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [areaForm, setAreaForm] = useState(emptyArea);
    const [editingArea, setEditingArea] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [selectedArea, setSelectedArea] = useState(null);
    const [tab, setTab] = useState('services');

    const { showToast } = useAdminToast();
    const { dialog, confirmDialog, closeDialog } = useAdminDialog();

    const loadAreas = async () => {
        try { setAreas(await getAreas()); } catch (e) { showToast({ tone: 'error', title: 'Lỗi', message: getAdminErrorMessage(e, 'Không tải được khu vực.') });
        } finally { setLoading(false); }
    };
    useEffect(() => { loadAreas(); }, []);

    useEffect(() => {
        if (selectedArea) { setTab('services'); }
    }, [selectedArea]);

    const openCreate = () => { setEditingArea(null); setAreaForm(emptyArea); setShowForm(true); };
    const openEdit = (area) => {
        setEditingArea(area);
        setAreaForm({
            name: area.name || '',
            wardCode: area.wardCode || '',
            districtCode: area.districtCode || '',
            provinceCode: area.provinceCode || '',
            pickupLatitude: area.pickupLatitude ?? '',
            pickupLongitude: area.pickupLongitude ?? '',
            pickupAddress: area.pickupAddress || '',
            pickupPhone: area.pickupPhone || '',
            pickupInstructions: area.pickupInstructions || '',
            shortSlots: area.shortSlots ?? 10,
            longSlots: area.longSlots ?? 3,
        });
        setShowForm(true);
    };

    const handleSaveArea = async () => {
        const payload = {
            name: areaForm.name.trim(),
            wardCode: areaForm.wardCode || null,
            districtCode: areaForm.districtCode || null,
            provinceCode: areaForm.provinceCode || null,
            pickupLatitude: areaForm.pickupLatitude ? Number(areaForm.pickupLatitude) : null,
            pickupLongitude: areaForm.pickupLongitude ? Number(areaForm.pickupLongitude) : null,
            pickupAddress: areaForm.pickupAddress || null,
            pickupPhone: areaForm.pickupPhone || null,
            pickupInstructions: areaForm.pickupInstructions || null,
            shortSlots: Number(areaForm.shortSlots),
            longSlots: Number(areaForm.longSlots),
        };
        try {
            if (editingArea) {
                await updateArea(editingArea.id, payload);
                showToast({ tone: 'success', title: 'Đã cập nhật', message: `Khu vực "${payload.name}" đã được lưu.` });
            } else {
                await createArea(payload);
                showToast({ tone: 'success', title: 'Đã tạo', message: `Khu vực "${payload.name}" đã được tạo.` });
            }
            setShowForm(false);
            loadAreas();
        } catch (e) {
            showToast({ tone: 'error', title: 'Lỗi', message: getAdminErrorMessage(e, 'Không thể lưu khu vực.') });
        }
    };

    const handleDelete = async (area) => {
        const ok = await confirmDialog({ tone: 'danger', title: 'Xóa khu vực?', message: `Bạn có chắc muốn xóa "${area.name}"?`, confirmLabel: 'Xóa', cancelLabel: 'Hủy' });
        if (!ok) return;
        try {
            await deleteArea(area.id);
            showToast({ tone: 'success', title: 'Đã xóa', message: `Khu vực "${area.name}" đã được xóa.` });
            if (selectedArea?.id === area.id) setSelectedArea(null);
            loadAreas();
        } catch (e) {
            showToast({ tone: 'error', title: 'Lỗi', message: getAdminErrorMessage(e, 'Không thể xóa khu vực.') });
        }
    };

    return (
        <div className="admin-shell">
            <AdminDialog dialog={dialog} onResolve={closeDialog} />
            <div className="d-flex" style={{ gap: 24 }}>
                <div style={{ flex: selectedArea ? '0 0 380px' : 1, minWidth: 0 }}>
                    <div className="search-bar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Khu vực ({areas.length})</h2>
                        <button className="btn btn-primary" onClick={openCreate}>+ Khu vực mới</button>
                    </div>
                    {loading ? <div className="card" style={{ padding: 20, textAlign: 'center' }}>Đang tải...</div>
                        : areas.length === 0 ? <div className="card" style={{ padding: 20, textAlign: 'center', color: '#888' }}>Chưa có khu vực nào.</div>
                            : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {areas.map((a) => (
                                    <div key={a.id}
                                        onClick={() => setSelectedArea(a)}
                                        className="card"
                                        style={{
                                            padding: '14px 18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            border: selectedArea?.id === a.id ? '2px solid #f97316' : '1px solid #eee',
                                        }}>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 15 }}>{a.name}</div>
                                            {a.pickupAddress && <div style={{ fontSize: 12, color: '#888' }}>{a.pickupAddress}</div>}
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); openEdit(a); }}>Sửa</button>
                                            <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); handleDelete(a); }}>Xóa</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                    }
                </div>

                {selectedArea && (
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="card mb-0">
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{selectedArea.name}</h3>
                                    <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                                        Short slots: <strong>{selectedArea.shortSlots ?? 10}</strong> &nbsp;|&nbsp; Long slots: <strong>{selectedArea.longSlots ?? 3}</strong>
                                    </div>
                                </div>
                                <button className="btn btn-sm" onClick={() => setSelectedArea(null)}>Đóng</button>
                            </div>
                            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #eee' }}>
                                {['services', 'schedule', 'shipping'].map((t) => (
                                    <button key={t} onClick={() => setTab(t)}
                                        style={{
                                            flex: 1, padding: '12px', fontWeight: 700, fontSize: 13, cursor: 'pointer', border: 'none', background: tab === t ? '#fff7ed' : '#fafafa',
                                            color: tab === t ? '#f97316' : '#666', borderBottom: tab === t ? '2px solid #f97316' : '2px solid transparent',
                                        }}>
                                        {t === 'services' ? 'Cấu hình DV' : t === 'schedule' ? 'Lịch làm việc' : 'Phí ship'}
                                    </button>
                                ))}
                            </div>
                            {tab === 'services' && <AreaServicesTab areaId={selectedArea.id} services={services} setServices={setServices} showToast={showToast} />}
                            {tab === 'schedule' && <AreaScheduleTab areaId={selectedArea.id} showToast={showToast} />}
                            {tab === 'shipping' && <AreaShippingTab areaId={selectedArea.id} showToast={showToast} />}
                        </div>
                    </div>
                )}
            </div>

            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)} style={overlayStyle}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 720, maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <div><div style={{ fontWeight: 700, fontSize: 18 }}>{editingArea ? 'Sửa khu vực' : 'Thêm khu vực mới'}</div></div>
                            <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer', color: '#999' }}>✕</button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Tên khu vực *</label>
                                <input type="text" required maxLength={255} value={areaForm.name} onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8 }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Phường/Xã</label>
                                    <input type="text" value={areaForm.wardCode} onChange={(e) => setAreaForm({ ...areaForm, wardCode: e.target.value })} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Quận/Huyện</label>
                                    <input type="text" value={areaForm.districtCode} onChange={(e) => setAreaForm({ ...areaForm, districtCode: e.target.value })} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Tỉnh/Thành phố</label>
                                    <input type="text" value={areaForm.provinceCode} onChange={(e) => setAreaForm({ ...areaForm, provinceCode: e.target.value })} style={inputStyle} />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Điểm đón thú cưng</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
                                    <div>
                                        <label style={{ fontSize: 12, color: '#888' }}>Số điện thoại</label>
                                        <input type="text" value={areaForm.pickupPhone} onChange={(e) => setAreaForm({ ...areaForm, pickupPhone: e.target.value })} style={inputStyle} />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 12, color: '#888' }}>Địa chỉ</label>
                                        <input type="text" value={areaForm.pickupAddress} onChange={(e) => setAreaForm({ ...areaForm, pickupAddress: e.target.value })} style={inputStyle} />
                                    </div>
                                </div>
                                <LocationPicker
                                    initialLat={areaForm.pickupLatitude ? Number(areaForm.pickupLatitude) : 10.8231}
                                    initialLng={areaForm.pickupLongitude ? Number(areaForm.pickupLongitude) : 106.6297}
                                    onLocationChange={(lat, lng) => setAreaForm({ ...areaForm, pickupLatitude: lat, pickupLongitude: lng })}
                                    height={300}
                                    showDistance={false}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Hướng dẫn điểm đón</label>
                                <textarea rows={3} value={areaForm.pickupInstructions} onChange={(e) => setAreaForm({ ...areaForm, pickupInstructions: e.target.value })}
                                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8 }} />
                            </div>
                            <div style={{ borderTop: '1px solid #eee', paddingTop: 16 }}>
                                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Cấu hình slot (tất cả dịch vụ trong khu vực dùng chung)</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Short slots</label>
                                        <input type="number" min={1} value={areaForm.shortSlots} onChange={(e) => setAreaForm({ ...areaForm, shortSlots: e.target.value })}
                                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8 }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Long slots</label>
                                        <input type="number" min={1} value={areaForm.longSlots} onChange={(e) => setAreaForm({ ...areaForm, longSlots: e.target.value })}
                                            style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8 }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <button className="btn" onClick={() => setShowForm(false)}>Hủy</button>
                            <button className="btn btn-primary" onClick={handleSaveArea} disabled={!areaForm.name.trim()}>
                                {editingArea ? 'Lưu thay đổi' : 'Tạo khu vực'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function AreaServicesTab({ areaId, showToast }) {
    const [configs, setConfigs] = useState([]);
    const [serviceOptions, setServiceOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ serviceId: '', active: true });
    const [showForm, setShowForm] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const [c, s] = await Promise.all([getAreaServices(areaId), getAdminServiceList()]);
            setConfigs(Array.isArray(c) ? c : []);
            setServiceOptions(Array.isArray(s) ? s : []);
        } catch (e) { showToast({ tone: 'error', title: 'Lỗi', message: getAdminErrorMessage(e, 'Không tải được dữ liệu.') });
        } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, [areaId]);

    const usedServiceIds = new Set(configs.map((c) => c.serviceId));

    const openAdd = () => {
        setEditId(null);
        setForm({ serviceId: '', active: true });
        setShowForm(true);
    };
    const openEdit = (c) => {
        setEditId(c.id);
        setForm({ serviceId: String(c.serviceId), active: c.active });
        setShowForm(true);
    };
    const handleSave = async () => {
        const payload = {
            serviceId: Number(form.serviceId),
            active: Boolean(form.active),
        };
        try {
            if (editId) {
                await updateAreaService(areaId, editId, payload);
                showToast({ tone: 'success', title: 'Đã cập nhật' });
            } else {
                await addAreaService(areaId, payload);
                showToast({ tone: 'success', title: 'Đã thêm' });
            }
            setShowForm(false);
            load();
        } catch (e) { showToast({ tone: 'error', title: 'Lỗi', message: getAdminErrorMessage(e, 'Không thể lưu.') }); }
    };
    const handleRemove = async (configId, name) => {
        try {
            await removeAreaService(areaId, configId);
            showToast({ tone: 'success', title: 'Đã xóa', message: `Đã xóa "${name}" khỏi khu vực.` });
            load();
        } catch (e) { showToast({ tone: 'error', title: 'Lỗi', message: getAdminErrorMessage(e, 'Không thể xóa.') }); }
    };

    if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>Đang tải...</div>;
    return (
        <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontWeight: 700 }}>Dịch vụ trong khu vực ({configs.length})</span>
                <button className="btn btn-sm btn-primary" onClick={openAdd}>+ Thêm dịch vụ</button>
            </div>
            {configs.length === 0 ? <div style={{ color: '#888', textAlign: 'center', padding: 20 }}>Chưa có dịch vụ nào.</div>
                : <table><thead><tr><th>Dịch vụ</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                    <tbody>{configs.map((c) => (
                        <tr key={c.id}>
                            <td style={{ fontWeight: 600 }}>{c.serviceName || `#${c.serviceId}`}</td>
                            <td><span className={`badge ${c.active ? 'badge-success' : 'badge-danger'}`}>{c.active ? 'Hoạt động' : 'Tắt'}</span></td>
                            <td><button className="btn btn-sm" onClick={() => openEdit(c)}>Sửa</button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleRemove(c.id, c.serviceName)}>Xóa</button></td>
                        </tr>
                    ))}</tbody></table>
            }
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)} style={overlayStyle}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 480 }}>
                        <div className="modal-header"><div style={{ fontWeight: 700, fontSize: 18 }}>{editId ? 'Sửa cấu hình' : 'Thêm dịch vụ'}</div>
                            <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer', color: '#999' }}>✕</button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Dịch vụ</label>
                                <select value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
                                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8 }} disabled={!!editId}>
                                    <option value="">-- Chọn --</option>
                                    {serviceOptions.filter((s) => editId || !usedServiceIds.has(s.id)).map((s) => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.bookingType || 'SHORT'})</option>
                                    ))}
                                </select>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                                <span style={{ fontSize: 14, fontWeight: 600 }}>Hoạt động</span>
                            </label>
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <button className="btn" onClick={() => setShowForm(false)}>Hủy</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={!form.serviceId}>{editId ? 'Lưu' : 'Thêm'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function AreaScheduleTab({ areaId, showToast }) {
    const [schedules, setSchedules] = useState([]);
    const [overrides, setOverrides] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showOverride, setShowOverride] = useState(false);
    const [overrideForm, setOverrideForm] = useState({ overrideDate: '', openTime: '08:00', closeTime: '17:00', closed: false, reason: '' });

    const load = async () => {
        setLoading(true);
        try {
            const [s, o] = await Promise.all([
                getAreaSchedules(areaId),
                getAreaOverrides(areaId, new Date().toISOString().split('T')[0], new Date(Date.now() + 60 * 24 * 60 * 60000).toISOString().split('T')[0])
            ]);
            const full = days.map((_, i) => {
                const existing = Array.isArray(s) ? s.find((sc) => sc.dayOfWeek === i) : null;
                return existing || { dayOfWeek: i, openTime: '08:00', closeTime: '17:00', active: false };
            });
            setSchedules(full);
            setOverrides(Array.isArray(o) ? o : []);
        } catch (e) { showToast({ tone: 'error', title: 'Lỗi', message: getAdminErrorMessage(e, 'Không tải được lịch.') });
        } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, [areaId]);

    const toggleDay = (dow) => {
        setSchedules(schedules.map((s) => s.dayOfWeek === dow ? { ...s, active: !s.active } : s));
    };
    const updateTime = (dow, field, val) => {
        setSchedules(schedules.map((s) => s.dayOfWeek === dow ? { ...s, [field]: val } : s));
    };
    const saveSchedule = async () => {
        const payload = schedules.filter((s) => s.active).map((s) => ({
            dayOfWeek: s.dayOfWeek, openTime: s.openTime, closeTime: s.closeTime, active: true,
        }));
        try {
            await updateAreaSchedules(areaId, payload);
            showToast({ tone: 'success', title: 'Đã lưu lịch làm việc' });
        } catch (e) { showToast({ tone: 'error', title: 'Lỗi', message: getAdminErrorMessage(e, 'Không thể lưu lịch.') }); }
    };
    const handleSaveOverride = async () => {
        if (!overrideForm.overrideDate) return;
        try {
            await upsertAreaOverride(areaId, {
                overrideDate: overrideForm.overrideDate,
                openTime: overrideForm.closed ? null : overrideForm.openTime + ':00',
                closeTime: overrideForm.closed ? null : overrideForm.closeTime + ':00',
                closed: overrideForm.closed,
                reason: overrideForm.reason || null,
            });
            showToast({ tone: 'success', title: 'Đã lưu override' });
            setShowOverride(false);
            load();
        } catch (e) { showToast({ tone: 'error', title: 'Lỗi', message: getAdminErrorMessage(e, 'Không thể lưu override.') }); }
    };
    const handleDeleteOverride = async (date) => {
        try { await deleteAreaOverride(areaId, date); showToast({ tone: 'success', title: 'Đã xóa override' }); load(); }
        catch (e) { showToast({ tone: 'error', title: 'Lỗi', message: getAdminErrorMessage(e, 'Không thể xóa override.') }); }
    };

    if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>Đang tải...</div>;

    return (
        <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontWeight: 700 }}>Lịch làm việc mặc định</span>
                <button className="btn btn-sm btn-primary" onClick={saveSchedule}>Lưu lịch</button>
            </div>
            <table><thead><tr><th>Thứ</th><th>Hoạt động</th><th>Giờ mở</th><th>Giờ đóng</th></tr></thead>
                <tbody>{schedules.map((s) => (
                    <tr key={s.dayOfWeek}>
                        <td style={{ fontWeight: 600 }}>{days[s.dayOfWeek]}</td>
                        <td><input type="checkbox" checked={s.active} onChange={() => toggleDay(s.dayOfWeek)} /></td>
                        <td><input type="time" value={s.openTime} disabled={!s.active} onChange={(e) => updateTime(s.dayOfWeek, 'openTime', e.target.value)} style={{ padding: '6px 8px', border: '1px solid #ddd', borderRadius: 6 }} /></td>
                        <td><input type="time" value={s.closeTime} disabled={!s.active} onChange={(e) => updateTime(s.dayOfWeek, 'closeTime', e.target.value)} style={{ padding: '6px 8px', border: '1px solid #ddd', borderRadius: 6 }} /></td>
                    </tr>
                ))}</tbody></table>

            <div style={{ marginTop: 24, borderTop: '1px solid #eee', paddingTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontWeight: 700 }}>Override (ngày đặc biệt)</span>
                    <button className="btn btn-sm btn-primary" onClick={() => setShowOverride(true)}>+ Thêm</button>
                </div>
                {overrides.length === 0 ? <div style={{ color: '#888', fontSize: 13 }}>Chưa có override.</div>
                    : <table><thead><tr><th>Ngày</th><th>Giờ</th><th>Lý do</th><th>Thao tác</th></tr></thead>
                        <tbody>{overrides.map((o) => (
                            <tr key={o.id}>
                                <td>{o.overrideDate}</td>
                                <td>{o.closed ? 'Đóng cửa' : `${o.openTime} - ${o.closeTime}`}</td>
                                <td>{o.reason || '—'}</td>
                                <td><button className="btn btn-sm btn-danger" onClick={() => handleDeleteOverride(o.overrideDate)}>Xóa</button></td>
                            </tr>
                        ))}</tbody></table>
                }
            </div>

            {showOverride && (
                <div className="modal-overlay" onClick={() => setShowOverride(false)} style={overlayStyle}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 480 }}>
                        <div className="modal-header"><div style={{ fontWeight: 700, fontSize: 18 }}>Thêm override</div>
                            <button onClick={() => setShowOverride(false)} style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer', color: '#999' }}>✕</button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div><label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Ngày</label>
                                <input type="date" value={overrideForm.overrideDate} onChange={(e) => setOverrideForm({ ...overrideForm, overrideDate: e.target.value })} style={inputStyle} /></div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={overrideForm.closed} onChange={(e) => setOverrideForm({ ...overrideForm, closed: e.target.checked })} />
                                <span style={{ fontSize: 14, fontWeight: 600 }}>Đóng cửa</span></label>
                            {!overrideForm.closed && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div><label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Giờ mở</label>
                                    <input type="time" value={overrideForm.openTime} onChange={(e) => setOverrideForm({ ...overrideForm, openTime: e.target.value })} style={inputStyle} /></div>
                                <div><label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Giờ đóng</label>
                                    <input type="time" value={overrideForm.closeTime} onChange={(e) => setOverrideForm({ ...overrideForm, closeTime: e.target.value })} style={inputStyle} /></div>
                            </div>}
                            <div><label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Lý do</label>
                                <input type="text" value={overrideForm.reason} onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })} style={inputStyle} /></div>
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <button className="btn" onClick={() => setShowOverride(false)}>Hủy</button>
                            <button className="btn btn-primary" onClick={handleSaveOverride}>Lưu</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function AreaShippingTab({ areaId, showToast }) {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ fromKm: '', toKm: '', fee: '', active: true });
    const [editId, setEditId] = useState(null);
    const [showForm, setShowForm] = useState(false);

    const load = async () => {
        setLoading(true);
        try { setConfigs(Array.isArray(await getShippingFees(areaId)) ? await getShippingFees(areaId) : []); }
        catch (e) { showToast({ tone: 'error', title: 'Lỗi', message: getAdminErrorMessage(e, 'Không tải được phí ship.') });
        } finally { setLoading(false); }
    };
    useEffect(() => { load(); }, [areaId]);

    const openAdd = () => { setEditId(null); setForm({ fromKm: '', toKm: '', fee: '', active: true }); setShowForm(true); };
    const openEdit = (c) => { setEditId(c.id); setForm({ fromKm: String(c.fromKm), toKm: c.toKm ? String(c.toKm) : '', fee: String(c.fee), active: c.active }); setShowForm(true); };
    const handleSave = async () => {
        const payload = { fromKm: Number(form.fromKm), toKm: form.toKm ? Number(form.toKm) : null, fee: Number(form.fee), active: form.active };
        try {
            if (editId) { await updateShippingFee(areaId, editId, payload); showToast({ tone: 'success', title: 'Đã cập nhật' }); }
            else { await addShippingFee(areaId, payload); showToast({ tone: 'success', title: 'Đã thêm' }); }
            setShowForm(false); load();
        } catch (e) { showToast({ tone: 'error', title: 'Lỗi', message: getAdminErrorMessage(e, 'Không thể lưu.') }); }
    };
    const handleDelete = async (id) => {
        try { await deleteShippingFee(areaId, id); showToast({ tone: 'success', title: 'Đã xóa' }); load(); }
        catch (e) { showToast({ tone: 'error', title: 'Lỗi', message: getAdminErrorMessage(e, 'Không thể xóa.') }); }
    };

    if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>Đang tải...</div>;
    return (
        <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontWeight: 700 }}>Bảng giá vận chuyển</span>
                <button className="btn btn-sm btn-primary" onClick={openAdd}>+ Thêm mức</button>
            </div>
            {configs.length === 0 ? <div style={{ color: '#888', textAlign: 'center', padding: 20 }}>Chưa cấu hình phí ship.</div>
                : <table><thead><tr><th>Từ (km)</th><th>Đến (km)</th><th>Phí</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
                    <tbody>{configs.map((c) => (
                        <tr key={c.id}>
                            <td>{c.fromKm}</td><td>{c.toKm ?? '∞'}</td>
                            <td style={{ fontWeight: 700 }}>{Number(c.fee).toLocaleString('vi-VN')}đ</td>
                            <td><span className={`badge ${c.active ? 'badge-success' : 'badge-danger'}`}>{c.active ? 'Hoạt động' : 'Tắt'}</span></td>
                            <td><button className="btn btn-sm" onClick={() => openEdit(c)}>Sửa</button>
                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>Xóa</button></td>
                        </tr>
                    ))}</tbody></table>
            }
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)} style={overlayStyle}>
                    <div className="modal" onClick={(e) => e.stopPropagation()} style={{ width: 480 }}>
                        <div className="modal-header"><div style={{ fontWeight: 700, fontSize: 18 }}>{editId ? 'Sửa phí ship' : 'Thêm mức phí'}</div>
                            <button onClick={() => setShowForm(false)} style={{ border: 'none', background: 'none', fontSize: 24, cursor: 'pointer', color: '#999' }}>✕</button>
                        </div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div><label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Từ (km) *</label>
                                    <input type="number" min={0} step="0.1" value={form.fromKm} onChange={(e) => setForm({ ...form, fromKm: e.target.value })} style={inputStyle} /></div>
                                <div><label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Đến (km) — để trống = ∞</label>
                                    <input type="number" min={0} step="0.1" value={form.toKm} onChange={(e) => setForm({ ...form, toKm: e.target.value })} style={inputStyle} /></div>
                            </div>
                            <div><label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Phí (VND) *</label>
                                <input type="number" min={0} value={form.fee} onChange={(e) => setForm({ ...form, fee: e.target.value })} style={inputStyle} /></div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                                <span style={{ fontSize: 14, fontWeight: 600 }}>Hoạt động</span></label>
                        </div>
                        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                            <button className="btn" onClick={() => setShowForm(false)}>Hủy</button>
                            <button className="btn btn-primary" onClick={handleSave}>{editId ? 'Lưu' : 'Thêm'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const overlayStyle = {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};
const inputStyle = {
    width: '100%', padding: '10px 12px', border: '1px solid #ddd', borderRadius: 8,
};
