'use client';

import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import OnboardingForm from '@/components/onboarding/OnboardingForm';
import { Button } from '@/components/ui/Base';
import { Cloud, TrendingUp, HelpCircle, Loader2 } from 'lucide-react';
import { useGetWeatherQuery } from '@/lib/api/apiSlice';

export default function Home() {
  const { isAuthenticated, name, location, userId } = useSelector((state: RootState) => state.user);

  // Extract pincode from location string "City (Pincode)"
  const pincode = location?.match(/\d{6}/)?.[0] || '304001';
  const { data: weather, isLoading: weatherLoading } = useGetWeatherQuery(pincode, {
    skip: !isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-grid bg-slate-50">
        <OnboardingForm />
      </main>
    );
  }

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 leading-tight">
            Namaste, <span className="text-green-700">{name}</span>!
          </h1>
          <p className="text-slate-500">Here's what's happening on your farm today.</p>
        </div>
        <Button variant="outline" className="flex gap-2 items-center">
          <HelpCircle size={18} />
          Need Help?
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Weather Widget Placeholder */}
        <div className="col-span-1 md:col-span-2 bg-gradient-to-br from-green-600 to-green-800 rounded-3xl p-8 text-white shadow-xl flex flex-col justify-between min-h-[240px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />

          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-green-100 font-medium">Weather Forecast</p>
              {weatherLoading ? (
                <Loader2 className="animate-spin mt-4 h-10 w-10 text-white/50" />
              ) : (
                <>
                  <h3 className="text-5xl font-bold mt-2">{weather?.temp ?? '--'}°C</h3>
                  <p className="text-green-100">{location || 'Rajasthan'}</p>
                </>
              )}
            </div>
            <Cloud size={48} className="text-white/80" />
          </div>
          <div className="flex gap-4 mt-8 relative z-10">
            <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
              <p className="text-xs text-green-200">Rain Chance</p>
              <p className="font-semibold">10%</p>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
              <p className="text-xs text-green-200">Humidity</p>
              <p className="font-semibold">{weather?.humidity ?? '--'}%</p>
            </div>
          </div>
        </div>

        {/* Market Link Card */}
        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-4">
              <TrendingUp className="text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Mandhi Prices</h3>
            <p className="text-slate-500 mt-2">Soyabean prices are up by 5% in Latur.</p>
          </div>
          <Button variant="secondary" className="w-full mt-6">View Prices</Button>
        </div>
      </div>

      <div className="bg-green-50 border border-green-100 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-green-900">Take KrishiCo on the go!</h3>
          <p className="text-green-700 max-w-md">Get instant advice on pests, weather, and market prices directly on your WhatsApp.</p>
        </div>
        <Button
          className="bg-green-600 hover:bg-green-700 whitespace-nowrap shadow-green-200"
          onClick={() => window.open(`https://wa.me/14155238886?text=LINK_WEB_ACCOUNT_${userId}`, '_blank')}
        >
          Connect to WhatsApp Agent
        </Button>
      </div>
    </main>
  );
}

