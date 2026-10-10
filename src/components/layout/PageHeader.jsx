import { Sparkle } from "../common/SectionHeading.jsx";

export default function PageHeader({ eyebrow, title, text, children }) {
  return (
    <section className="relative overflow-hidden border-b border-ink/5 bg-paper">
      <div className="pointer-events-none absolute -bottom-24 right-[7%] hidden h-[360px] w-[250px] rounded-t-full border border-gold/30 md:block" aria-hidden />
      <div className="pointer-events-none absolute -bottom-24 right-[calc(7%+18px)] hidden h-[340px] w-[214px] rounded-t-full border border-gold/15 md:block" aria-hidden />
      <div className="container-x relative py-16 sm:py-20">
        {eyebrow && <p className="eyebrow flex animate-fade-up items-center gap-2"><Sparkle className="h-2.5 w-2.5" /> {eyebrow}</p>}
        <h1 className="display-lg mt-3 max-w-3xl animate-fade-up text-balance [animation-delay:80ms]">{title}</h1>
        {text && <p className="lead mt-4 max-w-2xl animate-fade-up text-pretty [animation-delay:160ms]">{text}</p>}
        {children}
      </div>
    </section>
  );
}
