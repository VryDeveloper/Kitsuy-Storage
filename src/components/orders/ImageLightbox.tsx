// ─────────────────────────────────────────────────────────────
//  KitsuyStore — ImageLightbox Component
// ─────────────────────────────────────────────────────────────

interface ImageLightboxProps {
  src: string;
  onClose: () => void;
}

export function ImageLightbox({ src, onClose }: ImageLightboxProps) {
  return (
    <div className="image-lightbox-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="image-lightbox-content">
        <button className="image-lightbox-close" onClick={onClose}>✕</button>
        <img src={src} alt="Imagem ampliada do item" />
      </div>
    </div>
  );
}
