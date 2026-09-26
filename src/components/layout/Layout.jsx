import Reminders from "./Reminders";
import Navigation from "./Navigation";
import TimerBar from "./TimerBar";
import { useDashboard } from '../../context/DashboardContext';

function Layout({ children }) {
  const { error, refresh } = useDashboard();
  return (
    <>
      <Navigation />
      <TimerBar />
      {error && <div className="reminder-banner" role="alert"><span>{error}</span><button type="button" onClick={()=>refresh().catch(()=>{})}>Retry loading data</button></div>}

      <Reminders />
      <main className="main-content">
        {children}
      </main>
    </>
  );
}

export default Layout;
