import { Link } from "react-router-dom";
import RevelaLayout from "../components/RevelaLayout.jsx";
import { useRevelaMeta } from "../hooks.js";
import { LEGAL_INFO, PRIVACY, TERMS } from "../legal.js";

function LegalPage({ doc, other }) {
  useRevelaMeta(doc.title, `${doc.title} da Revela.`);
  return (
    <RevelaLayout>
      <section className="bg-rv-lavanda pb-20 pt-36 sm:pt-40">
        <article className="rv-wrap max-w-3xl">
          <p className="text-sm text-rv-ink2">Atualizado em {LEGAL_INFO.updated}</p>
          <h1 className="mt-2 text-[2.6rem] leading-[1.05] sm:text-6xl">{doc.title}</h1>
          <p className="mt-6 text-lg leading-relaxed text-rv-ink2">{doc.intro}</p>
          {doc.sections.map(([h, ps]) => (
            <section key={h} className="mt-10">
              <h2 className="text-2xl sm:text-3xl">{h}</h2>
              {ps.map((p) => <p key={p.slice(0, 40)} className="mt-3 leading-relaxed text-rv-ink2">{p}</p>)}
            </section>
          ))}
          <p className="mt-12 text-rv-ink2">Veja também: <Link className="rv-link font-medium text-rv-ameixa" to={other[1]}>{other[0]}</Link></p>
        </article>
      </section>
    </RevelaLayout>
  );
}

export function RevelaTerms() { return <LegalPage doc={TERMS} other={["Política de privacidade", "/privacidade"]} />; }
export function RevelaPrivacy() { return <LegalPage doc={PRIVACY} other={["Termos de uso", "/termos"]} />; }
