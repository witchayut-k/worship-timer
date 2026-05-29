type Props = {
  message: string
}

export function FullScreenLoading({ message }: Props) {
  return (
    <div
      className="fullScreenLoading"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={message}
    >
      <div className="fullScreenLoadingInner">
        <div className="fullScreenLoadingLogoWrap">
          <img
            className="fullScreenLoadingLogo"
            src="/loader-logo.png"
            alt=""
            width={518}
            height={251}
            aria-hidden
          />
        </div>
        {/* <div className="fullScreenLoadingSpinner" aria-hidden /> */}
        <p className="fullScreenLoadingMessage">{message}</p>
      </div>
    </div>
  )
}
