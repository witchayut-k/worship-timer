import { QRCodeSVG } from 'qrcode.react'

type Props = {
  url: string
  ariaLabel: string
}

export function OutputLinkQrCode({ url, ariaLabel }: Props) {
  return (
    <div className="outputLinksQr" role="img" aria-label={ariaLabel}>
      <QRCodeSVG value={url} size={144} level="M" marginSize={2} bgColor="#ffffff" fgColor="#000000" />
    </div>
  )
}
