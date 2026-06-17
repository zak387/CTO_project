import { LANDING_URL } from "@/lib/config";

export default function LandingArtefact() {
  const pretty = LANDING_URL.replace(/^https?:\/\//, "");
  return (
    <>
      <div className="top">
        <div className="t-stagger">
          <div className="crumb">Artefacts / Landing page</div>
          <h1 className="t-stagger-line t-stagger-line--1">Landing page</h1>
          <div className="sub t-stagger-line t-stagger-line--2">Where strangers who see Adam&apos;s posts sign up — this feeds the inbound lane.</div>
        </div>
      </div>

      <div className="landwrap">
        <div className="landcard">
          <div className="glyph">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
          </div>
          <h3>NY CTO Dinner — signup page</h3>
          <p>The live inbound signup page. Open it in a new tab to see exactly what prospects see when they click through from one of Adam&apos;s posts.</p>
          <div className="urlchip">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
            {pretty}
          </div>
          <div>
            <a className="openbtn" href={LANDING_URL} target="_blank" rel="noreferrer">
              Open landing page
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7" /><path d="M7 7h10v10" /></svg>
            </a>
          </div>
          <div className="landstatus"><span className="pulse" /> Live · collecting signups</div>
        </div>
      </div>
    </>
  );
}
