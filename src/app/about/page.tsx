import type { Metadata } from "next";
import Link from "next/link";
import { HeartHandshake, Leaf, Award, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us — Our Story",
  description: "Discover the story of Luwombo Restaurant in Kigali: Rwandan heritage cooking, our chef, mission and food philosophy.",
};

const VALUES = [
  { icon: Leaf, title: "Rooted in Rwanda", text: "Banana leaves from Kayonza, tilapia from Lake Kivu, coffee from Nyamasheke hills. Our supply chain is proudly local." },
  { icon: HeartHandshake, title: "Warm hospitality", text: "Murakaza neza means you are most welcome. Every guest leaves as a friend — it is simply how we were raised." },
  { icon: Award, title: "Craft without shortcuts", text: "Slow steam, real charcoal, stock made daily. The traditional way takes longer because it tastes better." },
  { icon: Users, title: "Family tables", text: "High chairs, big platters and patient waiters. Children are not tolerated here; they are celebrated." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="grid items-center gap-10 lg:grid-cols-2">
        <div className="animate-fadeUp">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-600">Our story</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight sm:text-5xl">
            A restaurant named after the dish that raised us
          </h1>
          <p className="mt-5 leading-relaxed text-cocoa/70">
            Luwombo began in a family kitchen in Rubavu, where every celebration meant unwrapping a steaming parcel of banana
            leaves. When founder Aline Kayitesi moved to Kigali, she carried one promise with her: no one should lose that taste.
          </p>
          <p className="mt-4 leading-relaxed text-cocoa/70">
            Today on KG 652 St in Kimihurura, we steam luwombo the slow way, grill brochettes over real charcoal, and press
            passion fruit picked that morning. Traditional at heart, modern in how we serve you — online ordering, QR tables,
            delivery across Kigali.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/menu" className="inline-flex h-12 items-center rounded-xl bg-brand-600 px-6 font-bold text-white hover:bg-brand-700">Explore our menu</Link>
            <Link href="/reservations" className="inline-flex h-12 items-center rounded-xl border border-cocoa/20 px-6 font-bold hover:border-brand-500">Visit us</Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4" aria-hidden="true">
          <div className="aspect-[4/5] rounded-3xl bg-gradient-to-br from-leaf-700 to-leaf-900 p-6 text-white shadow-soft">
            <p className="font-display text-5xl font-extrabold">2019</p>
            <p className="mt-2 text-sm text-white/75">The year our first pot of luwombo was steamed on KG 652 St.</p>
          </div>
          <div className="mt-10 aspect-[4/5] rounded-3xl bg-gradient-to-br from-brand-500 to-brand-800 p-6 text-white shadow-soft">
            <p className="font-display text-5xl font-extrabold">40+</p>
            <p className="mt-2 text-sm text-white/80">Dishes on the menu, half of them recipes from our mothers.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 grid max-w-4xl gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-cocoa/10 bg-white p-7 shadow-card">
          <h2 className="font-display text-2xl font-bold">Our mission</h2>
          <p className="mt-3 leading-relaxed text-cocoa/70">
            To serve Rwanda&apos;s heritage dishes with modern comfort — making every guest feel like they have been invited to
            a family table in Rubavu.
          </p>
        </div>
        <div className="rounded-2xl border border-cocoa/10 bg-white p-7 shadow-card">
          <h2 className="font-display text-2xl font-bold">Our vision</h2>
          <p className="mt-3 leading-relaxed text-cocoa/70">
            A Rwanda where traditional cuisine is the first choice for celebrations, business lunches and everyday dinners —
            at home and around the world.
          </p>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-center font-display text-3xl font-bold">What we stand for</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <article key={v.title} className="rounded-2xl border border-cocoa/10 bg-white p-6 text-center shadow-card">
              <div className="mx-auto flex h-13 w-13 h-[52px] w-[52px] items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                <v.icon className="h-6 w-6" strokeWidth={1.75} />
              </div>
              <h3 className="mt-4 font-bold">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-cocoa/60">{v.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-16 overflow-hidden rounded-3xl bg-leaf-900 text-white" style={{ background: "linear-gradient(120deg,#203C1D,#35702B)" }}>
        <div className="grid gap-8 p-8 sm:p-12 lg:grid-cols-[auto_1fr] lg:items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 font-display text-4xl font-extrabold ring-2 ring-white/30">EN</div>
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-brand-300">Meet the head chef</p>
            <h2 className="mt-2 font-display text-3xl font-bold">Emmanuel Nshimiyimana</h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-white/80">
              Trained in Kigali and Kampala, Chef Emmanuel spent three years collecting family recipes across Rwanda&apos;s five
              provinces before joining Luwombo. His rule for the kitchen: “If grandmother would frown, we start again.”
              His Royal Luwombo Feast is his grandfather&apos;s celebration menu, re-plated.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-16 rounded-3xl border border-cocoa/10 bg-white p-8 text-center shadow-card sm:p-12">
        <h2 className="font-display text-3xl font-bold">Food philosophy</h2>
        <blockquote className="mx-auto mt-5 max-w-2xl font-display text-xl italic leading-relaxed text-cocoa/80 sm:text-2xl">
          “Cook with what grows here, take the time it needs, and serve people like they are family coming home.”
        </blockquote>
        <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-cocoa/40">— Aline Kayitesi, Founder</p>
      </section>
    </div>
  );
}
