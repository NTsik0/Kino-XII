import { useSearchParams } from 'react-router-dom';
import PersonalInfoForm from '../components/profile/PersonalInfoForm';
import MyTickets from '../components/profile/MyTickets';
import { useAuth } from '../context/AuthContext';
import useAsync from '../hooks/useAsync';
import { fetchTickets } from '../api/endpoints';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'tickets' ? 'tickets' : 'info';
  // Loaded up front so the tab can show the upcoming count.
  const tickets = useAsync(() => fetchTickets(), [user?.id]);
  const upcomingCount = (tickets.data || []).filter((o) => o.isUpcoming).length;

  const setTab = (next) => setParams(next === 'tickets' ? { tab: 'tickets' } : {});

  return (
    <div className="container profile-page">
      <header className="page-head">
        <h1>My Profile</h1>
      </header>

      <div className="profile-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'info'}
          className={tab === 'info' ? 'is-active' : ''}
          onClick={() => setTab('info')}
        >
          Personal Information
          {!user.profileComplete && <span className="profile-tab-dot" title="Profile incomplete" />}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'tickets'}
          className={tab === 'tickets' ? 'is-active' : ''}
          onClick={() => setTab('tickets')}
        >
          My Tickets
          {upcomingCount > 0 && <span className="profile-tab-count">{upcomingCount}</span>}
        </button>
      </div>

      <div className="profile-panel">
        {tab === 'info' ? <PersonalInfoForm key={user.id} /> : <MyTickets request={tickets} />}
      </div>
    </div>
  );
}
