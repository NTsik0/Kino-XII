export default function Logo({ small }) {
  return (
    <span className={`logo ${small ? 'logo-sm' : ''}`}>
      KINO <span className="logo-accent">XII</span>
    </span>
  );
}
