const LoadingSpinner = ({ fullScreen, size = "default", text = "Loading..." }) => {
  const sizeClasses = {
    small: "h-4 w-4",
    default: "h-8 w-8",
    large: "h-12 w-12",
  }

  const spinner = (
    <div className="flex flex-col items-center justify-center">
      <div className={`animate-spin rounded-full border-t-2 border-b-2 border-blue-500 ${sizeClasses[size]}`}></div>
      {text && <p className="mt-2 text-gray-600">{text}</p>}
    </div>
  )

  if (fullScreen) {
    return <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">{spinner}</div>
  }

  return spinner
}

export default LoadingSpinner
