import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { initials } from '../../utils/format';
import Icon from '../Icon';

export function UserAvatar({ user, size = '', showStatus = true }) {
  const name = user.fullName || user.username || user.email;
  return (
    <span className={`avatar ${size}`}>
      {user.avatar ? <img src={user.avatar} alt="" /> : initials(name)}
      {showStatus && (
        <span
          className={`status-dot ${user.profileComplete ? 'is-complete' : 'is-incomplete'}`}
          title={user.profileComplete ? 'Profile complete' : 'Profile incomplete'}
        />
      )}
    </span>
  );
}

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const displayName = user.fullName || user.username;
  const firstName = displayName.split(' ')[0];

  const go = (to) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="user-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <UserAvatar user={user} />
        <span>{firstName}</span>
        <Icon name={open ? 'chevronUp' : 'chevronDown'} size={16} />
      </button>

      {open && (
        <div className="user-dropdown" role="menu">
          <div className="user-dropdown-head">
            <UserAvatar user={user} size="avatar-lg" />
            <div>
              <strong>{displayName}</strong>
              <span>{user.email}</span>
            </div>
          </div>

          {user.profileComplete ? (
            <div className="profile-status is-complete">
              <strong>
                Profile Complete <Icon name="check" size={14} />
              </strong>
            </div>
          ) : (
            <button type="button" className="profile-status is-incomplete" onClick={() => go('/profile')}>
              <strong>Profile incomplete</strong>
              Please complete your profile to enable booking
            </button>
          )}

          <button type="button" role="menuitem" className="user-dropdown-item" onClick={() => go('/profile')}>
            <Icon name="user" size={16} /> My Profile
          </button>
          <button type="button" role="menuitem" className="user-dropdown-item" onClick={() => go('/profile?tab=tickets')}>
            <Icon name="ticket" size={16} /> My Tickets
          </button>
          <button
            type="button"
            role="menuitem"
            className="user-dropdown-item is-danger"
            onClick={async () => {
              setOpen(false);
              await logout();
            }}
          >
            <Icon name="logout" size={16} /> Log out
          </button>
        </div>
      )}
    </div>
  );
}
