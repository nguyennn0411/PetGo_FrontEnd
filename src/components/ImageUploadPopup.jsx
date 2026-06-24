import { useState } from 'react';
import { Loader2, Trash2, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { uploadUserAvatar, uploadUserCover } from '../api/profile';

const ImageUploadPopup = ({ type, onSave, onClose }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleFileSelect = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleSave = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const uploadFn = type === 'cover' ? uploadUserCover : uploadUserAvatar;
      const url = await uploadFn(file);
      onSave(url);
      onClose();
    } catch {
      toast.error('Upload thất bại.');
    } finally {
      setUploading(false);
    }
  };

  const title = type === 'cover' ? 'Cập nhật ảnh bìa' : 'Cập nhật ảnh đại diện';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden p-8 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
        <h3 className="text-xl font-black mb-2">{title}</h3>
        <p className="text-gray-400 font-bold text-sm mb-6">Kéo thả ảnh vào ô bên dưới hoặc bấm để chọn</p>

        {preview ? (
          <div className="relative rounded-2xl overflow-hidden mb-6">
            <img src={preview} alt="Preview" className="w-full h-48 object-cover" />
            <button
              type="button"
              onClick={() => { setFile(null); setPreview(null); }}
              className="absolute top-3 right-3 p-2 bg-black/50 rounded-xl text-white hover:bg-black/70 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => document.getElementById(`img-upload-${type}`)?.click()}
            className="rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center cursor-pointer hover:border-orange-500 hover:bg-orange-50/50 transition-all mb-6"
          >
            <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-bold text-sm">Kéo thả ảnh vào đây</p>
          </div>
        )}

        <input id={`img-upload-${type}`} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

        <div className="flex gap-4">
          <button type="button" onClick={onClose} className="flex-1 py-4 bg-gray-100 text-gray-400 font-black rounded-2xl hover:bg-gray-200 transition-all">
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!file || uploading}
            className="flex-[2] py-4 bg-gray-900 text-white font-black rounded-2xl hover:bg-orange-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {uploading ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Đang tải...</>
            ) : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageUploadPopup;
