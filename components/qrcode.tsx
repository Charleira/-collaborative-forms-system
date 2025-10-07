'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Switch from '@radix-ui/react-switch';
import * as Select from '@radix-ui/react-select';
import * as QRCode from 'qrcode'; // garante tipagem com @types/qrcode

type ECLevel = 'L' | 'M' | 'Q' | 'H';

type Corner = 'center' | 'tl' | 'tr' | 'bl' | 'br';


type QRCodeCustomizerProps = {
  formId: string;
  defaultUrl?: string;
  trigger?: React.ReactNode;
  /** ✅ Controle externo (opcional) */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function QRCodeCustomizer({
  formId,
  defaultUrl,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: QRCodeCustomizerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;

  // Estado de configuração
  const [url, setUrl] = React.useState<string>('');
  const [fg, setFg] = React.useState('#000000');
  const [bg, setBg] = React.useState('#FFFFFF');
  const [size, setSize] = React.useState<number>(320); // tamanho de preview
  const [margin, setMargin] = React.useState<number>(2);
  const [ecLevel, setEcLevel] = React.useState<ECLevel>('H'); // H recomendado quando há logo

  const [withLogo, setWithLogo] = React.useState<boolean>(false);
  const [logoCentered, setLogoCentered] = React.useState<boolean>(true);
  const [logoCorner, setLogoCorner] = React.useState<Corner>('center');
  const [logoScale, setLogoScale] = React.useState<number>(0.22); // % do lado do QR (0.1–0.3)
  const [logoDataUrl, setLogoDataUrl] = React.useState<string | null>(null);

  const [hiRes2x, setHiRes2x] = React.useState<boolean>(true);

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [busy, setBusy] = React.useState(false);

  // Inicializa URL quando abrir (pega origem do browser)
  React.useEffect(() => {
    if (!open) return;
    if (typeof window !== 'undefined') {
      const shareUrl =
        defaultUrl ?? `${window.location.origin}/form/${formId}`;
      setUrl((prev) => (prev ? prev : shareUrl));
    }
  }, [open, defaultUrl, formId]);

  // Redesenha preview quando qualquer configuração muda
  React.useEffect(() => {
    let cancelled = false;

    const draw = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      setBusy(true);

      // Renderiza a uma resolução "boa" pro preview (suporta retina)
      const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
      const renderSize = size * dpr;
      canvas.width = renderSize;
      canvas.height = renderSize;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;

      await QRCode.toCanvas(canvas, url || ' ', {
        width: renderSize,
        margin,
        errorCorrectionLevel: ecLevel,
        color: { dark: fg, light: bg },
        // scale não é necessário porque width já define o escalonamento
      });

      if (withLogo && logoDataUrl) {
        await overlayLogo(canvas, logoDataUrl, {
          sizePx: renderSize,
          scale: logoScale,
          centered: logoCentered || logoCorner === 'center',
          corner: logoCorner,
          padding: Math.max(4 * dpr, Math.round(renderSize * 0.01)),
        });
      }

      if (!cancelled) setBusy(false);
    };

    draw().catch(() => setBusy(false));

    return () => {
      cancelled = true;
    };
  }, [
    url,
    fg,
    bg,
    size,
    margin,
    ecLevel,
    withLogo,
    logoCentered,
    logoCorner,
    logoScale,
    logoDataUrl,
  ]);

  function onSelectLogoFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(String(reader.result));
    reader.readAsDataURL(file);
  }

  function handleDownload() {
    if (!canvasRef.current) return;
    const exportScale = hiRes2x ? 2 : 1;
    const exportSize = size * exportScale;

    // Renderiza em um canvas offscreen para exportar nítido sem mexer no preview
    const off = document.createElement('canvas');
    off.width = exportSize;
    off.height = exportSize;
    const work = async () => {
      await QRCode.toCanvas(off, url || ' ', {
        width: exportSize,
        margin,
        errorCorrectionLevel: ecLevel,
        color: { dark: fg, light: bg },
      });
      if (withLogo && logoDataUrl) {
        await overlayLogo(off, logoDataUrl, {
          sizePx: exportSize,
          scale: logoScale,
          centered: logoCentered || logoCorner === 'center',
          corner: logoCorner,
          padding: Math.max(4, Math.round(exportSize * 0.01)),
        });
      }

      const link = document.createElement('a');
      link.href = off.toDataURL('image/png', 1.0);
      link.download = `convite-${formId}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
    };

    work().catch((e) => {
      console.error('Erro ao exportar QR:', e);
      alert('Erro ao exportar QR Code.');
    });
  }

  return (
    
<Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        {trigger ?? (
          <button type="button">Personalizar e baixar QR Code</button>
        )}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
          }}
        />
        <Dialog.Content
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 'min(920px, 95vw)',
            maxHeight: '90vh',
            overflow: 'auto',
            background: 'white',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
          }}
        >
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {/* Preview */}
            <div
              style={{
                flex: '0 0 360px',
                display: 'grid',
                placeItems: 'center',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 12,
              }}
            >
              <canvas
                ref={canvasRef}
                aria-label="Prévia do QR Code"
                style={{ display: 'block' }}
              />
              {busy && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
                  Renderizando…
                </div>
              )}
            </div>

            {/* Controles */}
            <div style={{ flex: '1 1 400px', minWidth: 320 }}>
              <h2 style={{ margin: '4px 0 12px', fontSize: 18 }}>
                Configurações do QR Code
              </h2>

              <div style={{ display: 'grid', gap: 12 }}>
                {/* Link */}
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, color: '#374151' }}>Link</span>
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://seu-link.com"
                    style={inputStyle}
                  />
                </label>

                {/* Cores */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <ColorControl
                    label="Cor do QR"
                    color={fg}
                    setColor={setFg}
                  />
                  <ColorControl
                    label="Fundo"
                    color={bg}
                    setColor={setBg}
                  />
                </div>

                {/* Tamanho e margem */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <RangeControl
                    label={`Tamanho (preview): ${size}px`}
                    min={180}
                    max={400}
                    value={size}
                    step={10}
                    onChange={setSize}
                  />
                  <RangeControl
                    label={`Margem: ${margin}`}
                    min={0}
                    max={8}
                    value={margin}
                    step={1}
                    onChange={setMargin}
                  />
                </div>

                

                {/* Export */}
                <div
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      borderTop: '1px solid #e5e7eb',
                      paddingTop: 10,
                    }}
                  >
                  <Switch.Root
                    id="switch-2x"
                    checked={hiRes2x}
                    onCheckedChange={setHiRes2x}
                    className="
                      relative h-6 w-11 rounded-full transition-colors
                      bg-gray-300 data-[state=checked]:bg-emerald-500
                    "
                  >
                    <Switch.Thumb
                      className="
                        block h-5 w-5 rounded-full bg-white shadow
                        translate-x-1 transition-transform will-change-transform
                        data-[state=checked]:translate-x-5
                      "
                    />
                  </Switch.Root>

                  <label htmlFor="switch-2x" className="ml-2 select-none">
                    Exportar em alta resolução (2×)
                  </label>
                </div>

                {/* Correção de erro */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#374151', width: 140 }}>
                    Estilo do QrCode
                  </span>
                  <Select.Root
                    value={ecLevel}
                    onValueChange={(v) => setEcLevel(v as ECLevel)}
                  >
                    <Select.Trigger
                      style={selectStyle}
                      aria-label="Nível de correção"
                    >
                      <Select.Value />
                    </Select.Trigger>
                    <Select.Content
                      style={{
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: 8,
                        padding: 4,
                      }}
                    >
                      {(['L', 'M', 'Q', 'H'] as ECLevel[]).map((lvl) => (
                        <Select.Item
                          key={lvl}
                          value={lvl}
                          style={selectItemStyle}
                        >
                          {lvl}
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <Dialog.Close asChild>
                    <button type="button" style={btnSecondaryStyle}>
                      Fechar
                    </button>
                  </Dialog.Close>
                  <button
                    type="button"
                    onClick={handleDownload}
                    style={btnPrimaryStyle}
                    disabled={!url}
                  >
                    Baixar PNG
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/** Util: desenha logo no canvas com um backdrop branco arredondado (melhora legibilidade) */
async function overlayLogo(
  canvas: HTMLCanvasElement,
  logoUrl: string,
  opts: {
    sizePx: number;
    scale: number; // 0.1–0.35
    centered: boolean;
    corner: Corner;
    padding: number;
  }
) {
  const { sizePx, scale, centered, corner, padding } = opts;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const img = await loadImage(logoUrl);
  const target = Math.max(16, Math.floor(sizePx * scale));
  let x = Math.floor((sizePx - target) / 2);
  let y = Math.floor((sizePx - target) / 2);

  if (!centered) {
    const p = padding;
    if (corner === 'tl') { x = p; y = p; }
    if (corner === 'tr') { x = sizePx - target - p; y = p; }
    if (corner === 'bl') { x = p; y = sizePx - target - p; }
    if (corner === 'br') { x = sizePx - target - p; y = sizePx - target - p; }
  }

  // Backdrop branco arredondado (cria contraste)
  const radius = Math.max(6, Math.round(target * 0.18));
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  roundedRect(ctx, x - 6, y - 6, target + 12, target + 12, radius);
  ctx.fill();
  ctx.drawImage(img, x, y, target, target);
  ctx.restore();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Importante para funcionar com DataURL e evitar CORS em mesma origem
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

/** Subcomponentes visuais simples (você pode trocar por seus componentes) */

function ColorControl({
  label,
  color,
  setColor,
}: {
  label: string;
  color: string;
  setColor: (c: string) => void;
}) {
  const [hex, setHex] = React.useState(color);
  React.useEffect(() => setHex(color), [color]);

  function onHexChange(v: string) {
    setHex(v);
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) {
      setColor(v.toUpperCase());
    }
  }

  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 12, color: '#374151', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          style={{
            width: 40,
            height: 36,
            padding: 0,
            border: '1px solid #e5e7eb',
            borderRadius: 6,
            background: 'white',
          }}
          aria-label={`Selecionar cor de ${label}`}
        />
        <input
          value={hex}
          onChange={(e) => onHexChange(e.target.value)}
          placeholder="#000000"
          style={{ ...inputStyle, width: 120 }}
        />
      </div>
    </div>
  );
}

function RangeControl({
  label,
  min,
  max,
  value,
  onChange,
  step = 1,
  compact,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  step?: number;
  onChange: (v: number) => void;
  compact?: boolean;
}) {
  return (
    <label style={{ display: 'grid', gap: 6, flex: 1 }}>
      <span style={{ fontSize: 12, color: '#374151' }}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      {!compact && (
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={inputStyle}
        />
      )}
    </label>
  );
}

/** Estilos básicos para inputs/botões (troque pelos seus) */
const inputStyle: React.CSSProperties = {
  height: 36,
  padding: '0 10px',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  outline: 'none',
};

const btnPrimaryStyle: React.CSSProperties = {
  height: 38,
  padding: '0 14px',
  borderRadius: 10,
  border: '1px solid #111827',
  background: '#111827',
  color: 'white',
  cursor: 'pointer',
};

const btnSecondaryStyle: React.CSSProperties = {
  height: 38,
  padding: '0 14px',
  borderRadius: 10,
  border: '1px solid #e5e7eb',
  background: 'white',
  color: '#111827',
  cursor: 'pointer',
};

const switchRootStyle: React.CSSProperties = {
  width: 42,
  height: 24,
  background: '#e5e7eb',
  borderRadius: 9999,
  position: 'relative',
  outline: 'none',
  border: '1px solid #d1d5db',
};

const switchThumbStyle: React.CSSProperties = {
  display: 'block',
  width: 20,
  height: 20,
  background: 'white',
  borderRadius: '50%',
  boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
  transform: 'translateX(2px)',
  willChange: 'transform',
};

const selectStyle: React.CSSProperties = {
  height: 36,
  padding: '0 10px',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  minWidth: 100,
  background: 'white',
};

const selectItemStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 6,
  cursor: 'pointer',
};
