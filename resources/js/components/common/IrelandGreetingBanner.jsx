import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { Sun, Sunset, Moon, Sunrise, Clock, MapPin, Sparkles } from 'lucide-react';
import { useAuth } from '../../features/auth/hooks/AuthContext';

const IrelandGreetingBanner = ({ customTitle }) => {
  const { auth } = usePage().props;
  const { user: contextUser, selectedRestaurant } = useAuth();

  const user = auth?.user || contextUser;
  const userName = user?.name || user?.first_name || 'Chef';

  const [timeData, setTimeData] = useState(() => getIrelandTimeDetails());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeData(getIrelandTimeDetails());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  function getIrelandTimeDetails() {
    const now = new Date();

    // Determine Ireland hour (0 - 23) in Europe/Dublin timezone
    const hourFormatter = new Intl.DateTimeFormat('en-IE', {
      timeZone: 'Europe/Dublin',
      hour: 'numeric',
      hour12: false
    });
    const hour = parseInt(hourFormatter.format(now), 10);

    // Format full Ireland time string e.g. 08:45:12 AM
    const timeFormatter = new Intl.DateTimeFormat('en-IE', {
      timeZone: 'Europe/Dublin',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    const formattedTime = timeFormatter.format(now);

    // Format full Ireland date string e.g. Saturday, 12 Sep 2026
    const dateFormatter = new Intl.DateTimeFormat('en-IE', {
      timeZone: 'Europe/Dublin',
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    const formattedDate = dateFormatter.format(now);

    let greeting = 'Good Morning';
    let subtitle = 'Top of the morning! Bright morning sun and blue skies across Ireland.';
    let skyClass = 'sky-morning';
    let skyTag = '🌅 Morning Sun • Ireland Time';
    let TimeIcon = Sunrise;
    let iconColor = '#FEF08A';

    if (hour >= 5 && hour < 12) {
      greeting = 'Good Morning';
      subtitle = 'Top of the morning! Fresh morning sun and bright sky across Ireland.';
      skyClass = 'sky-morning';
      skyTag = '🌅 Morning Sun • Ireland Time';
      TimeIcon = Sunrise;
      iconColor = '#FEF08A';
    } else if (hour >= 12 && hour < 17) {
      greeting = 'Good Afternoon';
      subtitle = 'Good afternoon! Brilliant azure blue sky and golden sun across Ireland.';
      skyClass = 'sky-afternoon';
      skyTag = '☀️ Midday Sun • Ireland Time';
      TimeIcon = Sun;
      iconColor = '#FDE047';
    } else if (hour >= 17 && hour < 22) {
      greeting = 'Good Evening';
      subtitle = 'Good evening! Beautiful sunset twilight colors across Ireland.';
      skyClass = 'sky-sunset';
      skyTag = '🌆 Sunset Sky • Ireland Time';
      TimeIcon = Sunset;
      iconColor = '#FDBA74';
    } else {
      greeting = 'Good Night';
      subtitle = 'Good night! Deep midnight starry sky and peaceful evening across Ireland.';
      skyClass = 'sky-night';
      skyTag = '🌙 Night Sky • Ireland Time';
      TimeIcon = Moon;
      iconColor = '#C7D2FE';
    }

    return {
      hour,
      formattedTime,
      formattedDate,
      greeting,
      subtitle,
      skyClass,
      skyTag,
      TimeIcon,
      iconColor
    };
  }

  const { formattedTime, formattedDate, greeting, subtitle, skyClass, skyTag, TimeIcon, iconColor } = timeData;

  const branchName = selectedRestaurant?.name || user?.branch_name || user?.tenant_name || null;

  return (
    <div className={`ireland-greeting-card ${skyClass}`}>
      <div className="ireland-greeting-bg-glow"></div>
      
      <div className="ireland-greeting-content">
        <div className="ireland-greeting-main">
          {/* Ireland Sky Badge Row */}
          <div className="ireland-badge-row">
            <span className="ireland-location-badge">
              <span className="ireland-pulse-dot"></span>
              <span>{skyTag}</span>
            </span>

            {branchName && (
              <span className="ireland-location-badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
                <MapPin size={12} />
                <span>{branchName}</span>
              </span>
            )}
          </div>

          {/* Dynamic Sky Greeting Header */}
          <h1 className="ireland-greeting-title">
            <TimeIcon size={34} color={iconColor} />
            <span>{customTitle || `${greeting}, ${userName}!`}</span>
          </h1>

          {/* Sky Vibe Subtitle */}
          <p className="ireland-greeting-subtitle">
            {subtitle}
          </p>
        </div>

        {/* Ireland Live Time & Date Card */}
        <div className="ireland-time-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.85)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
            <Clock size={12} />
            <span>Dublin Local Time</span>
          </div>
          <div className="ireland-time-clock">
            {formattedTime}
          </div>
          <div className="ireland-time-date">
            {formattedDate}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IrelandGreetingBanner;
