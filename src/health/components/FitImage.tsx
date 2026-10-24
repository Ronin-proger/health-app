import { useEffect, useState, type ImgHTMLAttributes } from 'react';
import { Dumbbell } from 'lucide-react';
import { markImageFail, markImageOk } from '../utils/imageCache';
import { workoutPlaceholderUrl } from '../catalog/photos';

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'onError' | 'onLoad'> & {
  fallbackLabel?: string;
  /** Second URL if primary fails (e.g. local → Unsplash) */
  fallbackSrc?: string;
  variant?: 'cover' | 'thumb' | 'hero' | 'card';
};

export function FitImage({
  src,
  alt = '',
  className = '',
  fallbackLabel = 'Workout',
  fallbackSrc,
  variant = 'cover',
  loading,
  decoding = 'async',
  ...rest
}: Props) {
  const resolvedLoading = loading ?? (variant === 'hero' || variant === 'card' ? 'eager' : 'lazy');
  const primary = src ? String(src) : '';

  const [current, setCurrent] = useState(() =>
    primary || fallbackSrc || workoutPlaceholderUrl(fallbackLabel)
  );
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const next = primary || fallbackSrc || workoutPlaceholderUrl(fallbackLabel);
    setCurrent(next);
    setFailed(false);
    setLoaded(false);
  }, [primary, fallbackSrc, fallbackLabel]);

  const onError = () => {
    if (primary && current === primary && fallbackSrc) {
      markImageFail(primary);
      setCurrent(fallbackSrc);
      setLoaded(false);
      return;
    }
    if (current !== workoutPlaceholderUrl(fallbackLabel)) markImageFail(current);
    setFailed(true);
    setLoaded(true);
    setCurrent(workoutPlaceholderUrl(fallbackLabel));
  };

  const onLoad = () => {
    if (src) markImageOk(String(src));
    setFailed(false);
    setLoaded(true);
  };

  return (
    <span
      className={`fit-img-wrap fit-img-wrap--${variant} ${failed ? 'fit-img-wrap--fallback' : ''} ${
        loaded ? 'fit-img-wrap--loaded' : 'fit-img-wrap--loading'
      }`.trim()}
    >
      <img
        {...rest}
        ref={(node) => {
          if (node?.complete && node.naturalWidth > 0) {
            setLoaded(true);
            setFailed(false);
          }
        }}
        src={current}
        alt={alt}
        className={`fit-img ${className}`.trim()}
        loading={resolvedLoading}
        decoding={decoding}
        width={800}
        height={600}
        onError={onError}
        onLoad={onLoad}
        {...(variant === 'hero' ? { fetchpriority: 'high' as const } : {})}
      />
      {failed && (
        <span className="fit-img-fallback-icon" aria-hidden>
          <Dumbbell size={variant === 'hero' ? 32 : 22} strokeWidth={1.75} />
        </span>
      )}
    </span>
  );
}
