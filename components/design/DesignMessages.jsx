export default function DesignMessages({ 
  error, 
  success, 
  onClearError, 
  onClearSuccess,
  recoveryActions = {},
  actions = {} // Support both prop names for backward compatibility
}) {
  // Use either recoveryActions or actions (for backward compatibility)
  const actionsObject = Object.keys(recoveryActions).length > 0 ? recoveryActions : actions
  
  const {
    onRetry,
    onBackToEdit,
    onStartOver,
    onContinueWithCurrent,
    showContinueOption = false,
    currentStep = 2,
    // Support both naming conventions
    retry: retryAction,
    startOver: startOverAction,
    continue: continueAction
  } = actionsObject

  if (error) {
    return (
      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 8.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="font-medium text-red-800">Something went wrong</span>
            </div>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            
            {/* Recovery actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              {(onRetry || retryAction) && (
                <button
                  onClick={onRetry || retryAction}
                  className="text-sm px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Try Again
                </button>
              )}
              
              {onBackToEdit && (
                <button
                  onClick={onBackToEdit}
                  className="text-sm px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  ← Back to Edit Details
                </button>
              )}
              
              {(onStartOver || startOverAction) && (
                <button
                  onClick={onStartOver || startOverAction}
                  className="text-sm px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
                >
                  Start Over
                </button>
              )}
              
              {showContinueOption && (onContinueWithCurrent || continueAction) && (
                <button
                  onClick={onContinueWithCurrent || continueAction}
                  className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Continue with Current Design →
                </button>
              )}
            </div>
          </div>
          
          {onClearError && (
            <button
              onClick={onClearError}
              className="ml-4 text-red-400 hover:text-red-600 flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-green-800">{success}</span>
          {onClearSuccess && (
            <button
              onClick={onClearSuccess}
              className="ml-auto text-green-400 hover:text-green-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    )
  }

  return null
} 