import { LanguageProvider } from './i18n';
import { DashboardPage } from './pages/DashboardPage';

export function App() {
  return (
    <LanguageProvider>
      <DashboardPage />
    </LanguageProvider>
  );
}

export default App;
