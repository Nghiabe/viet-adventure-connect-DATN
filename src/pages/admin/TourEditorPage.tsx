import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { GalleryUploader } from '@/components/ui/gallery-uploader';

type DestinationOption = { _id: string; name: string; slug?: string };
type CurrentUser = { _id?: string; id?: string; gid?: string; name?: string; email?: string };

export default function TourEditorPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('general');

  const [destinationList, setDestinationList] = useState<DestinationOption[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [ownerLabel, setOwnerLabel] = useState<string>('');

  // doc shape: destinations array items: { id, note, name? }
  const [doc, setDoc] = useState<any>({
    title: '',
    slug: '',
    description: '',
    duration: '',
    price: 0,
    status: 'draft',
    inclusions: [],
    exclusions: [],
    itinerary: [],
    imageGallery: [],
    destinations: [{ id: '', note: '', name: '' }],
    destination: '', // legacy single
    owner: '',
    mainImage: undefined,
    maxGroupSize: 0,
  });

  // ------------------ fetch current user (auto-fill owner) ------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const endpoints = ['/api/admin/me', '/api/auth/me', '/api/me'];
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, { credentials: 'include' });
          if (!res.ok) continue;
          const j = await res.json();
          const u = j?.data || j?.user || j?.me || j;
          if (!u) continue;
          if (cancelled) return;
          const rawId = u?.gid || u?.id || u?._id || u?.userId || u?.uid || '';
          let gidVal = '';
          if (typeof rawId === 'string' && rawId.startsWith('gid_')) gidVal = rawId;
          else if (typeof rawId === 'string' && rawId.match(/^[0-9a-fA-F]{24}$/)) gidVal = rawId; // mongodb id
          else if (typeof rawId === 'number' || String(rawId).match(/^\d+$/)) gidVal = `gid_${rawId}`;
          else gidVal = rawId ? String(rawId) : '';
          setCurrentUser(u);
          setOwnerLabel(u?.name ? `${u.name} (${gidVal || 'unknown'})` : gidVal || (u?.email ? `${u.email}` : ''));
          setDoc((d: any) => ({ ...d, owner: gidVal }));
          return;
        } catch (e) {
          // try next endpoint
        }
      }
      setCurrentUser(null);
      setOwnerLabel('');
    })();
    return () => { cancelled = true; };
  }, []);

  // ------------------ ensure initial one empty destination row for UX ------------------
  useEffect(() => {
    if (!doc.destinations || doc.destinations.length === 0) {
      setDoc((d: any) => ({ ...d, destinations: [{ id: '', note: '', name: '' }] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------ fetch tour when editing ------------------
  useEffect(() => {
    if (!isNew) {
      fetch(`/api/admin/tours?search=${id}`, { credentials: 'include' })
        .then((r) => r.json())
        .then((j) => {
          const t = j?.data?.rows?.find((x: any) => String(x._id) === id) || null;
          if (t) {
            // Normalise: if backend sends destinations array with destinationId or populated objects,
            // map to UI-friendly array { id, note, name }.
            let uiDestinations: any[] = [];
            if (Array.isArray(t.destinations) && t.destinations.length > 0) {
              uiDestinations = t.destinations.map((x: any) => {
                // x might be { destinationId, orderIndex, note } or populated object { destination: {...} }
                const idVal = x.destinationId || x.destination?._id || x.id || x._id || (typeof x === 'string' ? x : '');
                const noteVal = x.note || (x.destination && x.destination.note) || '';
                const nameVal =
                  (x.destination && (x.destination.name || x.destination.title || x.destination.slug)) ||
                  x.name ||
                  x.title ||
                  '';
                return { id: idVal, note: noteVal, name: nameVal };
              });
            } else if (t.destination) {
              uiDestinations = [{ id: t.destination, note: '', name: '' }];
            } else {
              uiDestinations = [{ id: '', note: '', name: '' }];
            }

            // Ensure itinerary items have description (backend requires)
            const safeItinerary = Array.isArray(t.itinerary) ? t.itinerary.map((it: any, idx: number) => ({
              day: it.day ?? idx + 1,
              title: it.title ?? `Ngày ${it.day ?? idx + 1}`,
              description: (typeof it.description === 'string' && it.description.trim().length > 0) ? it.description : (it.title ?? `Ngày ${it.day ?? idx + 1}`),
              _id: it._id,
            })) : [];

            setDoc({
              ...t,
              destinations: uiDestinations,
              itinerary: safeItinerary,
              destination: t.destination || (uiDestinations[0]?.id || ''),
            });
          }
        })
        .catch((err) => console.error(err));
    }
  }, [id, isNew]);

  // ------------------ fetch master destinations list ------------------
  useEffect(() => {
    fetch('/api/admin/destinations?limit=500', { credentials: 'include' })
      .then((r) => r.json())
      .then((j) => {
        const rows = j?.data?.rows || j?.data || [];
        const opts = Array.isArray(rows) ? rows.map((r: any) => ({ _id: String(r._id || r.id), name: r.name || r.title || r.slug || `#${r._id}` })) : [];
        setDestinationList(opts);
      })
      .catch((err) => {
        console.warn('Could not fetch destinations', err);
        setDestinationList([]);
      });
  }, []);

  // ------------------ slug auto gen ------------------
  useEffect(() => {
    setDoc((d: any) => ({ ...d, slug: d.title ? String(d.title).toLowerCase().replace(/\s+/g, '-') : '' }));
  }, [doc.title]);

  // ------------------ destination helpers (UI) ------------------
  function addDestination() {
    setDoc((d: any) => ({ ...d, destinations: [...(d.destinations || []), { id: '', note: '', name: '' }] }));
  }
  function updateDestinationAt(index: number, payload: { id?: string; note?: string; name?: string }) {
    setDoc((d: any) => {
      const list = [...(d.destinations || [])];
      list[index] = { ...(list[index] || {}), ...payload };
      return { ...d, destinations: list };
    });
    setErrors(e => ({ ...e, destination: '' }));
  }
  function removeDestinationAt(index: number) {
    setDoc((d: any) => {
      const list = [...(d.destinations || [])];
      list.splice(index, 1);
      if (list.length === 0) list.push({ id: '', note: '', name: '' });
      return { ...d, destinations: list };
    });
  }
  function moveDestination(index: number, dir: 'up' | 'down') {
    setDoc((d: any) => {
      const list = [...(d.destinations || [])];
      const target = dir === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= list.length) return d;
      const tmp = list[target]; list[target] = list[index]; list[index] = tmp;
      return { ...d, destinations: list };
    });
  }

  function lookupDestinationName(idStr?: string) {
    if (!idStr) return undefined;
    const found = destinationList.find(x => x._id === idStr);
    return found ? found.name : undefined;
  }

  // ------------------ validation ------------------
  function validateBeforeSave(mode: 'draft' | 'publish') {
    const nextErr: Record<string, string> = {};
    if (mode === 'publish') {
      if (!doc.duration || String(doc.duration).trim().length === 0) nextErr.duration = 'Thời gian là bắt buộc khi xuất bản';
      const hasAnyDest = (Array.isArray(doc.destinations) && doc.destinations.some((d: any) => d?.id)) || Boolean(doc.destination);
      if (!hasAnyDest) nextErr.destination = 'Vui lòng chọn ít nhất 1 điểm đến';
      if (!doc.owner || String(doc.owner).trim().length === 0) nextErr.owner = 'Không tìm thấy thông tin người dùng. Vui lòng đăng nhập.';
      const badIt = (Array.isArray(doc.itinerary) && doc.itinerary.some((it: any) => !it.description || String(it.description).trim().length === 0));
      if (badIt) nextErr.itinerary = 'Mỗi ngày trong lịch trình phải có mô tả (description).';
    }
    setErrors(nextErr);
    return Object.keys(nextErr).length === 0;
  }

  // ------------------ SAVE: send destinations array + keep itinerary order ------------------
  async function save(mode: 'draft' | 'publish') {
    try {
      setSaving(true);
      if (!validateBeforeSave(mode)) { toast.error('Kiểm tra các trường bắt buộc trước khi lưu'); setSaving(false); return; }

      const safeItinerary = (Array.isArray(doc.itinerary) ? doc.itinerary.map((it: any, idx: number) => ({
        day: it.day ?? idx + 1,
        title: it.title ?? `Ngày ${it.day ?? idx + 1}`,
        description: (typeof it.description === 'string' && it.description.trim().length > 0) ? it.description : (it.title ?? `Ngày ${it.day ?? idx + 1}`),
      })) : []);

      const payload: any = {
        title: doc.title,
        slug: doc.slug,
        description: doc.description,
        duration: doc.duration,
        price: typeof doc.price === 'string' ? Number(doc.price) : doc.price,
        status: mode === 'publish' ? 'published' : doc.status || 'draft',
        inclusions: Array.isArray(doc.inclusions) ? doc.inclusions : [],
        exclusions: Array.isArray(doc.exclusions) ? doc.exclusions : [],
        itinerary: safeItinerary,
        imageGallery: Array.isArray(doc.imageGallery) ? doc.imageGallery.filter(Boolean) : [],
        mainImage: doc.mainImage ? doc.mainImage : undefined,
        maxGroupSize: typeof doc.maxGroupSize === 'string' ? Number(doc.maxGroupSize) : doc.maxGroupSize,
      };

      // owner -> must come from currentUser
      if (!currentUser) { toast.error('Không xác định người dùng. Vui lòng đăng nhập.'); setSaving(false); return; }
      const rawId = currentUser?.gid || currentUser?.id || currentUser?._id || '';
      let ownerToSend = '';
      if (typeof rawId === 'string' && rawId.startsWith('gid_')) ownerToSend = rawId;
      else if (typeof rawId === 'string' && rawId.match(/^[0-9a-fA-F]{24}$/)) ownerToSend = rawId;
      else if (typeof rawId === 'number' || String(rawId).match(/^\d+$/)) ownerToSend = `gid_${rawId}`;
      else ownerToSend = rawId ? String(rawId) : '';
      if (!ownerToSend) { toast.error('Không xác định GID người dùng.'); setSaving(false); return; }
      payload.owner = ownerToSend;

      // Build destinations array in backend-expected format:
      // destinations: [{ destinationId, orderIndex, note, destinationName? }]
      const uiDest = Array.isArray(doc.destinations) ? doc.destinations.map((d: any, idx: number) => {
        const destId = d.id || d.destinationId || '';
        const destName = (d.name && String(d.name).trim().length > 0) ? d.name : lookupDestinationName(destId) || undefined;
        return {
          destinationId: destId,
          orderIndex: idx + 1,
          note: d.note || undefined,
          destinationName: destName, // <-- thêm trường này. đổi key nếu backend yêu cầu khác
        };
      }).filter((x: any) => !!x.destinationId) : [];

      // If legacy single doc.destination exists and uiDest is empty, use that as first element
      if ((!uiDest || uiDest.length === 0) && doc.destination) {
        uiDest.push({ destinationId: doc.destination, orderIndex: 1, destinationName: lookupDestinationName(doc.destination) });
      }

      if (uiDest.length > 0) payload.destinations = uiDest;

      // Diagnostic
      console.log('--- Submitting Tour Payload ---');
      console.log('Data being sent to the API:', JSON.stringify(payload, null, 2));
      console.log('---------------------------------');

      const res = await fetch(isNew ? '/api/admin/tours' : `/api/admin/tours/${id}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        console.error('Save failed response:', json);
        if (json?.details && Array.isArray(json.details)) {
          const msgs = json.details.map((d: any) => d?.message || JSON.stringify(d));
          toast.error('Lỗi server: ' + msgs.join('; '));
        } else {
          toast.error(json?.error || 'Invalid data provided.');
        }
        throw new Error(json?.error || 'Invalid data provided.');
      }

      toast.success(mode === 'publish' ? 'Đã xuất bản' : 'Đã lưu nháp');
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Lỗi lưu');
    } finally {
      setSaving(false);
    }
  }

  // ------------------ RENDER ------------------
  return (
    <div className="p-6 space-y-4">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border py-3 flex items-center gap-2">
        <div className="font-semibold text-lg">{isNew ? 'Tạo tour mới' : `Chỉnh sửa: ${doc.title}`}</div>
        <div className="ml-auto" />
        <Button variant="secondary" onClick={() => save('draft')} disabled={saving}>Lưu nháp</Button>
        <Button variant="outline">Xem trước</Button>
        <Button onClick={() => save('publish')} disabled={saving}>Xuất bản</Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="general">Thông tin chung</TabsTrigger>
          <TabsTrigger value="itinerary">Lịch trình</TabsTrigger>
          <TabsTrigger value="media">Hình ảnh</TabsTrigger>
          <TabsTrigger value="pricing">Giá & Vận hành</TabsTrigger>
          <TabsTrigger value="reviews">Đánh giá</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <Card className="p-4 space-y-3">
              <div>
                <div className="text-sm text-secondary-foreground">Tiêu đề</div>
                <Input value={doc.title} onChange={(e) => setDoc({ ...doc, title: e.target.value })} />
              </div>

              <div>
                <div className="text-sm text-secondary-foreground">Slug</div>
                <Input value={doc.slug} readOnly />
              </div>

              <div>
                <div className="text-sm text-secondary-foreground">Mô tả</div>
                <Textarea value={doc.description} onChange={(e) => setDoc({ ...doc, description: e.target.value })} rows={6} />
              </div>

              <div>
                <div className="text-sm text-secondary-foreground">Thời gian</div>
                <Input placeholder="VD: 3 ngày 2 đêm" value={doc.duration || ''} onChange={(e) => { setDoc({ ...doc, duration: e.target.value }); setErrors(x => ({ ...x, duration: '' })); }} />
                {errors.duration && <div className="text-red-400 text-sm mt-1">{errors.duration}</div>}
              </div>

              {/* Destinations UI */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-secondary-foreground">Điểm đến (chọn 1 hoặc nhiều)</div>
                  <div className="text-sm">
                    <label className="mr-2 text-xs text-muted-foreground">Điểm bắt đầu:</label>
                    <select
                      className="rounded border border-border px-2 py-1 bg-background text-sm"
                      value={doc.destinations && doc.destinations.length > 0 ? (doc.destinations[0].id || '') : (doc.destination || '')}
                      onChange={(e) => {
                        const sel = e.target.value;
                        // put selected as first in UI list (start)
                        const name = lookupDestinationName(sel);
                        setDoc((d: any) => {
                          const cur = Array.isArray(d.destinations) ? [...d.destinations] : [];
                          const idx = cur.findIndex((it: any) => it?.id === sel);
                          if (idx === 0) return d;
                          if (idx > 0) {
                            // move element to front
                            const item = cur.splice(idx, 1)[0];
                            cur.unshift(item);
                            return { ...d, destinations: cur };
                          }
                          // not found -> insert at front with name if available
                          return { ...d, destinations: [{ id: sel, note: '', name: name || '' }, ...cur] };
                        });
                      }}
                    >
                      <option value="">{destinationList.length ? 'Chọn điểm bắt đầu' : 'Chưa có điểm'}</option>
                      {destinationList.map(opt => (<option key={opt._id} value={opt._id}>{opt.name}</option>))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  {(doc.destinations || []).map((d: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="flex items-center gap-2">
                        <input type="radio" name="startDestination" checked={idx === 0} readOnly className="mt-1" />
                      </div>

                      <select className="flex-1 rounded border border-border px-3 py-2 bg-background"
                        value={d.id || ''}
                        onChange={(e) => {
                          const sel = e.target.value;
                          const name = lookupDestinationName(sel);
                          updateDestinationAt(idx, { id: sel, name: name || '' });
                        }}
                      >
                        <option value="">-- Chọn điểm đến --</option>
                        {destinationList.map(opt => (<option key={opt._id} value={opt._id}>{opt.name}</option>))}
                      </select>

                      <input className="w-48 rounded border border-border px-2 py-2 bg-background" placeholder="Ghi chú (tuỳ chọn)" value={d.note || ''} onChange={(e) => updateDestinationAt(idx, { note: e.target.value })} />

                      <div className="flex flex-col gap-1">
                        <Button size="sm" variant="ghost" onClick={() => moveDestination(idx, 'up')}>↑</Button>
                        <Button size="sm" variant="ghost" onClick={() => moveDestination(idx, 'down')}>↓</Button>
                      </div>

                      <Button size="sm" variant="destructive" onClick={() => removeDestinationAt(idx)}>Xóa</Button>
                    </div>
                  ))}

                  <div className="flex gap-2 items-center">
                    <Button size="sm" onClick={addDestination}>+ Thêm điểm đến</Button>
                    <div className="ml-auto text-sm text-muted-foreground w-1/2">
                      {errors.destination && <div className="text-red-400 text-sm mt-1">{errors.destination}</div>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Owner read-only */}
              <div>
                <div className="text-sm text-secondary-foreground">Owner (auto)</div>
                <Input value={ownerLabel || doc.owner || ''} readOnly />
                {errors.owner && <div className="text-red-400 text-sm mt-1">{errors.owner}</div>}
              </div>
            </Card>

            <Card className="p-4 space-y-3">
              <div className="text-sm text-secondary-foreground">Ảnh đại diện</div>
              <ImageUploader value={doc.mainImage} onChange={(url) => setDoc({ ...doc, mainImage: url })} onUploadSuccess={() => toast.success('Đã tải ảnh chính')} onError={(err) => toast.error(err)} />
              <div className="text-sm text-secondary-foreground">Thư viện ảnh</div>
              <GalleryUploader value={doc.imageGallery} onChange={(urls) => setDoc({ ...doc, imageGallery: urls })} />
            </Card>
          </div>
        </TabsContent>

        {/* Itinerary builder */}
        <TabsContent value="itinerary">
          <Card className="p-4 mt-4">
            <div className="space-y-3">
              <Button size="sm" onClick={() => setDoc({ ...doc, itinerary: [...(doc.itinerary || []), { day: (doc.itinerary?.length || 0) + 1, title: '', description: '' }] })}>+ Thêm ngày</Button>
              <div className="space-y-3">
                {(doc.itinerary || []).map((d: any, idx: number) => (
                  <div key={idx} className="border border-border rounded p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="text-sm text-secondary-foreground">Ngày {d.day}</div>
                      <div className="ml-auto" />
                      <Button variant="ghost" size="sm" onClick={() => setDoc({ ...doc, itinerary: (doc.itinerary || []).filter((_: any, i: number) => i !== idx) })}>Xóa</Button>
                    </div>
                    <Input placeholder="Tiêu đề" value={d.title} onChange={(e) => { const it = [...(doc.itinerary || [])]; it[idx] = { ...it[idx], title: e.target.value }; setDoc({ ...doc, itinerary: it }); }} />
                    <Textarea placeholder="Mô tả hoạt động" value={d.description} onChange={(e) => { const it = [...(doc.itinerary || [])]; it[idx] = { ...it[idx], description: e.target.value }; setDoc({ ...doc, itinerary: it }); }} rows={4} />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Media */}
        <TabsContent value="media">
          <Card className="p-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-sm text-secondary-foreground mb-2">Ảnh chính</div>
                <ImageUploader value={doc.mainImage} onChange={(url) => setDoc({ ...doc, mainImage: url })} onUploadSuccess={() => toast.success('Đã tải ảnh chính')} onError={(err) => toast.error(err)} />
              </div>
              <div>
                <div className="text-sm text-secondary-foreground mb-2">Thư viện ảnh</div>
                <GalleryUploader value={doc.imageGallery} onChange={(urls) => setDoc({ ...doc, imageGallery: urls })} />
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Pricing */}
        <TabsContent value="pricing">
          <Card className="p-4 mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-sm text-secondary-foreground">Giá (₫)</div>
                <Input type="number" value={doc.price} onChange={(e) => setDoc({ ...doc, price: Number(e.target.value) })} />
              </div>
              <div>
                <div className="text-sm text-secondary-foreground">Số khách tối đa</div>
                <Input type="number" value={doc.maxGroupSize || 0} onChange={(e) => setDoc({ ...doc, maxGroupSize: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <div className="text-sm text-secondary-foreground">Bao gồm</div>
              <Textarea value={(doc.inclusions || []).join('\n')} onChange={(e) => setDoc({ ...doc, inclusions: e.target.value.split('\n').filter(Boolean) })} rows={4} />
            </div>
            <div>
              <div className="text-sm text-secondary-foreground">Không bao gồm</div>
              <Textarea value={(doc.exclusions || []).join('\n')} onChange={(e) => setDoc({ ...doc, exclusions: e.target.value.split('\n').filter(Boolean) })} rows={4} />
            </div>
          </Card>
        </TabsContent>

        {/* Reviews */}
        <TabsContent value="reviews">
          <Card className="p-4 mt-4">
            <div className="text-sm text-secondary-foreground mb-3">Đánh giá của tour</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/60">
                  <tr>
                    <th className="text-left p-3">Khách hàng</th>
                    <th className="text-left p-3">Điểm</th>
                    <th className="text-left p-3">Nhận xét</th>
                  </tr>
                </thead>
                <tbody>{/* reviews */}</tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
