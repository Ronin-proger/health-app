import { HealthModule } from './health/HealthModule';

function displayName(): string {
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const name = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
  return name || 'Атлет';
}

export default function App() {
  return (
    <HealthModule
      displayName={displayName()}
      pushToast={() => undefined}
      onExit={() => undefined}
    />
  );
}
