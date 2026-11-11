import { Link } from "react-router-dom";
import "./landingPage.css";

const FEATURES = [
  {
    number: "01",
    icon: "◷",
    title: "Keep every class on track",
    description: "Plan one-to-one sessions, avoid overlapping times, and make sure students know what is coming up.",
  },
  {
    number: "02",
    icon: "↗",
    title: "See progress clearly",
    description: "Bring grades, assignments, and exams together so teachers can spot wins and where support is needed.",
  },
  {
    number: "03",
    icon: "✳",
    title: "Stay in sync",
    description: "Share announcements and class updates in one dependable place for teachers and students.",
  },
];

export default function LandingPage() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const destination = token && (role === "teacher" || role === "student")
    ? `/${role}/dashboard`
    : "/login";
  const actionLabel = token ? "Open your portal" : "Sign in to ClassSite";

  return (
    <div className="landing">
      <header className="landingNav">
        <a className="landingBrand" href="#top" aria-label="ClassSite home">
          <span className="brandSymbol" aria-hidden="true">C</span>
          <span>class<span>site</span></span>
        </a>
        <nav className="landingLinks" aria-label="Main navigation">
          <a href="#platform">Platform</a>
          <a href="#how-it-works">How it works</a>
        </nav>
        <Link className="navAction" to={destination}>{actionLabel}<span aria-hidden="true">→</span></Link>
      </header>

      <main id="top">
        <section className="hero">
          <div className="heroCopy">
            <p className="heroEyebrow"><span /> A better rhythm for learning</p>
            <h1>Make room for<br /><em>great teaching.</em></h1>
            <p className="heroIntro">
              ClassSite gives teachers and students one clear place to plan classes,
              follow learning progress, and stay connected throughout the term.
            </p>
            <div className="heroActions">
              <Link className="primaryCta" to={destination}>{actionLabel}<span aria-hidden="true">↗</span></Link>
              <a className="secondaryCta" href="#platform"><span aria-hidden="true">↓</span> Explore the platform</a>
            </div>
            <div className="heroNote">
              <span className="noteAvatars" aria-hidden="true"><i>T</i><i>S</i><i>+</i></span>
              <span>One connected space for your whole learning community</span>
            </div>
          </div>

          <div className="heroVisual" aria-label="Preview of the class planning dashboard">
            <div className="visualGlow" />
            <div className="previewCard">
              <div className="previewTop">
                <div>
                  <span className="previewCaption">YOUR WEEK, AT A GLANCE</span>
                  <h2>Teaching overview</h2>
                </div>
                <span className="previewAvatar">A</span>
              </div>
              <div className="previewStats">
                <div><span>Classes planned</span><strong>12</strong><small>Across this week</small></div>
                <div><span>Students supported</span><strong>28</strong><small>Learning together</small></div>
              </div>
              <div className="weekHeader"><strong>Coming up</strong><span>This week <b>⌄</b></span></div>
              <div className="lessonRow">
                <span className="lessonTime">09:00</span><span className="lessonLine mint" />
                <div><strong>Algebra foundations</strong><small>Class 8B <i>·</i> 45 min</small></div><span className="lessonDot" />
              </div>
              <div className="lessonRow">
                <span className="lessonTime">11:30</span><span className="lessonLine peach" />
                <div><strong>Reading &amp; discussion</strong><small>Class 7A <i>·</i> 60 min</small></div><span className="lessonDot orange" />
              </div>
              <div className="lessonRow">
                <span className="lessonTime">14:00</span><span className="lessonLine blue" />
                <div><strong>One-to-one support</strong><small>Jordan M. <i>·</i> 30 min</small></div><span className="lessonDot indigo" />
              </div>
              <div className="previewFooter"><span className="footerCheck">✓</span> Your classes and updates, all in one place</div>
            </div>
            <div className="floatingBadge"><span>✦</span><div><strong>More focus</strong><small>Less admin, more learning</small></div></div>
            <span className="visualOrb orbOne" />
            <span className="visualOrb orbTwo" />
          </div>
        </section>

        <section className="trustStrip" aria-label="Platform benefits">
          <span>Made for the people who make learning happen</span>
          <div><b>Plan</b><i /> <b>Teach</b><i /> <b>Grow</b></div>
        </section>

        <section className="platformSection" id="platform">
          <div className="sectionIntro">
            <p className="sectionEyebrow">THE CLASSROOM, CONNECTED</p>
            <h2>Everything important.<br /><em>Nothing in the way.</em></h2>
            <p>From the next class on the calendar to the progress made this term, the details that matter stay easy to find.</p>
          </div>
          <div className="featureGrid">
            {FEATURES.map((feature) => (
              <article className="featureCard" key={feature.number}>
                <div className="featureTop"><span className="featureIcon">{feature.icon}</span><span>{feature.number}</span></div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="workflowSection" id="how-it-works">
          <div className="workflowCopy">
            <p className="sectionEyebrow">SIMPLE BY DESIGN</p>
            <h2>A little more clarity,<br /><em>every school day.</em></h2>
            <p>ClassSite is built around the everyday flow of teaching: organize your class, keep students informed, and understand how learning is going.</p>
            <Link className="textCta" to={destination}>{actionLabel}<span aria-hidden="true">→</span></Link>
          </div>
          <div className="steps">
            <article><span>1</span><div><h3>Set up your class</h3><p>Bring your students and learning activities into one organized space.</p></div></article>
            <article><span>2</span><div><h3>Plan what’s next</h3><p>Schedule class sessions, share assignments, and post timely announcements.</p></div></article>
            <article><span>3</span><div><h3>Keep progress moving</h3><p>Students stay informed while teachers keep a clear view of learning.</p></div></article>
          </div>
        </section>

        <section className="closingCta">
          <div><p>YOUR CLASSROOM, IN GOOD ORDER</p><h2>Make every lesson count.</h2></div>
          <Link to={destination}>{actionLabel}<span aria-hidden="true">↗</span></Link>
        </section>
      </main>

      <footer className="landingFooter">
        <a className="landingBrand" href="#top"><span className="brandSymbol" aria-hidden="true">C</span><span>class<span>site</span></span></a>
        <p>A clearer way to teach, learn, and stay connected.</p>
        <span>© {new Date().getFullYear()} ClassSite</span>
      </footer>
    </div>
  );
}
