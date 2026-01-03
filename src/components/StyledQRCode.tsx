import { useEffect, useRef } from 'react';

interface StyledQRCodeProps {
  data: string;
  size?: number;
  logoUrl: string;
}

export function StyledQRCode({ data, size = 300, logoUrl }: StyledQRCodeProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const qrInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!qrRef.current || !data) return;

    // Dynamically import QRCodeStyling
    import('qr-code-styling').then((QRCodeStylingModule) => {
      const QRCodeStyling = QRCodeStylingModule.default;

      // Clear previous QR code
      if (qrRef.current) {
        qrRef.current.innerHTML = '';
      }

      // Create new QR code with styling
      qrInstanceRef.current = new QRCodeStyling({
        width: size,
        height: size,
        type: "canvas",
        data: data,
        image: logoUrl,
        dotsOptions: {
          color: "#192A39",
          type: "rounded"
        },
        backgroundOptions: {
          color: "#EF9D65",
        },
        imageOptions: {
          crossOrigin: "anonymous",
          margin: 8,
          imageSize: 0.4
        },
        cornersSquareOptions: {
          type: "extra-rounded",
          color: "#192A39"
        },
        cornersDotOptions: {
          type: "dot",
          color: "#192A39"
        }
      });

      if (qrRef.current) {
        qrInstanceRef.current.append(qrRef.current);
      }
    });

    return () => {
      if (qrRef.current) {
        qrRef.current.innerHTML = '';
      }
    };
  }, [data, size, logoUrl]);

  return <div ref={qrRef} />;
}

// Export function to get QR code canvas for PDF generation
export async function getStyledQRCodeCanvas(data: string, logoUrl: string, size: number = 300): Promise<HTMLCanvasElement> {
  const QRCodeStylingModule = await import('qr-code-styling');
  const QRCodeStyling = QRCodeStylingModule.default;

  const qrCode = new QRCodeStyling({
    width: size,
    height: size,
    type: "canvas",
    data: data,
    image: logoUrl,
    dotsOptions: {
      color: "#192A39",
      type: "rounded"
    },
    backgroundOptions: {
      color: "#EF9D65",
    },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 8,
      imageSize: 0.4
    },
    cornersSquareOptions: {
      type: "extra-rounded",
      color: "#192A39"
    },
    cornersDotOptions: {
      type: "dot",
      color: "#192A39"
    }
  });

  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  document.body.appendChild(tempDiv);

  await qrCode.append(tempDiv);
  
  const canvas = tempDiv.querySelector('canvas');
  if (!canvas) {
    document.body.removeChild(tempDiv);
    throw new Error('Failed to generate QR code canvas');
  }

  // Clone the canvas so we can remove the temp div
  const clonedCanvas = document.createElement('canvas');
  clonedCanvas.width = canvas.width;
  clonedCanvas.height = canvas.height;
  const ctx = clonedCanvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(canvas, 0, 0);
  }

  document.body.removeChild(tempDiv);
  return clonedCanvas;
}
