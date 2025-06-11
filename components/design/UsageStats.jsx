'use client';

export default function UsageStats({ usageStats }) {
  if (!usageStats) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/3 mb-3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  const creditItems = [
    {
      type: 'Sketch',
      credits: usageStats.lowCredits || 0,
      usedToday: usageStats.lowUsedToday || 0,
      dailyCap: usageStats.dailyLowCap,
      color: 'orange',
      icon: '✏️'
    },
    {
      type: 'Studio', 
      credits: usageStats.mediumCredits || 0,
      usedToday: usageStats.mediumUsedToday || 0,
      dailyCap: usageStats.dailyMediumCap,
      color: 'blue',
      icon: '🎨'
    },
    {
      type: 'Runway',
      credits: usageStats.highCredits || 0,
      usedToday: usageStats.highUsedToday || 0,
      dailyCap: usageStats.dailyHighCap,
      color: 'purple',
      icon: '✨'
    }
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">Credits & Usage</h3>
        <p className="text-xs text-gray-600 mt-1">
          {usageStats.plan} Plan • Credits reset monthly
        </p>
      </div>
      
      <div className="p-4">
        <div className="grid grid-cols-1 gap-3">
          {creditItems.map((item) => {
            const dailyRemaining = item.dailyCap ? Math.max(0, item.dailyCap - item.usedToday) : null;
            
            return (
              <div key={item.type} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{item.icon}</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {item.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {item.dailyCap ? (
                        dailyRemaining === 0 ? (
                          `Daily limit reached`
                        ) : (
                          `${dailyRemaining} left today`
                        )
                      ) : (
                        `${item.usedToday} used today`
                      )}
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    item.color === 'orange' 
                      ? 'bg-orange-100 text-orange-800'
                      : item.color === 'blue'
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {item.credits} credits
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary section */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>Plan:</span>
              <span className="font-medium text-gray-700">{usageStats.plan}</span>
            </div>
            <div className="flex justify-between">
              <span>Edit limit per design:</span>
              <span className="font-medium text-gray-700">{usageStats.editCapPerDesign}</span>
            </div>
            <div className="flex justify-between">
              <span>Credits reset:</span>
              <span className="font-medium text-gray-700">
                {usageStats.creditsResetTime ? 
                  new Date(usageStats.creditsResetTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
                  : 'Next month'
                }
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 